// Associations game rules. Pure functions on a plain state object, shared by the local
// practice game and by the Firebase transactions of the 1-vs-1 game.
import { BOARDS, isMatch } from "./boards";

export const TURN_MS = 30000;          // 30 s to act on every turn
export const MAX_STRIKES = 2;          // two turns in a row with no response = the other player wins
export const FINAL_TRIES = 3;          // once every field is open: 3 wrong guesses (shared) end the game
export const IDS = ["A", "B", "C", "D"];
const other = r => (r === "p1" ? "p2" : "p1");

export function pickBoard(exclude = -1) {
  let i = Math.floor(Math.random() * BOARDS.length);
  if (i === exclude) i = (i + 1) % BOARDS.length;
  return i;
}

export function newGame({ boardIdx = pickBoard(), p1, p2 = null, wager = 0, mode = "friend" }) {
  return {
    boardIdx, mode, wager,
    p1, p2,                                   // { id, name }
    status: p2 ? "active" : "waiting",
    opened: {}, colSolved: {}, finalSolved: null,
    scores: { p1: 0, p2: 0 }, strikes: { p1: 0, p2: 0 },
    turn: "p1", turnAt: Date.now(), didOpen: false, acted: false,
    finalTries: FINAL_TRIES, winner: null, reason: "", log: [],
  };
}

// --- helpers (Firebase drops empty objects, so always default) ---
export const board = g => BOARDS[g.boardIdx];
export const opened = g => g.opened || {};
export const colSolved = g => g.colSolved || {};
export const fieldId = (c, i) => `${c}${i + 1}`;
export const allFieldIds = () => IDS.flatMap(c => [0, 1, 2, 3].map(i => fieldId(c, i)));
export const hiddenFields = g => allFieldIds().filter(f => !opened(g)[f] && !colSolved(g)[f[0]]);
export const finalPhase = g => hiddenFields(g).length === 0;
const log = (g, m) => { g.log = [m, ...(g.log || [])].slice(0, 6); };
const clone = g => JSON.parse(JSON.stringify(g));

function nextTurn(g, sameTurn = false) {
  if (!sameTurn) g.turn = other(g.turn);
  g.turnAt = Date.now(); g.didOpen = false; g.acted = false;
}
function finish(g, winner, reason) { g.status = "finished"; g.winner = winner; g.reason = reason; g.finishedAt = Date.now(); }
function endByPoints(g, why) {
  const a = g.scores.p1 || 0, b = g.scores.p2 || 0;
  finish(g, a === b ? "draw" : a > b ? "p1" : "p2", why);
}

// ---------- moves (each returns a new state, or null if the move is not allowed) ----------
export function openField(g0, role, fid) {
  const g = clone(g0);
  if (g.status !== "active" || g.turn !== role || g.didOpen || finalPhase(g)) return null;
  if (!hiddenFields(g).includes(fid)) return null;
  g.opened = { ...opened(g), [fid]: true }; g.didOpen = true; g.acted = true; g.strikes[role] = 0;
  log(g, `${g[role].name} opened ${fid}`);
  return g;
}

export function guessColumn(g0, role, cid, text) {
  const g = clone(g0);
  if (g.status !== "active" || g.turn !== role || colSolved(g)[cid]) return null;
  if (!g.didOpen && !finalPhase(g)) return null;                      // open a field first
  g.acted = true; g.strikes[role] = 0;
  const col = board(g).cols[IDS.indexOf(cid)];
  if (isMatch(text, col.a, col.alt)) {
    const closed = [0, 1, 2, 3].filter(i => !opened(g)[fieldId(cid, i)]).length;
    const pts = 10 + closed * 2;                                       // bonus for every field you didn't need
    g.colSolved = { ...colSolved(g), [cid]: role }; g.scores[role] += pts;
    log(g, `✓ ${g[role].name} solved ${cid}: ${col.a} (+${pts})`);
    nextTurn(g, true);                                                  // correct answer = play again
    return { g, ok: true };
  }
  return { g: wrong(g, role, `✗ ${g[role].name}: "${String(text).trim().slice(0, 20)}" is not ${cid}`), ok: false };
}

export function guessFinal(g0, role, text) {
  const g = clone(g0);
  if (g.status !== "active" || g.turn !== role || g.finalSolved) return null;
  if (!g.didOpen && !finalPhase(g)) return null;
  g.acted = true; g.strikes[role] = 0;
  const b = board(g);
  if (isMatch(text, b.final, b.alt)) {
    const unsolved = IDS.filter(c => !colSolved(g)[c]).length;
    const pts = 20 + unsolved * 5;
    g.finalSolved = role; g.scores[role] += pts;
    log(g, `★ ${g[role].name} solved the final: ${b.final} (+${pts})`);
    finish(g, role, `${g[role].name} solved the final answer`);
    return { g, ok: true };
  }
  return { g: wrong(g, role, `✗ ${g[role].name}: "${String(text).trim().slice(0, 20)}" is not the final`), ok: false };
}

function wrong(g, role, msg) {
  log(g, msg);
  if (finalPhase(g)) {
    g.finalTries = (g.finalTries ?? FINAL_TRIES) - 1;
    if (g.finalTries <= 0) { endByPoints(g, "No guesses left — decided on points"); return g; }
  }
  nextTurn(g);
  return g;
}

export function pass(g0, role) {
  const g = clone(g0);
  if (g.status !== "active" || g.turn !== role || (!g.didOpen && !finalPhase(g))) return null;
  g.strikes[role] = 0;
  log(g, `${g[role].name} passed`);
  nextTurn(g);
  return g;
}

// The 30 s ran out. If the player did nothing at all this turn it counts as "no response":
// a random field is opened for them and the turn passes; the second time in a row the other player wins.
export function timeout(g0) {
  const g = clone(g0);
  if (g.status !== "active") return null;
  const role = g.turn, name = g[role]?.name || role;
  if (g.acted) { log(g, `⏱ ${name}'s time is up`); nextTurn(g); return g; }
  g.strikes[role] = (g.strikes[role] || 0) + 1;
  if (g.strikes[role] >= MAX_STRIKES) {
    log(g, `⏱ ${name} stopped responding`);
    finish(g, other(role), `${name} didn't respond twice in a row`);
    return g;
  }
  const h = hiddenFields(g);
  if (h.length) { const f = h[Math.floor(Math.random() * h.length)]; g.opened = { ...opened(g), [f]: true }; log(g, `⏱ ${name} ran out of time — ${f} opened`); }
  else log(g, `⏱ ${name} ran out of time`);
  nextTurn(g);
  return g;
}

export function forfeit(g0, role) {          // a player left the match
  const g = clone(g0);
  if (g.status !== "active") return null;
  finish(g, other(role), `${g[role]?.name || role} left the game`);
  return g;
}

// ---------- practice bot: opens a field, then guesses when the clues make it likely ----------
export function botPlay(g0) {
  let g = g0; const role = g.turn;
  if (!finalPhase(g) && !g.didOpen) {
    // prefer fields in columns it already has clues for
    const h = hiddenFields(g);
    const score = f => [0, 1, 2, 3].filter(i => opened(g)[fieldId(f[0], i)]).length + Math.random() * 1.5;
    const f = h.sort((x, y) => score(y) - score(x))[0];
    return { g: openField(g, role, f), say: null };
  }
  const b = board(g), op = opened(g);
  const solvedN = IDS.filter(c => colSolved(g)[c]).length;
  // final: more likely the more columns are solved
  if (Math.random() < 0.08 + solvedN * 0.2) {
    const right = Math.random() < 0.35 + solvedN * 0.15;
    const r = guessFinal(g, role, right ? b.final : b.cols[Math.floor(Math.random() * 4)].a);   // a wrong guess still looks human
    return { g: r.g, say: right ? b.final : null };
  }
  const cands = IDS.filter(c => !colSolved(g)[c]).map(c => ({ c, seen: [0, 1, 2, 3].filter(i => op[fieldId(c, i)]).length })).filter(x => x.seen > 0)
    .sort((x, y) => y.seen - x.seen);
  if (cands.length) {
    const { c, seen } = cands[0];
    const chance = [0, 0.15, 0.45, 0.7, 0.9][seen];
    if (Math.random() < chance + 0.1) {
      const right = Math.random() < chance + 0.15;
      const col = b.cols[IDS.indexOf(c)];
      const seenWords = [0, 1, 2, 3].filter(i => op[fieldId(c, i)]).map(i => col.w[i]);
      const r = guessColumn(g, role, c, right ? col.a : seenWords[Math.floor(Math.random() * seenWords.length)]);
      return { g: r.g, say: right ? col.a : null };
    }
  }
  return { g: pass(g, role) || g, say: null };
}
