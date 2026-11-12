/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, runTransaction, remove } from "firebase/database";
import { BOARDS } from "./boards";
import * as G from "./logic";
import { boot, menuMusic, gameMusic, isMuted, setMuted, onMute, sfx } from "./audio";
import { pfStatus, pfDeposit, pfSign, pfSettle, pfRoundUp } from "./pf-pay";

// stakes this device made that still wait for a result or a refund
const PEND = "pf_as_stakes";
const pendingStakes = () => { try { return JSON.parse(localStorage.getItem(PEND) || "[]"); } catch { return []; } };
const savePending = l => { try { localStorage.setItem(PEND, JSON.stringify(l)); } catch {} };
const addPending = x => savePending([...pendingStakes().filter(p => p.sig !== x.sig), x]);
const dropPending = sig => savePending(pendingStakes().filter(p => p.sig !== sig));

const FB = { apiKey: "AIzaSyAKmKRj7Hhy4K6DsY_XDbqLb3oYOwZC5jw", authDomain: "project-freedom-a004e.firebaseapp.com", databaseURL: "https://project-freedom-a004e-default-rtdb.firebaseio.com", projectId: "project-freedom-a004e", storageBucket: "project-freedom-a004e.firebasestorage.app", messagingSenderId: "844172246267", appId: "1:844172246267:web:a31b8cd6affe8337f7845e" };
let db = null; try { db = getDatabase(initializeApp(FB)); } catch (e) {}

const uid = (() => { try { let id = localStorage.getItem("_pgf"); if (!id) { id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2); localStorage.setItem("_pgf", id); } return id; } catch { return "u" + Math.random().toString(36).slice(2); } })();
const roomCode = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const BOT_NAMES = ["Nova", "Echo", "Pixel", "Luna", "Atlas"];

/* ============================== ROOT ============================== */
export default function App() {
  const [screen, setScreen] = useState("lobby");      // lobby | waiting | game
  const [name, setName] = useState(() => { try { return localStorage.getItem("as_name") || ""; } catch { return ""; } });
  const [mode, setMode] = useState(null);             // practice | friend
  const [roomId, setRoomId] = useState(null);
  const [role, setRole] = useState("p1");
  const [local, setLocal] = useState(null);           // practice state
  const [remote, setRemote] = useState(null);         // friend state (from Firebase)
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => { boot(); }, []);
  useEffect(() => { if (screen === "game") gameMusic(); else menuMusic(); }, [screen]);
  useEffect(() => { try { localStorage.setItem("as_name", name); } catch {} }, [name]);

  // live room
  useEffect(() => {
    if (!roomId || !db) return;
    return onValue(ref(db, "games/" + roomId), s => {
      const d = s.val(); if (!d) return;
      setRemote(d);
      if (d.status === "active" || d.status === "finished") setScreen(sc => (sc === "waiting" ? "game" : sc));
    });
  }, [roomId]);

  const me = () => ({ id: uid, name: (name.trim() || "Player").slice(0, 16) });

  function startPractice(exclude) {
    setMode("practice"); setRoomId(null); setRole("p1"); setErr("");
    setLocal(G.newGame({ boardIdx: G.pickBoard(exclude), p1: me(), p2: { id: "bot", name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)], bot: true }, mode: "practice" }));
    setScreen("game");
  }
  async function createRoom(stake = 0) {
    if (!db) { setErr("Online play is unavailable right now."); return; }
    const id = roomCode();
    let extra = {};
    try {
      setErr("");
      if (stake) {
        const pfRoom = id + "-" + Math.random().toString(36).slice(2, 10);
        const r = await pfDeposit({ game: "associations", room: pfRoom, amount: stake, onStatus: setBusy });
        addPending({ room: pfRoom, sig: r.signature, amount: stake, t: Date.now() });
        extra = { stake, pfRoom, p1Tx: r.signature, p1Wallet: r.wallet };
      }
      await set(ref(db, "games/" + id), { ...G.newGame({ p1: me(), mode: "friend" }), createdAt: Date.now(), ...extra });
      setBusy(""); setMode("friend"); setRole("p1"); setRoomId(id); setRemote(null); setScreen("waiting");
    } catch (e) { setBusy(""); setErr(e.message); }
  }
  async function joinRoom(code) {
    const id = code.trim().toUpperCase(); setErr("");
    if (!db || id.length !== 6) { setErr("Enter the 6-letter room code."); return; }
    const snap = await get(ref(db, "games/" + id));
    const d = snap.val();
    if (!d) { setErr(`Room ${id} doesn't exist.`); return; }
    if (d.p1?.id === uid) { setErr("That's your own room — share the code with a friend."); return; }
    if (d.status !== "waiting") { setErr(d.status === "paying" ? "Someone is joining this room right now." : "That game has already started."); return; }
    if (d.stake) {
      if (!window.confirm(`This match has a stake of ${d.stake} FREEDOM from each player. The winner gets ${Math.floor(d.stake * 2 * 0.95)} FREEDOM. Stake and join?`)) return;
      // reserve the seat first, so two people never stake for the same seat
      const hold = await runTransaction(ref(db, "games/" + id), cur => (cur && cur.status === "waiting" ? { ...cur, p2: me(), status: "paying", payingAt: Date.now() } : undefined));
      if (!hold.committed) { setErr("Someone else joined first."); return; }
      try {
        const r = await pfDeposit({ game: "associations", room: d.pfRoom, amount: d.stake, onStatus: setBusy });
        addPending({ room: d.pfRoom, sig: r.signature, amount: d.stake, t: Date.now() });
        await runTransaction(ref(db, "games/" + id), cur => (cur ? { ...cur, p2Tx: r.signature, p2Wallet: r.wallet, status: "active", turn: "p1", turnAt: Date.now(), didOpen: false, acted: false } : cur));
      } catch (e) {
        await runTransaction(ref(db, "games/" + id), cur => (cur && cur.status === "paying" && cur.p2?.id === uid ? { ...cur, p2: null, status: "waiting" } : undefined)).catch(() => {});
        setBusy(""); setErr(e.message); return;
      }
      setBusy("");
    } else {
      const r = await runTransaction(ref(db, "games/" + id), cur => {
        if (!cur) return cur;
        if (cur.status !== "waiting") return;
        return { ...cur, p2: me(), status: "active", turn: "p1", turnAt: Date.now(), didOpen: false, acted: false };
      });
      if (!r.committed) { setErr("Someone else joined first."); return; }
    }
    setMode("friend"); setRole("p2"); setRoomId(id); setScreen("game");
  }
  function leave() {
    if (mode === "friend" && roomId && db) {
      const g = remote;
      if (g?.status === "waiting") { remove(ref(db, "games/" + roomId)).catch(() => {}); if (g.stake) window.alert("Your stake is safe. You can take it back from the lobby 30 minutes after you staked."); }
      else if (g?.status === "active") runTransaction(ref(db, "games/" + roomId), cur => (cur ? G.forfeit(cur, role) || undefined : cur)).catch(() => {});
    }
    setRoomId(null); setRemote(null); setLocal(null); setMode(null); setScreen("lobby");
  }

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
      <MuteButton />
      {screen === "lobby" && <Lobby name={name} setName={setName} err={err} busy={busy} onPractice={() => startPractice()} onCreate={createRoom} onJoin={joinRoom} />}
      {screen === "waiting" && <Waiting code={roomId} g={remote} onCancel={leave} />}
      {screen === "game" && mode === "practice" && local &&
        <Match g={local} role="p1" practice setLocal={setLocal} onLeave={leave} onAgain={() => startPractice(local.boardIdx)} />}
      {screen === "game" && mode === "friend" && remote &&
        <Match g={remote} role={role} roomId={roomId} onLeave={leave} onAgain={leave} />}
      {busy && screen === "lobby" && <div className="overlay"><div className="card narrow"><div className="breath" aria-hidden="true" /><p>{busy}</p></div></div>}
    </div>
  );
}

/* ============================== LOBBY ============================== */
function Lobby({ name, setName, err, onPractice, onCreate, onJoin }) {
  const [code, setCode] = useState("");
  const [st, setSt] = useState(null);
  const [stake, setStake] = useState(0);
  useEffect(() => { pfStatus().then(setSt).catch(() => setSt({})); }, []);
  const ok = name.trim().length > 0;
  return (
    <main className="lobby">
      <header className="brand">
        <div className="logo" aria-hidden="true">
          {["A", "B", "C", "D"].map((l, i) => <span key={l} style={{ animationDelay: `${i * 0.6}s` }}>{l}</span>)}
        </div>
        <h1>Associations</h1>
        <p>Open the clues, find the link, solve the final word.</p>
      </header>

      <section className="card">
        <label className="lbl" htmlFor="nm">Your name</label>
        <input id="nm" className="inp" value={name} maxLength={16} placeholder="Type your name" onChange={e => setName(e.target.value)} />

        <button className="btn primary big" disabled={!ok} onClick={onPractice}>Play vs bot <small>free · instant</small></button>

        <div className="split">
          <button className="btn soft" disabled={!ok} onClick={() => onCreate(stake)}>Invite a friend <small>{stake ? `stake ${stake} FREEDOM` : "create a room · free"}</small></button>
          <form className="join" onSubmit={e => { e.preventDefault(); onJoin(code); }}>
            <input className="inp code" value={code} maxLength={6} placeholder="CODE" aria-label="Room code" onChange={e => setCode(e.target.value.toUpperCase())} />
            <button className="btn soft" disabled={!ok || code.length !== 6}>Join</button>
          </form>
        </div>
        {err && <div className="err" role="alert">{err}</div>}
        {!ok && <div className="hint">Enter your name to start.</div>}

        {st?.enabled ? (
          <div className="stakes">
            <b>Play for FREEDOM</b>
            <span>Stake for your room. The winner gets 95% of both stakes, paid by the Project Freedom payout server after both players confirm.</span>
            <div className="seg">{[0, 100, 500, 1000].map(v => <button key={v} className={"chip" + (stake === v ? " on" : "")} onClick={() => setStake(v)}>{v ? v : "Free"}</button>)}</div>
          </div>
        ) : (
          <div className="paused">
            <b>FREEDOM token matches</b>
            <span>Paused while we upgrade the escrow. Free games are open.</span>
          </div>
        )}
        <PendingStakes />
      </section>

      <section className="card rules">
        <h2>How to play</h2>
        <ol>
          <li><b>Open one field</b> on your turn — every field hides an easy clue word.</li>
          <li><b>Guess a column</b> (A–D) from its clues, or the <b>final</b> word that links all four columns.</li>
          <li><b>Right answer</b> = play again. Wrong answer = the other player's turn.</li>
          <li><b>30 seconds</b> per turn. Run out of time and a random field opens for you.</li>
          <li><b>No response twice in a row</b> and your opponent wins the game.</li>
          <li><b>Solve the final</b> to win. Column +10 (+2 for each closed field) · Final +20 (+5 for each unsolved column).</li>
        </ol>
      </section>
      <footer className="foot"><span className="dg">DEGEN</span><span className="sf">SAFE</span> · Project Freedom</footer>
    </main>
  );
}

function Waiting({ code, g, onCancel }) {
  const [copied, setCopied] = useState(false);
  return (
    <main className="center">
      <div className="card narrow">
        <div className="breath" aria-hidden="true" />
        <h2>Waiting for your friend</h2>
        <p className="muted">{g?.status === "paying" ? "Your friend is staking now…" : "Send them this room code:"}</p>
        {g?.stake ? <p className="muted small">Stake: {g.stake} FREEDOM each · winner gets {Math.floor(g.stake * 2 * 0.95)} FREEDOM</p> : null}
        <button className="codebox" onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {code}<small>{copied ? "copied ✓" : "tap to copy"}</small>
        </button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </main>
  );
}

/* ============================== MATCH ============================== */
function Match({ g, role, practice, setLocal, roomId, onLeave, onAgain }) {
  const b = BOARDS[g.boardIdx];
  const myTurn = g.status === "active" && g.turn === role;
  const final = G.finalPhase(g), over = g.status === "finished";
  const canOpen = myTurn && !g.didOpen && !final;
  const canGuess = myTurn && (g.didOpen || final);
  const [target, setTarget] = useState(null);          // "A".."D" | "F"
  const [text, setText] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);
  const opp = role === "p1" ? "p2" : "p1";

  // ---- apply a move: locally for practice, as a Firebase transaction for 1-vs-1 ----
  const latest = useRef(g); latest.current = g;
  const act = useCallback(async fn => {
    if (practice) { const r = fn(latest.current); if (r) { latest.current = r.g || r; setLocal(latest.current); } return r; }
    let out = null;
    await runTransaction(ref(db, "games/" + roomId), cur => { if (!cur) return cur; const r = fn(cur); if (!r) return; out = r; return r.g || r; }).catch(() => {});
    return out;
  }, [practice, roomId]);

  // ---- shot clock: measured from when this screen saw the turn begin (no clock-skew between players) ----
  const turnKey = g.status === "active" ? `${g.turnAt}|${g.turn}` : "";
  const seen = useRef({ key: "", at: Date.now() });
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    seen.current = { key: turnKey, at: Date.now() }; setNow(Date.now()); setTarget(null); setText("");
    if (!turnKey) return;
    if (g.turn === role) sfx.turn();
    const tick = setInterval(() => setNow(Date.now()), 250);
    const onClock = g[g.turn];
    const mine = g.turn === role;
    // the player on turn enforces their own clock; the opponent backs it up 2.5 s later (covers a closed tab)
    const t = onClock?.bot ? null : setTimeout(() => act(cur => (cur.status === "active" && `${cur.turnAt}|${cur.turn}` === turnKey ? G.timeout(cur) : null)),
      G.TURN_MS + (mine ? 0 : practice ? 0 : 2500));
    return () => { clearInterval(tick); if (t) clearTimeout(t); };
  }, [turnKey]);
  const left = turnKey ? Math.max(0, G.TURN_MS - (now - seen.current.at)) : 0;
  const secs = Math.ceil(left / 1000);
  useEffect(() => { if (myTurn && secs <= 5 && secs > 0) sfx.tick(); }, [secs]);

  // ---- practice bot ----
  useEffect(() => {
    if (!practice || g.status !== "active" || !g[g.turn]?.bot) return;
    const t = setTimeout(() => act(cur => (cur.status === "active" && cur[cur.turn]?.bot ? G.botPlay(cur).g : null)), 1300 + Math.random() * 1400);
    return () => clearTimeout(t);
  }, [practice, g.turnAt, g.didOpen, g.status, g.turn]);

  // ---- sounds for what just happened (works for both players) ----
  const lastLog = useRef((g.log || [])[0] || "");
  useEffect(() => {
    const top = (g.log || [])[0] || ""; if (top === lastLog.current) return; lastLog.current = top;
    if (top.startsWith("★")) sfx.final(); else if (top.startsWith("✓")) sfx.right(); else if (top.startsWith("✗")) sfx.wrong(); else if (/ opened /.test(top)) sfx.open();
  }, [g.log]);
  const winRef = useRef(false);
  useEffect(() => { if (over && !winRef.current) { winRef.current = true; if (g.winner === role && !g.finalSolved) sfx.win(); recordResult(g, role, practice); } }, [over]);

  useEffect(() => { if (target) setTimeout(() => inputRef.current?.focus(), 30); }, [target]);

  async function submit(e) {
    e?.preventDefault(); const v = text.trim(); if (!v || !target) return;
    const r = await act(cur => (target === "F" ? G.guessFinal(cur, role, v) : G.guessColumn(cur, role, target, v)));
    if (r && !r.ok) { setShake(true); setTimeout(() => setShake(false), 450); }
    setText(""); setTarget(null);
  }

  const status = over ? "Game over"
    : !myTurn ? `${g[opp]?.name || "Opponent"} is thinking…`
    : final ? `Final round — guess a column or the final (${g.finalTries ?? G.FINAL_TRIES} tries left)`
    : canOpen ? "Your turn — open a field"
    : "Guess a column or the final word — or pass";

  const showAll = over;
  const solved = G.colSolved(g), opened = G.opened(g);
  const colorOf = r => (r === "p1" ? "var(--p1)" : "var(--p2)");

  const tile = (c, i) => {
    const id = G.fieldId(c, i), by = solved[c], open = opened[id] || by || showAll;
    const word = b.cols[G.IDS.indexOf(c)].w[i];
    if (open) return <div key={id} className={"tile open" + (by ? " solved" : "")} style={by ? { "--c": colorOf(by) } : null}><span>{word}</span></div>;
    return <button key={id} className={"tile closed" + (canOpen ? " can" : "")} disabled={!canOpen} aria-label={`Open field ${id}`}
      onClick={() => act(cur => G.openField(cur, role, id))}>{id}</button>;
  };
  const answer = c => {
    const by = solved[c], col = b.cols[G.IDS.indexOf(c)];
    if (by || showAll) return <div key="ans" className={"ans done" + (by ? "" : " missed")} style={by ? { "--c": colorOf(by) } : null}>{col.a}</div>;
    return <button key="ans" className={"ans" + (canGuess ? " can" : "") + (target === c ? " sel" : "")} disabled={!canGuess} onClick={() => setTarget(c)} aria-label={`Guess column ${c}`}>{c} <em>?</em></button>;
  };
  const column = (c, flip) => (
    <div className={"col" + (flip ? " flip" : "")}>
      {[0, 1, 2, 3].map(i => tile(c, i))}
      {answer(c)}
    </div>
  );

  return (
    <main className="match">
      <div className="topbar">
        <Player p={g[role]} score={g.scores?.[role] || 0} color="var(--p1c)" active={g.turn === role && !over} you strikes={g.strikes?.[role]} />
        <div className="clock" aria-label={over ? "Game over" : `${secs} seconds left`}>
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r="19" className="trk" />
            {!over && <circle cx="22" cy="22" r="19" className="prg" style={{ strokeDashoffset: 119.4 * (1 - left / G.TURN_MS), stroke: secs <= 10 ? "var(--warn)" : myTurn ? "var(--p1)" : "var(--p2)" }} />}
          </svg>
          <b>{over ? "★" : secs}</b>
        </div>
        <Player p={g[opp]} score={g.scores?.[opp] || 0} color="var(--p2c)" active={g.turn === opp && !over} right strikes={g.strikes?.[opp]} />
      </div>
      <div className={"status" + (myTurn ? " mine" : "")}>{status}</div>

      <div className={"board" + (shake ? " shake" : "")}>
        <div className="half">{column("A")}{column("B")}</div>
        <div className="finalrow">
          {g.finalSolved || showAll
            ? <div className={"final done" + (g.finalSolved ? "" : " missed")} style={g.finalSolved ? { "--c": colorOf(g.finalSolved) } : null}>{b.final}</div>
            : <button className={"final" + (canGuess ? " can" : "") + (target === "F" ? " sel" : "")} disabled={!canGuess} onClick={() => setTarget("F")}>Final word <em>?</em></button>}
        </div>
        <div className="half bottom">{column("C", true)}{column("D", true)}</div>
      </div>

      <div className="dock">
        {target && canGuess ? (
          <form className="guess" onSubmit={submit}>
            <span className="tag">{target === "F" ? "Final" : `Column ${target}`}</span>
            <input ref={inputRef} autoFocus className="inp" value={text} maxLength={24} placeholder="Type your answer…" onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Escape" && setTarget(null)} />
            <button className="btn primary">Guess</button>
            <button type="button" className="btn ghost" onClick={() => setTarget(null)} aria-label="Cancel guess">✕</button>
          </form>
        ) : (
          <div className="actions">
            {canGuess && !final && <button className="btn soft" onClick={() => act(cur => G.pass(cur, role))}>Pass</button>}
            <ul className="log">{(g.log || []).slice(0, 3).map((l, i) => <li key={i + l} style={{ opacity: 1 - i * 0.3 }}>{l}</li>)}</ul>
            <button className="btn ghost small" onClick={onLeave}>Leave</button>
          </div>
        )}
      </div>

      {over && <EndCard g={g} role={role} practice={practice} roomId={roomId} onAgain={onAgain} onLeave={onLeave} />}
    </main>
  );
}

function Player({ p, score, color, active, you, right, strikes }) {
  return (
    <div className={"player" + (active ? " on" : "") + (right ? " right" : "")} style={{ "--pc": color }}>
      <div className="avatar">{(p?.name || "?").slice(0, 1).toUpperCase()}</div>
      <div className="pinfo">
        <span className="pname">{p?.name || "Waiting…"}{you && <i> (you)</i>}</span>
        <span className="pscore">{score}</span>
        {strikes > 0 && <span className="warn">missed a turn</span>}
      </div>
    </div>
  );
}

function EndCard({ g, role, practice, roomId, onAgain, onLeave }) {
  const draw = g.winner === "draw", won = g.winner === role;
  return (
    <div className="overlay" role="dialog" aria-label="Game result">
      <div className="card end">
        <div className="big">{draw ? "🤝" : won ? "🏆" : "🌙"}</div>
        <h2>{draw ? "It's a draw" : won ? "You win!" : `${g[g.winner]?.name || "Opponent"} wins`}</h2>
        <p className="muted">{g.reason}</p>
        <div className="scores"><span>{g[role]?.name}: <b>{g.scores?.[role] || 0}</b></span><span>{g[role === "p1" ? "p2" : "p1"]?.name}: <b>{g.scores?.[role === "p1" ? "p2" : "p1"] || 0}</b></span></div>
        <p className="muted small">The full board is shown behind this card.</p>
        {!practice && g.stake ? <StakeBox g={g} role={role} roomId={roomId} /> : null}
        <div className="row">
          <button className="btn primary" onClick={onAgain}>{practice ? "Play again" : "Back to lobby"}</button>
          {practice && <button className="btn ghost" onClick={onLeave}>Lobby</button>}
        </div>
      </div>
    </div>
  );
}

// Both players sign the result in Phantom (free, nothing leaves the wallet); with both signatures the
// payout server pays. Signatures travel through this game's room in the database.
function StakeBox({ g, roomId }) {
  const [msg, setMsg] = useState("Checking stakes on the blockchain…");
  const [round, setRound] = useState(null);
  const [signed, setSigned] = useState(false);
  const [askable, setAskable] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let alive = true;
    pfRoundUp({
      game: "associations", room: g.pfRoom, deposits: [g.p1Tx, g.p2Tx],
      resultFrom: chk => (g.winner === "draw" ? "draw" : chk.find(x => x.sig === g[g.winner + "Tx"]).player),
      store: {
        put: (w, sig) => set(ref(db, `games/${roomId}/pfsigs/${w}`), sig),
        watch: cb => onValue(ref(db, `games/${roomId}/pfsigs`), s => cb(s.val() || {})),
      },
      onStatus: t => alive && setMsg(t),
      onPaid: r => { if (!alive) return; setDone(true); [g.p1Tx, g.p2Tx].forEach(dropPending); setMsg(r ? (r.kind === "draw" ? "Both stakes returned." : `Paid ${r.transfers[0].amount} FREEDOM to the winner ✅`) : "This match has already been paid out."); },
    }).then(rd => { if (alive) { setRound(rd); setMsg("Confirm the result so the match closes. Free, nothing leaves your wallet."); } })
      .catch(e => alive && setMsg(e.message));
    const t = setTimeout(() => alive && setAskable(true), 180000);
    return () => { alive = false; clearTimeout(t); };
  }, []);
  return (
    <div className="stakebox">
      <p>{msg}</p>
      {round && !signed && !done && <button className="btn primary" onClick={async () => { try { await round.sign(); setSigned(true); } catch (e) { setMsg(e.message); } }}>✍ Confirm result</button>}
      {round && signed && askable && !done && <button className="btn ghost small" onClick={async () => { try { await round.ask(); setMsg("The owner was notified and will decide."); } catch (e) { setMsg(e.message); } }}>Opponent won't confirm? Ask the owner</button>}
    </div>
  );
}

function PendingStakes() {
  const [list, setList] = useState(pendingStakes);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 30000); return () => clearInterval(t); }, []);
  if (!list.length) return null;
  const refund = async x => {
    try {
      const sg = await pfSign({ game: "associations", room: x.room, result: "refund", deposits: [x.sig] });
      await pfSettle({ game: "associations", room: x.room, result: "refund", deposits: [x.sig], signatures: { [sg.wallet]: sg.signature } });
      dropPending(x.sig); setList(pendingStakes()); window.alert("Your stake is on its way back ✅");
    } catch (e) { if (/already been paid/i.test(e.message)) { dropPending(x.sig); setList(pendingStakes()); } window.alert(e.message); }
  };
  return (
    <div className="stakes">
      <b>Your stakes waiting for a result</b>
      {list.map(x => { const mins = Math.ceil(31 - (Date.now() - x.t) / 60000); return (
        <div key={x.sig} className="pend"><span>{x.amount} FREEDOM · room {x.room.split("-")[0]}</span>
          <button className="btn ghost small" disabled={mins > 0} onClick={() => refund(x)}>{mins > 0 ? `Refund in ${mins} min` : "Get my stake back"}</button></div>); })}
    </div>
  );
}

function MuteButton() {
  const [m, setM] = useState(isMuted());
  useEffect(() => onMute(setM), []);
  return <button className="mute" onClick={() => setMuted(!m)} aria-label={m ? "Turn sound on" : "Mute sound"} title={m ? "Sound off" : "Sound on"}>{m ? "🔇" : "🔊"}</button>;
}

// leaderboard (1-vs-1 only): every player updates their own row once
async function recordResult(g, role, practice) {
  if (practice || !db) return;
  const me = g[role]; if (!me?.id) return;
  try {
    const r = ref(db, "leaderboard/" + me.id); const cur = (await get(r)).val() || {};
    await set(r, { name: me.name, wins: (cur.wins || 0) + (g.winner === role ? 1 : 0), losses: (cur.losses || 0) + (g.winner !== role && g.winner !== "draw" ? 1 : 0), draws: (cur.draws || 0) + (g.winner === "draw" ? 1 : 0), points: (cur.points || 0) + (g.scores?.[role] || 0) });
  } catch (e) {}
}

/* ============================== STYLE ============================== */
const CSS = `
:root{--bg1:#0b1226;--bg2:#06171c;--ink:#eef4ff;--mute:rgba(226,236,255,.62);--glass:rgba(255,255,255,.06);--line:rgba(255,255,255,.12);
  --p1:#5eead4;--p2:#c4b5fd;--p1c:#2dd4bf;--p2c:#a78bfa;--gold:#fcd34d;--warn:#fb7185}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body,#root{height:100%}
body{background:radial-gradient(120% 90% at 20% 0%,#16224a 0%,var(--bg1) 45%,var(--bg2) 100%);color:var(--ink);font-family:'Outfit',system-ui,sans-serif;overflow-x:hidden}
button{font-family:inherit;color:inherit;cursor:pointer;border:0;background:none}button:disabled{cursor:default}
.app{min-height:100%;position:relative;isolation:isolate}
.aurora{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}
.aurora i{position:absolute;width:55vmax;height:55vmax;border-radius:50%;filter:blur(70px);opacity:.28;will-change:transform}
.aurora i:nth-child(1){background:#2dd4bf;left:-15vmax;top:-20vmax;animation:drift 26s ease-in-out infinite alternate}
.aurora i:nth-child(2){background:#7c3aed;right:-20vmax;top:10vmax;opacity:.22;animation:drift 32s ease-in-out infinite alternate-reverse}
.aurora i:nth-child(3){background:#0ea5e9;left:20vmax;bottom:-30vmax;opacity:.18;animation:drift 38s ease-in-out infinite alternate}
@keyframes drift{to{transform:translate(8vmax,6vmax) scale(1.12)}}
.card{background:linear-gradient(160deg,rgba(255,255,255,.09),rgba(255,255,255,.03));border:1px solid var(--line);border-radius:22px;padding:22px;
  box-shadow:0 20px 50px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.btn{border-radius:14px;padding:12px 18px;font-weight:600;font-size:16px;transition:transform .15s,filter .2s,background .2s,opacity .2s;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.btn small{font-size:12px;font-weight:500;opacity:.75}
.btn:not(:disabled):hover{filter:brightness(1.08);transform:translateY(-1px)}.btn:disabled{opacity:.4}
.btn.primary{background:linear-gradient(135deg,#5eead4,#38bdf8);color:#062a2a;box-shadow:0 8px 24px rgba(45,212,191,.28)}
.btn.soft{background:rgba(196,181,253,.14);border:1px solid rgba(196,181,253,.35)}
.btn.ghost{background:rgba(255,255,255,.06);border:1px solid var(--line)}
.btn.big{width:100%;padding:16px;font-size:19px;margin-top:16px}.btn.small{padding:8px 12px;font-size:14px}
.inp{width:100%;background:rgba(0,0,0,.25);border:1px solid var(--line);border-radius:14px;padding:13px 14px;color:var(--ink);font:500 17px 'Outfit',sans-serif;outline:none;transition:border-color .2s,box-shadow .2s}
.inp:focus{border-color:var(--p1);box-shadow:0 0 0 4px rgba(94,234,212,.15)}
.lbl{display:block;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-bottom:8px}
.muted{color:var(--mute)}.small{font-size:13px}
.err{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(251,113,133,.12);border:1px solid rgba(251,113,133,.35);color:#fecdd3;font-size:14px}
.hint{margin-top:10px;font-size:13px;color:var(--mute);text-align:center}
.mute{position:fixed;top:14px;right:14px;z-index:50;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid var(--line);font-size:19px;backdrop-filter:blur(8px)}

/* lobby */
.lobby{max-width:560px;margin:0 auto;padding:46px 18px 28px;display:grid;gap:18px}
.brand{text-align:center}
.logo{display:inline-grid;grid-template-columns:repeat(2,34px);gap:6px;margin-bottom:14px}
.logo span{height:34px;border-radius:10px;display:grid;place-items:center;font-weight:700;background:rgba(94,234,212,.14);border:1px solid rgba(94,234,212,.35);color:var(--p1);animation:breathe 4.8s ease-in-out infinite}
.logo span:nth-child(even){background:rgba(196,181,253,.14);border-color:rgba(196,181,253,.35);color:var(--p2)}
@keyframes breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.06);opacity:1}}
.brand h1{font-size:44px;font-weight:700;letter-spacing:.01em;background:linear-gradient(90deg,#e0fdf8,#c4b5fd);-webkit-background-clip:text;background-clip:text;color:transparent}
.brand p{color:var(--mute);margin-top:6px;font-size:17px}
.split{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.join{display:flex;gap:8px}.inp.code{text-transform:uppercase;letter-spacing:.3em;text-align:center;font-weight:700;padding:10px}
.paused{margin-top:16px;padding:12px 14px;border-radius:14px;background:rgba(252,211,77,.07);border:1px dashed rgba(252,211,77,.35);display:grid;gap:2px;font-size:14px}
.paused b{color:var(--gold);font-weight:600}.paused span{color:var(--mute)}
.stakes{margin-top:16px;padding:12px 14px;border-radius:14px;background:rgba(94,234,212,.06);border:1px solid rgba(94,234,212,.25);display:grid;gap:6px;font-size:14px}
.stakes b{color:#5eead4;font-weight:600}.stakes span{color:var(--mute)}
.seg{display:flex;gap:6px;flex-wrap:wrap}.chip{padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid var(--line);font-weight:600;font-size:14px}.chip.on{background:#5eead4;color:#062a2a;border-color:#5eead4}
.pend{display:flex;justify-content:space-between;align-items:center;gap:10px}
.stakebox{margin:12px 0;padding:12px;border-radius:14px;background:rgba(94,234,212,.06);border:1px solid rgba(94,234,212,.25);display:grid;gap:8px;font-size:14px}
.rules h2{font-size:18px;margin-bottom:10px;font-weight:600}
.rules ol{padding-left:20px;display:grid;gap:7px;color:var(--mute);font-size:15px;line-height:1.45}.rules b{color:var(--ink);font-weight:600}
.foot{text-align:center;font-size:13px;color:var(--mute);letter-spacing:.1em}.dg{color:#b07bff;font-weight:700}.sf{color:#8dff4a;font-weight:700}

.center{min-height:100vh;display:grid;place-items:center;padding:20px}.narrow{max-width:400px;width:100%;text-align:center;display:grid;gap:12px;justify-items:center}
.breath{width:64px;height:64px;border-radius:50%;background:radial-gradient(circle,var(--p1),transparent 70%);animation:breathe 3s ease-in-out infinite}
.codebox{font:700 40px 'Outfit',sans-serif;letter-spacing:.3em;padding:14px 22px 10px;border-radius:18px;background:rgba(94,234,212,.1);border:1px solid rgba(94,234,212,.4);color:var(--p1);display:grid}
.codebox small{font-size:12px;letter-spacing:.1em;color:var(--mute);font-weight:500}

/* match */
.match{height:100vh;height:100dvh;display:flex;flex-direction:column;max-width:980px;margin:0 auto;padding:12px 14px 10px}
.topbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding-right:52px}
.player{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:16px;border:1px solid transparent;transition:all .4s}
.player.right{flex-direction:row-reverse;text-align:right}
.player.on{background:rgba(255,255,255,.06);border-color:color-mix(in srgb,var(--pc) 50%,transparent);box-shadow:0 0 24px color-mix(in srgb,var(--pc) 25%,transparent)}
.avatar{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:19px;color:#071a1f;background:var(--pc);flex-shrink:0}
.pinfo{display:grid;line-height:1.1;min-width:0}.pname{font-size:14px;color:var(--mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pname i{font-style:normal;opacity:.6}
.pscore{font-size:26px;font-weight:700}.warn{font-size:11px;color:var(--warn)}
.clock{position:relative;width:58px;height:58px;display:grid;place-items:center}
.clock svg{position:absolute;inset:0;transform:rotate(-90deg)}
.clock circle{fill:none;stroke-width:3.5}.clock .trk{stroke:rgba(255,255,255,.1)}
.clock .prg{stroke-dasharray:119.4;stroke-linecap:round;transition:stroke-dashoffset .25s linear,stroke .3s}
.clock b{font-size:19px;font-weight:700}
.status{text-align:center;margin:8px 0 10px;font-size:16px;color:var(--mute);min-height:22px;transition:color .3s}.status.mine{color:var(--p1)}

.board{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:clamp(6px,1.4vh,12px)}
.half{display:grid;grid-template-columns:1fr 1fr;gap:clamp(10px,3vw,40px)}
.col{display:flex;flex-direction:column;gap:clamp(5px,1vh,8px)}.col.flip{flex-direction:column-reverse}
.tile,.ans,.final{height:clamp(34px,6vh,52px);border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:clamp(14px,1.9vh,18px);transition:all .35s cubic-bezier(.2,.8,.2,1);text-align:center;padding:0 10px}
.tile.closed{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.35);letter-spacing:.08em;font-size:clamp(12px,1.6vh,15px)}
.tile.closed.can{color:var(--p1);border-color:rgba(94,234,212,.4);background:rgba(94,234,212,.08);animation:glow 2.4s ease-in-out infinite}
.tile.closed.can:hover{background:rgba(94,234,212,.18);transform:translateY(-1px)}
@keyframes glow{0%,100%{box-shadow:0 0 0 rgba(94,234,212,0)}50%{box-shadow:0 0 18px rgba(94,234,212,.25)}}
.tile.open{background:rgba(240,249,255,.92);color:#0b1a2e;border:1px solid #fff;animation:flipIn .45s ease both}
.tile.open.solved{background:color-mix(in srgb,var(--c) 26%,#0b1a2e);color:#fff;border-color:color-mix(in srgb,var(--c) 55%,transparent)}
@keyframes flipIn{from{transform:rotateX(80deg);opacity:.2}to{transform:none;opacity:1}}
.ans{background:rgba(0,0,0,.2);border:1.5px dashed rgba(255,255,255,.18);color:rgba(255,255,255,.45);gap:6px}
.ans em,.final em{font-style:normal;opacity:.7}
.ans.can{border-color:rgba(196,181,253,.6);color:var(--p2)}.ans.can:hover,.ans.sel{background:rgba(196,181,253,.14)}
.ans.sel,.final.sel{border-style:solid;box-shadow:0 0 0 4px rgba(196,181,253,.15)}
.ans.done,.final.done{background:var(--c);color:#071a1f;border:0;font-weight:700;letter-spacing:.06em;animation:pop .5s ease both}
.ans.missed,.final.missed{background:rgba(255,255,255,.1);color:var(--ink)}
@keyframes pop{0%{transform:scale(.92);opacity:.4}60%{transform:scale(1.03)}100%{transform:none;opacity:1}}
.finalrow{display:flex;justify-content:center;margin:clamp(2px,.8vh,8px) 0}
.final{width:min(380px,70%);height:clamp(44px,7.5vh,64px);border-radius:18px;font-size:clamp(16px,2.2vh,21px);background:rgba(252,211,77,.07);border:1.5px dashed rgba(252,211,77,.45);color:var(--gold);gap:8px}
.final.can{animation:glowGold 2.6s ease-in-out infinite}.final.can:hover,.final.sel{background:rgba(252,211,77,.16)}
@keyframes glowGold{0%,100%{box-shadow:0 0 0 rgba(252,211,77,0)}50%{box-shadow:0 0 26px rgba(252,211,77,.25)}}
.shake{animation:shake .45s ease}@keyframes shake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}

.dock{margin-top:10px;min-height:56px}
.guess{display:flex;gap:8px;align-items:center;background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:18px;padding:8px}
.guess .inp{flex:1;padding:11px 12px}.tag{font-size:13px;color:var(--p2);font-weight:600;padding:0 6px;white-space:nowrap}
.actions{display:flex;gap:10px;align-items:center}
.log{flex:1;list-style:none;font-size:13px;color:var(--mute);display:grid;gap:2px;min-width:0}
.log li{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.overlay{position:fixed;inset:0;z-index:40;display:grid;place-items:end center;padding:18px;background:linear-gradient(180deg,transparent 30%,rgba(5,10,24,.75));animation:fade .5s ease}
@keyframes fade{from{opacity:0}}
.end{width:min(440px,100%);text-align:center;display:grid;gap:10px;justify-items:center}
.end .big{font-size:46px}.end h2{font-size:28px}.scores{display:flex;gap:18px;font-size:16px}.row{display:flex;gap:10px}

@media (max-width:640px){
  .lobby{padding-top:64px}.brand h1{font-size:36px}.split{grid-template-columns:1fr}
  .topbar{gap:6px;padding-right:48px}.player{padding:6px;gap:7px}.avatar{width:34px;height:34px;font-size:16px}.pscore{font-size:21px}
  .clock{width:50px;height:50px}.half{gap:8px}.tile,.ans{border-radius:11px;padding:0 6px}
  .log{display:none}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;
