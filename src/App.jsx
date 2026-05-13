import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";

/* ─── FIREBASE (no Auth) ─── */
const firebaseConfig = {
  apiKey: "AIzaSyAKmKRj7Hhy4K6DsY_XDbqLb3oYOwZC5jw",
  authDomain: "project-freedom-a004e.firebaseapp.com",
  databaseURL: "https://project-freedom-a004e-default-rtdb.firebaseio.com",
  projectId: "project-freedom-a004e",
  storageBucket: "project-freedom-a004e.firebasestorage.app",
  messagingSenderId: "844172246267",
  appId: "1:844172246267:web:a31b8cd6affe8337f7845e",
};

let db;
try {
  const fbApp = initializeApp(firebaseConfig);
  db = getDatabase(fbApp);
} catch(e) {
  console.error("Firebase init error:", e);
}

/* ─── USER ID via localStorage (no Firebase Auth needed) ─── */
function getUserId() {
  try {
    let id = localStorage.getItem("pgf_uid");
    if (!id) {
      id = "u_" + Math.random().toString(36).slice(2, 12);
      localStorage.setItem("pgf_uid", id);
    }
    return id;
  } catch {
    return "u_" + Math.random().toString(36).slice(2, 12);
  }
}

/* ─── CONSTANTS ─── */
const ESCROW = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS = [100, 500, 1000];
const TURN_SEC = 30;
const IDLE_SEC = 60;
const CA = "#e53935";
const CB = "#1e88e5";

/* ─── PHANTOM ─── */
async function connectPhantom() {
  try {
    if (!window.solana?.isPhantom) {
      window.open("https://phantom.app/", "_blank");
      return null;
    }
    const r = await window.solana.connect();
    return r.publicKey.toString();
  } catch { return null; }
}

async function signWager(amount) {
  try {
    if (!window.solana?.isPhantom) return { ok: false, err: "No Phantom" };
    await window.solana.signMessage(
      new TextEncoder().encode(`Wager ${amount} FREEDOM to ${ESCROW}`), "utf8"
    );
    return { ok: true, id: "SIG_" + Date.now() };
  } catch (e) { return { ok: false, err: e.message }; }
}

/* ─── AI BOARD ─── */
async function makeBoard() {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [{ role: "user", content: `Make a word association board in English. Return ONLY raw JSON, no markdown.
{"columns":[{"id":"A","theme":"THEME","fields":[{"id":"A1","clue":"clue","answer":"ANSWER"},{"id":"A2","clue":"clue","answer":"ANSWER"},{"id":"A3","clue":"clue","answer":"ANSWER"},{"id":"A4","clue":"clue","answer":"ANSWER"}]},{"id":"B","theme":"THEME","fields":[{"id":"B1","clue":"clue","answer":"ANSWER"},{"id":"B2","clue":"clue","answer":"ANSWER"},{"id":"B3","clue":"clue","answer":"ANSWER"},{"id":"B4","clue":"clue","answer":"ANSWER"}]},{"id":"C","theme":"THEME","fields":[{"id":"C1","clue":"clue","answer":"ANSWER"},{"id":"C2","clue":"clue","answer":"ANSWER"},{"id":"C3","clue":"clue","answer":"ANSWER"},{"id":"C4","clue":"clue","answer":"ANSWER"}]},{"id":"D","theme":"THEME","fields":[{"id":"D1","clue":"clue","answer":"ANSWER"},{"id":"D2","clue":"clue","answer":"ANSWER"},{"id":"D3","clue":"clue","answer":"ANSWER"},{"id":"D4","clue":"clue","answer":"ANSWER"}]}],"final":{"answer":"ANSWER","hint":"hint"}}
4 different themes, English clues max 3 words, single CAPS word answers, final is supercategory of all 4.` }]
      })
    });
    const d = await r.json();
    return JSON.parse(d.content[0].text.replace(/```json|```/g, "").trim());
  } catch { return FALLBACK; }
}

const FALLBACK = {
  columns: [
    { id: "A", theme: "ANIMALS", fields: [{ id: "A1", clue: "King of jungle", answer: "LION" }, { id: "A2", clue: "Black & white", answer: "ZEBRA" }, { id: "A3", clue: "Long neck", answer: "GIRAFFE" }, { id: "A4", clue: "Trunk & tusks", answer: "ELEPHANT" }] },
    { id: "B", theme: "INSTRUMENTS", fields: [{ id: "B1", clue: "6 strings", answer: "GUITAR" }, { id: "B2", clue: "88 keys", answer: "PIANO" }, { id: "B3", clue: "You hit it", answer: "DRUM" }, { id: "B4", clue: "Brass wind", answer: "TRUMPET" }] },
    { id: "C", theme: "SPORTS", fields: [{ id: "C1", clue: "Court & net", answer: "TENNIS" }, { id: "C2", clue: "Ice & skates", answer: "HOCKEY" }, { id: "C3", clue: "Pool & swim", answer: "SWIMMING" }, { id: "C4", clue: "The octagon", answer: "MMA" }] },
    { id: "D", theme: "FOOD", fields: [{ id: "D1", clue: "Italian pie", answer: "PIZZA" }, { id: "D2", clue: "Japanese roll", answer: "SUSHI" }, { id: "D3", clue: "Mexican wrap", answer: "BURRITO" }, { id: "D4", clue: "French bread", answer: "BAGUETTE" }] },
  ],
  final: { answer: "FREEDOM", hint: "Project Freedom" }
};

function nrm(s) { return s.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function hit(a, b) { return nrm(a) === nrm(b); }
function genId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

/* ─── FIELD BUTTON ─── */
function FieldBtn({ field, state, canOpen, color, onOpen }) {
  const bg = color === CA ? "#c62828" : "#1565c0";
  const base = { width: "100%", height: 54, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, padding: "0 8px", boxSizing: "border-box", userSelect: "none", border: "none", fontFamily: "inherit", transition: "opacity .15s", cursor: canOpen && state === "hidden" ? "pointer" : "default" };
  if (state === "solved") return (
    <div style={{ ...base, background: bg, boxShadow: "0 3px 0 rgba(0,0,0,.35)" }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: .5, textAlign: "center" }}>{field.answer}</div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,.7)", textAlign: "center" }}>{field.clue}</div>
    </div>
  );
  if (state === "clue") return (
    <div style={{ ...base, background: bg, boxShadow: "0 3px 0 rgba(0,0,0,.35)", border: "2px solid #fff" }}>
      <div style={{ fontSize: 8, color: "rgba(255,255,255,.8)" }}>CLUE</div>
      <div style={{ fontSize: 12, color: "#fff", textAlign: "center", fontWeight: 700 }}>{field.clue}</div>
    </div>
  );
  return (
    <div onClick={canOpen ? () => onOpen(field.id) : undefined}
      style={{ ...base, background: canOpen ? "#3a4a6b" : "#2a3555", boxShadow: canOpen ? "0 3px 0 rgba(0,0,0,.4)" : "none", opacity: canOpen ? 1 : 0.65 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: canOpen ? "#a0b4d0" : "#4a5a7a", letterSpacing: 1 }}>{field.id}</div>
    </div>
  );
}

/* ─── THEME BTN ─── */
function ThemeBtn({ colId, solved, theme, disabled, onGuess }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);
  const color = colId === "A" || colId === "C" ? CA : CB;
  const bg = colId === "A" || colId === "C" ? "#c62828" : "#1565c0";

  if (solved) return (
    <div style={{ ...TB, background: bg, boxShadow: "0 3px 0 rgba(0,0,0,.35)" }}>
      <span style={{ fontSize: 12, fontWeight: 900, color: "#fff", letterSpacing: .5, textAlign: "center", padding: "0 4px" }}>✓ {theme}</span>
    </div>
  );

  const submit = () => {
    if (!v.trim()) return;
    if (!onGuess(v)) { setErr(true); setTimeout(() => setErr(false), 600); }
    else { setV(""); setEditing(false); }
  };

  if (!disabled && editing) return (
    <div style={{ ...TB, background: "#fff", animation: err ? "shake .4s" : "none", padding: "0 8px", gap: 6 }}>
      <input value={v} onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") setEditing(false); }}
        placeholder={`Column ${colId} theme...`} autoFocus
        style={{ flex: 1, background: "transparent", border: "none", fontSize: 13, fontWeight: 700, outline: "none", fontFamily: "inherit", color: "#1a2a4a" }} />
      <button onClick={submit} style={{ background: bg, border: "none", borderRadius: 8, padding: "6px 12px", color: "#fff", fontWeight: 900, cursor: "pointer", fontSize: 12, flexShrink: 0 }}>OK</button>
      <button onClick={() => setEditing(false)} style={{ background: "#eee", border: "none", borderRadius: 8, padding: "6px 8px", color: "#666", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>✕</button>
    </div>
  );

  return (
    <div onClick={disabled ? undefined : () => setEditing(true)}
      style={{ ...TB, background: "rgba(255,255,255,.1)", border: `2px dashed ${disabled ? "#3a4a6b" : color}`, cursor: disabled ? "default" : "pointer" }}>
      <span style={{ fontSize: 22, color: disabled ? "#3a4a6b" : color, fontWeight: 900 }}>?</span>
    </div>
  );
}
const TB = { width: "100%", height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 0 rgba(0,0,0,.3)", transition: "all .15s", userSelect: "none", boxSizing: "border-box" };

/* ─── FINAL BTN ─── */
function FinalBtn({ solved, answer, disabled, onGuess }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);

  if (solved) return (
    <div style={{ ...FBs, background: "#f59e0b", boxShadow: "0 4px 0 rgba(0,0,0,.4)" }}>
      <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>✓ {answer}</span>
    </div>
  );

  const submit = () => {
    if (!v.trim()) return;
    if (!onGuess(v)) { setErr(true); setTimeout(() => setErr(false), 600); }
    else { setV(""); setEditing(false); }
  };

  if (!disabled && editing) return (
    <div style={{ ...FBs, background: "#fff", animation: err ? "shake .4s" : "none", flexDirection: "row", padding: "0 10px", gap: 8 }}>
      <input value={v} onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") setEditing(false); }}
        placeholder="Final answer..." autoFocus
        style={{ flex: 1, background: "transparent", border: "none", fontSize: 15, fontWeight: 700, outline: "none", fontFamily: "inherit", color: "#1a2a4a", textAlign: "center" }} />
      <button onClick={submit} style={{ background: "#f59e0b", border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", fontWeight: 900, cursor: "pointer", fontSize: 13, flexShrink: 0 }}>OK</button>
    </div>
  );

  return (
    <div onClick={disabled ? undefined : () => setEditing(true)}
      style={{ ...FBs, background: disabled ? "#2a3555" : "rgba(255,255,255,.1)", border: `3px dashed ${disabled ? "#3a4a6b" : "#f59e0b"}`, cursor: disabled ? "default" : "pointer" }}>
      <span style={{ fontSize: 28, color: disabled ? "#3a4a6b" : "#f59e0b", fontWeight: 900 }}>?</span>
    </div>
  );
}
const FBs = { width: "100%", height: 58, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", boxShadow: "0 4px 0 rgba(0,0,0,.4)", transition: "all .15s", userSelect: "none", boxSizing: "border-box" };

function Spin({ msg }) {
  return (
    <div style={ROOT}><style>{CSS}</style>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <div style={{ width: 52, height: 52, border: "4px solid rgba(255,255,255,.1)", borderTop: "4px solid #f59e0b", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13, letterSpacing: 2 }}>{msg}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════════════ */
export default function App() {
  // Use simple localStorage ID instead of Firebase Auth
  const [uid] = useState(() => getUserId());
  const [scr, setScr] = useState("lobby");
  const [nm, setNm] = useState("");
  const [wager, setWager] = useState(100);
  const [mode, setMode] = useState("create");
  const [jin, setJin] = useState("");
  const [jerr, setJerr] = useState("");
  const [wallet, setWallet] = useState(null);
  const [wload, setWload] = useState(false);
  const [ldmsg, setLdmsg] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [gs, setGs] = useState(null);
  const [started, setStarted] = useState(false);
  const [ttimer, setTtimer] = useState(TURN_SEC);
  const [itimer, setItimer] = useState(IDLE_SEC);
  const [didOpen, setDidOpen] = useState(false);
  const [log, setLog] = useState([]);

  const tRef = useRef();
  const iRef = useRef();
  const lastAct = useRef(Date.now());
  const rRef = useRef(null);

  const L = m => setLog(p => [m, ...p].slice(0, 4));
  const touch = () => { lastAct.current = Date.now(); setItimer(IDLE_SEC); };

  // Auto-connect Phantom if available
  useEffect(() => {
    try {
      if (window.solana?.isPhantom && window.solana.publicKey) {
        setWallet(window.solana.publicKey.toString());
      }
    } catch { }
  }, []);

  // Firebase rules need to allow reads/writes without auth
  // Set database rules to: { "rules": { ".read": true, ".write": true } }

  // Listen to game
  useEffect(() => {
    if (!roomId || !db) return;
    try {
      rRef.current = ref(db, `games/${roomId}`);
      const unsub = onValue(rRef.current, snap => {
        const d = snap.val();
        if (!d) return;
        setGs(d);
        if (d.status === "finished") setScr("result");
        if (d.status === "active" && d.p1 && d.p2 && !started) {
          setStarted(true);
          lastAct.current = Date.now();
        }
      });
      return () => unsub();
    } catch (e) { console.error(e); }
  }, [roomId, started]);

  // Turn timer
  useEffect(() => {
    if (scr !== "game" || !started || !gs) return;
    if (gs.status === "finished" || gs.finalPhase || gs.currentTurn !== myRole) return;
    clearInterval(tRef.current);
    setTtimer(TURN_SEC);
    tRef.current = setInterval(() => {
      setTtimer(t => {
        if (t <= 1) { clearInterval(tRef.current); autoReveal(); return TURN_SEC; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tRef.current);
  }, [gs?.currentTurn, gs?.finalPhase, scr, started]);

  // Idle timer (final phase only)
  useEffect(() => {
    if (!gs?.finalPhase || gs?.status === "finished" || !started) return;
    clearInterval(iRef.current);
    iRef.current = setInterval(() => {
      const rem = IDLE_SEC - Math.floor((Date.now() - lastAct.current) / 1000);
      setItimer(Math.max(0, rem));
      if (rem <= 0 && gs.currentTurn === myRole) {
        clearInterval(iRef.current);
        doEnd(myRole === "p1" ? "p2" : "p1", "Idle 60s — opponent wins!");
      }
    }, 1000);
    return () => clearInterval(iRef.current);
  }, [gs?.finalPhase, gs?.status, gs?.currentTurn, myRole, started]);

  // All fields open → final phase
  useEffect(() => {
    if (!gs || gs.finalPhase || gs.status === "finished" || !gs.board) return;
    const total = gs.board.columns.reduce((s, c) => s + c.fields.length, 0);
    if (Object.keys(gs.revealed || {}).length >= total) {
      update(rRef.current, { finalPhase: true });
      L("🎯 All fields open! Guess final answer!");
    }
  }, [gs?.revealed]);

  // Wait for P2
  useEffect(() => {
    if (scr !== "waiting" || !roomId || !db) return;
    try {
      const unsub = onValue(ref(db, `games/${roomId}`), snap => {
        const d = snap.val();
        if (d?.status === "active" && d.p1 && d.p2) {
          setGs(d); setStarted(true); lastAct.current = Date.now();
          setScr("game"); L("Opponent joined! Your turn!");
        }
      });
      return () => unsub();
    } catch (e) { console.error(e); }
  }, [scr, roomId]);

  async function doWallet() {
    setWload(true);
    const a = await connectPhantom();
    if (a) setWallet(a);
    setWload(false);
  }

  async function doCreate() {
    if (!nm.trim() || !uid || !db) return;
    if (!wallet) { alert("Connect Phantom wallet first!"); return; }
    setScr("loading"); setLdmsg("Generating board...");
    const board = await makeBoard();
    setLdmsg("Confirming wager...");
    const tx = await signWager(wager);
    if (!tx.ok) { alert("Wager failed: " + tx.err); setScr("lobby"); return; }
    setLdmsg("Creating room...");
    const id = genId();
    try {
      await set(ref(db, `games/${id}`), {
        p1: uid, p1name: nm, p1wallet: wallet,
        p2: null, p2name: null, p2wallet: null,
        status: "waiting", wager, board,
        scores: { p1: 0, p2: 0 }, revealed: {},
        colSolved: { A: false, B: false, C: false, D: false },
        finalSolved: false, finalPhase: false, currentTurn: "p1",
        lastActivity: Date.now(), winner: null, p1tx: tx.id
      });
      setRoomId(id); setMyRole("p1"); setStarted(false); setScr("waiting");
    } catch (e) { alert("Firebase error: " + e.message); setScr("lobby"); }
  }

  async function doJoin() {
    const id = jin.trim().toUpperCase();
    if (!nm.trim() || !uid || id.length < 6 || !db) return;
    if (!wallet) { alert("Connect Phantom wallet first!"); return; }
    setJerr(""); setScr("loading"); setLdmsg("Looking for room " + id + "...");
    try {
      const snap = await get(ref(db, `games/${id}`));
      if (!snap.exists()) { setJerr("Room " + id + " not found!"); setScr("lobby"); return; }
      const d = snap.val();
      if (d.status !== "waiting") { setJerr("Room already started!"); setScr("lobby"); return; }
      if (d.p1 === uid) { setJerr("Can't join your own room!"); setScr("lobby"); return; }
      const tx = await signWager(d.wager);
      if (!tx.ok) { alert("Wager failed: " + tx.err); setScr("lobby"); return; }
      await update(ref(db, `games/${id}`), {
        p2: uid, p2name: nm, p2wallet: wallet,
        status: "active", currentTurn: "p1",
        lastActivity: Date.now(), p2tx: tx.id
      });
      setWager(d.wager); setRoomId(id); setMyRole("p2");
      setStarted(true); lastAct.current = Date.now();
      setScr("game"); L("Joined! You are P2. P1 goes first.");
    } catch (e) { setJerr("Error: " + e.message); setScr("lobby"); }
  }

  async function doOpen(fid) {
    if (!isMy || didOpen || gs?.finalPhase || !started) return;
    touch(); setDidOpen(true);
    await update(rRef.current, { [`revealed/${fid}`]: "clue", lastActivity: Date.now() });
    L("Field " + fid + " opened!");
  }

  async function autoReveal() {
    if (!gs?.board || !rRef.current) return;
    const all = gs.board.columns.flatMap(c => c.fields);
    const hidden = all.filter(f => !gs.revealed?.[f.id]);
    if (!hidden.length) { await update(rRef.current, { finalPhase: true }); return; }
    const pick = hidden[Math.floor(Math.random() * hidden.length)];
    await update(rRef.current, { [`revealed/${pick.id}`]: "clue", lastActivity: Date.now() });
    L("⏱ " + pick.id + " auto-revealed."); await doPass();
  }

  async function doGuessCol(cid, val) {
    touch();
    const col = gs.board.columns.find(c => c.id === cid);
    if (!col || gs.colSolved?.[cid]) return false;
    if (hit(val, col.theme)) {
      const upd = {};
      col.fields.forEach(f => { upd[`revealed/${f.id}`] = "solved"; });
      upd[`colSolved/${cid}`] = myRole;
      upd[`scores/${myRole}`] = (gs.scores?.[myRole] || 0) + 20;
      upd.lastActivity = Date.now();
      await update(rRef.current, upd);
      L("✅ Column " + cid + ': "' + col.theme + '" +20pts!');
      return true;
    }
    L("❌ Wrong theme for " + cid + ". Opponent's turn!");
    await doPass(); return false;
  }

  async function doGuessFinal(val) {
    touch();
    if (hit(val, gs.board.final.answer)) {
      await update(rRef.current, { finalSolved: myRole, [`scores/${myRole}`]: (gs.scores?.[myRole] || 0) + 30, lastActivity: Date.now() });
      doEnd(myRole, "Final answer correct! +30pts 🎉"); return true;
    }
    L("❌ Wrong final. Opponent's turn!"); await doPass(); return false;
  }

  async function doPass() {
    clearInterval(tRef.current); setDidOpen(false);
    await update(rRef.current, { currentTurn: myRole === "p1" ? "p2" : "p1", lastActivity: Date.now() });
  }

  async function doEnd(w, reason) {
    clearInterval(tRef.current); clearInterval(iRef.current);
    if (!rRef.current) return;
    await update(rRef.current, { status: "finished", winner: w, winReason: reason, finishedAt: Date.now() });
    if (!gs) return;
    const sc = gs.scores || { p1: 0, p2: 0 };
    for (const r of ["p1", "p2"]) {
      const u = gs[r]; if (!u) continue;
      const lb = ref(db, `leaderboard/${u}`);
      const sn = await get(lb); const cv = sn.val() || { wins: 0, losses: 0, points: 0, tokensWon: 0 };
      await set(lb, { name: r === "p1" ? gs.p1name : gs.p2name, wins: (cv.wins || 0) + (w === r ? 1 : 0), losses: (cv.losses || 0) + (w === r ? 0 : 1), points: (cv.points || 0) + (sc[r] || 0), tokensWon: (cv.tokensWon || 0) + (w === r ? wager * 2 : 0) });
    }
  }

  function doReset() {
    setScr("lobby"); setRoomId(null); setMyRole(null); setGs(null);
    setDidOpen(false); setLog([]); setJin(""); setJerr(""); setStarted(false);
  }

  const board = gs?.board || null;
  const isMy = gs?.currentTurn === myRole;
  const scores = gs?.scores || { p1: 0, p2: 0 };
  const revealed = gs?.revealed || {};
  const colSolved = gs?.colSolved || {};
  const finalSolved = gs?.finalSolved || false;
  const finalPhase = gs?.finalPhase || false;
  const winner = gs?.winner || null;
  const winReason = gs?.winReason || "";
  const myNm = myRole === "p1" ? gs?.p1name || "P1" : gs?.p2name || "P2";
  const opNm = myRole === "p1" ? gs?.p2name || "P2" : gs?.p1name || "P1";
  const myScore = myRole === "p1" ? scores.p1 : scores.p2;
  const opScore = myRole === "p1" ? scores.p2 : scores.p1;
  const canOpen = isMy && !didOpen && !finalPhase && !winner && gs?.status === "active" && started;
  const canGuess = isMy && (didOpen || finalPhase) && !winner && gs?.status === "active" && started;
  const fst = fid => { const r = revealed[fid]; if (!r) return "hidden"; if (r === "solved") return "solved"; return "clue"; };

  /* ── LOBBY ── */
  if (scr === "lobby") return (
    <div style={ROOT}><style>{CSS}</style>
      <div style={{ background: "#0f1a30", padding: "12px 16px", borderBottom: "2px solid #f59e0b", textAlign: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 2 }}>
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <polygon points="32,2 54,16 54,40 32,54 10,40 10,16" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity=".6" />
            <circle cx="32" cy="26" r="16" fill="#fff" opacity=".93" /><rect x="24" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93" /><rect x="33" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93" />
            <ellipse cx="26" cy="24" rx="4.5" ry="5.5" fill="#111" /><ellipse cx="38" cy="24" rx="4.5" ry="5.5" fill="#111" />
            <ellipse cx="26" cy="23" rx="1.5" ry="2" fill="#8b5cf6" opacity=".9" /><ellipse cx="38" cy="23" rx="1.5" ry="2" fill="#22c55e" opacity=".9" />
            <path d="M28 34 L32 31 L36 34" stroke="#333" strokeWidth="1.5" fill="none" />
          </svg>
          <div style={{ fontFamily: "'Black Ops One',cursive", fontSize: 22, color: "#22c55e", letterSpacing: 4, textShadow: "0 0 16px #22c55e88" }}>FREEDOM</div>
        </div>
        <div style={{ fontFamily: "'Black Ops One',cursive", fontSize: 11, color: "#f59e0b", letterSpacing: 4 }}>ASSOCIATIONS</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 12, padding: "10px", marginBottom: 10, border: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 2, marginBottom: 6 }}>PHANTOM WALLET</div>
          {wallet ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
              <span style={{ fontSize: 11, color: "#22c55e", fontFamily: "monospace" }}>{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginLeft: "auto" }}>✓ Connected</span>
            </div>
          ) : (
            <button onClick={doWallet} disabled={wload} style={{ width: "100%", padding: "10px 0", background: "linear-gradient(90deg,#8b5cf6,#7c3aed)", border: "none", borderRadius: 10, color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>
              {wload ? "CONNECTING..." : "🔗 CONNECT PHANTOM WALLET"}
            </button>
          )}
        </div>
        <input value={nm} onChange={e => setNm(e.target.value)} placeholder="Your name / username" maxLength={16}
          style={{ width: "100%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 12, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10 }} />
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 2, marginBottom: 6 }}>WAGER — FREEDOM TOKENS</div>
          <div style={{ display: "flex", gap: 8 }}>
            {WAGERS.map(w => <button key={w} onClick={() => setWager(w)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", background: wager === w ? "#f59e0b" : "rgba(255,255,255,.1)", color: wager === w ? "#fff" : "rgba(255,255,255,.7)", border: `2px solid ${wager === w ? "#f59e0b" : "rgba(255,255,255,.2)"}` }}>{w}</button>)}
          </div>
        </div>
        <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,.15)", marginBottom: 10 }}>
          {[["create", "🎮 CREATE"], ["join", "🚪 JOIN"]].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setJerr(""); }} style={{ flex: 1, padding: "11px 0", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", background: mode === m ? "#f59e0b" : "transparent", color: mode === m ? "#fff" : "rgba(255,255,255,.5)", border: "none", letterSpacing: 1 }}>{l}</button>
          ))}
        </div>
        {mode === "create" && (
          <button onClick={doCreate} disabled={!nm.trim() || !wallet} style={{ width: "100%", padding: "14px 0", background: nm.trim() && wallet ? "linear-gradient(90deg,#f59e0b,#d97706)" : "rgba(255,255,255,.1)", color: nm.trim() && wallet ? "#fff" : "rgba(255,255,255,.3)", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 900, cursor: nm.trim() && wallet ? "pointer" : "default", letterSpacing: 2, boxShadow: nm.trim() && wallet ? "0 4px 0 rgba(0,0,0,.3)" : "none" }}>
            🎮 CREATE ROOM
          </button>
        )}
        {mode === "join" && (
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 2, marginBottom: 6 }}>ENTER ROOM ID</div>
            <input value={jin} onChange={e => { setJin(e.target.value.toUpperCase()); setJerr(""); }} maxLength={6} placeholder="ABC123"
              style={{ width: "100%", background: "rgba(255,255,255,.1)", border: `2px solid ${jin.length === 6 ? "#22c55e" : "rgba(255,255,255,.2)"}`, borderRadius: 12, padding: "12px", color: "#22c55e", fontSize: 24, outline: "none", fontFamily: "'Black Ops One',cursive", boxSizing: "border-box", textAlign: "center", letterSpacing: 10, marginBottom: 6 }} />
            {jerr && <div style={{ padding: "7px 10px", background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.4)", borderRadius: 8, fontSize: 11, color: "#ef4444", marginBottom: 6 }}>⚠ {jerr}</div>}
            <button onClick={doJoin} disabled={!nm.trim() || !wallet || jin.length < 6} style={{ width: "100%", padding: "14px 0", background: jin.length === 6 && nm.trim() && wallet ? "linear-gradient(90deg,#22c55e,#16a34a)" : "rgba(255,255,255,.1)", color: jin.length === 6 && nm.trim() && wallet ? "#fff" : "rgba(255,255,255,.3)", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 900, cursor: jin.length === 6 && nm.trim() && wallet ? "pointer" : "default", letterSpacing: 2 }}>
              🚪 JOIN ROOM
            </button>
          </div>
        )}
        <div style={{ marginTop: 12, background: "rgba(255,255,255,.05)", borderRadius: 12, padding: "10px", border: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ color: "#f59e0b", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>GAME RULES</div>
          {[["30s/turn", "Open 1 field per turn. Timer starts when both join."], ["Guessing", "Correct = keep turn. Wrong = opponent's turn."], ["Time up", "30s expire = random field auto-reveals, turn passes."], ["Final", "All fields open: 60s idle = opponent wins."], ["Points", "Column theme +20 · Final +30"]].map(([t, d], i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, whiteSpace: "nowrap", minWidth: 55 }}>{t}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.5)", lineHeight: 1.4 }}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 12, paddingBottom: 6 }}>
          <span style={{ fontFamily: "'Black Ops One',cursive", fontSize: 11, letterSpacing: 2 }}>
            <span style={{ color: "#8b5cf6" }}>DEGEN</span><span style={{ color: "#22c55e" }}>SAFE</span><span style={{ color: "rgba(255,255,255,.3)" }}>.FUN</span>
          </span>
        </div>
      </div>
    </div>
  );

  if (scr === "loading") return <Spin msg={ldmsg} />;

  /* ── WAITING ── */
  if (scr === "waiting") return (
    <div style={ROOT}><style>{CSS}</style>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 20 }}>
        <div style={{ width: 56, height: 56, border: "4px solid rgba(255,255,255,.1)", borderTop: "4px solid #22c55e", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ fontFamily: "'Black Ops One',cursive", fontSize: 13, color: "#22c55e", letterSpacing: 3 }}>WAITING FOR OPPONENT</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>Wager: <b style={{ color: "#f59e0b" }}>{wager}</b> FREEDOM tokens</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>SHARE ROOM ID:</div>
          <div style={{ fontSize: 42, fontFamily: "'Black Ops One',cursive", color: "#22c55e", letterSpacing: 10, padding: "14px 28px", background: "rgba(34,197,94,.1)", border: "2px solid rgba(34,197,94,.4)", borderRadius: 12 }}>{roomId}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 8 }}>Opponent → JOIN ROOM → enter this code</div>
        </div>
        <button onClick={() => { try { set(ref(db, `games/${roomId}`), null); } catch { } setScr("lobby"); setRoomId(null); setMyRole(null); setStarted(false); }}
          style={{ padding: "10px 22px", background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 10, fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          CANCEL
        </button>
      </div>
    </div>
  );

  /* ── RESULT ── */
  if (scr === "result" || winner) return (
    <div style={ROOT}><style>{CSS}</style>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 380, background: "#0f1a30", borderRadius: 20, padding: "24px 18px", textAlign: "center", border: "2px solid rgba(255,255,255,.1)" }}>
          <div style={{ fontSize: 56 }}>{winner === myRole ? "🏆" : "💀"}</div>
          <div style={{ fontFamily: "'Black Ops One',cursive", fontSize: 24, letterSpacing: 3, marginTop: 6, color: winner === myRole ? "#22c55e" : "#ef4444" }}>{winner === myRole ? "YOU WIN!" : "YOU LOSE"}</div>
          <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12, marginTop: 5, marginBottom: 18 }}>{winReason}</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 18 }}>
            {["p1", "p2"].map(r => (
              <div key={r} style={{ flex: 1, padding: "12px", borderRadius: 12, background: r === winner ? "rgba(34,197,94,.1)" : "rgba(255,255,255,.05)", border: `2px solid ${r === winner ? "#22c55e" : "rgba(255,255,255,.1)"}` }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{r === myRole ? myNm : opNm}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: r === winner ? "#22c55e" : "#fff" }}>{r === "p1" ? scores.p1 : scores.p2}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)" }}>pts</div>
              </div>
            ))}
          </div>
          {winner === myRole && <div style={{ color: "#f59e0b", fontSize: 12, marginBottom: 14 }}>🎉 Winnings: <b>{wager * 2}</b> FREEDOM tokens</div>}
          <button onClick={doReset} style={{ width: "100%", padding: "13px", background: "linear-gradient(90deg,#8b5cf6,#7c3aed)", color: "#fff", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 13, fontWeight: 900, cursor: "pointer", letterSpacing: 2, boxShadow: "0 4px 0 rgba(0,0,0,.3)" }}>NEW GAME</button>
        </div>
      </div>
    </div>
  );

  if (!board) return <Spin msg="Loading game..." />;
  const [colA, colB, colC, colD] = board.columns;

  /* ── GAME ── */
  return (
    <div style={ROOT}><style>{CSS}</style>
      {/* SCOREBOARD */}
      <div style={{ background: "#0f1a30", padding: "7px 12px", borderBottom: "2px solid #f59e0b", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: CA, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Black Ops One',cursive", fontSize: 12, color: "#fff", flexShrink: 0, boxShadow: "0 2px 0 rgba(0,0,0,.3)" }}>{myNm.slice(0, 2).toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>{myNm}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{myScore}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 60 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#0a1020", border: `3px solid ${!started ? "#333" : finalPhase ? (isMy ? "#f59e0b" : "#333") : (isMy ? "#22c55e" : "#333")}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Black Ops One',cursive", fontSize: 15, fontWeight: 900, color: !started ? "#333" : finalPhase ? (isMy ? "#f59e0b" : "#333") : (isMy ? "#22c55e" : "#333") }}>
                {!started ? "⏳" : finalPhase && isMy ? itimer : !finalPhase && isMy ? ttimer : "·"}
              </span>
            </div>
            <div style={{ fontSize: 7, color: isMy && started ? "#22c55e" : "rgba(255,255,255,.3)", letterSpacing: 1, fontWeight: 700 }}>
              {!started ? "WAIT" : finalPhase ? "FINAL" : isMy ? "YOUR TURN" : "WAIT"}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>{opNm}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{opScore}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: CB, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Black Ops One',cursive", fontSize: 12, color: "#fff", flexShrink: 0, boxShadow: "0 2px 0 rgba(0,0,0,.3)" }}>{opNm.slice(0, 2).toUpperCase()}</div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 4, fontSize: 10, color: isMy && started ? "#f59e0b" : "rgba(255,255,255,.3)", fontWeight: 700 }}>
          {!started ? "⏳ Waiting for opponent..." : finalPhase ? (isMy ? "🎯 TAP ? TO GUESS THEMES OR FINAL" : "⏳ OPPONENT GUESSING...") : isMy ? (canOpen ? "👆 TAP A FIELD TO REVEAL ITS CLUE" : canGuess ? "💡 TAP ? TO GUESS A THEME OR FINAL" : "...") : "⏳ OPPONENT'S TURN"}
        </div>
      </div>

      {/* BOARD */}
      <div style={{ flex: 1, overflowY: "auto", padding: "7px 10px" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ textAlign: "center", paddingBottom: 2, borderBottom: `3px solid ${CA}` }}><span style={{ fontFamily: "'Black Ops One',cursive", fontSize: 16, color: CA, letterSpacing: 3 }}>A</span></div>
            <div style={{ textAlign: "center", paddingBottom: 2, borderBottom: `3px solid ${CB}` }}><span style={{ fontFamily: "'Black Ops One',cursive", fontSize: 16, color: CB, letterSpacing: 3 }}>B</span></div>
          </div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <FieldBtn field={colA.fields[i]} state={fst(colA.fields[i].id)} canOpen={canOpen} color={CA} onOpen={doOpen} />
              <FieldBtn field={colB.fields[i]} state={fst(colB.fields[i].id)} canOpen={canOpen} color={CB} onOpen={doOpen} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <ThemeBtn colId="A" solved={!!colSolved.A} theme={colA.theme} disabled={!canGuess} onGuess={v => doGuessCol("A", v)} />
            <ThemeBtn colId="B" solved={!!colSolved.B} theme={colB.theme} disabled={!canGuess} onGuess={v => doGuessCol("B", v)} />
          </div>
          <FinalBtn solved={!!finalSolved} answer={board.final.answer} disabled={!canGuess} onGuess={doGuessFinal} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <ThemeBtn colId="C" solved={!!colSolved.C} theme={colC.theme} disabled={!canGuess} onGuess={v => doGuessCol("C", v)} />
            <ThemeBtn colId="D" solved={!!colSolved.D} theme={colD.theme} disabled={!canGuess} onGuess={v => doGuessCol("D", v)} />
          </div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <FieldBtn field={colC.fields[i]} state={fst(colC.fields[i].id)} canOpen={canOpen} color={CA} onOpen={doOpen} />
              <FieldBtn field={colD.fields[i]} state={fst(colD.fields[i].id)} canOpen={canOpen} color={CB} onOpen={doOpen} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ textAlign: "center", paddingTop: 2, borderTop: `3px solid ${CA}` }}><span style={{ fontFamily: "'Black Ops One',cursive", fontSize: 16, color: CA, letterSpacing: 3 }}>C</span></div>
            <div style={{ textAlign: "center", paddingTop: 2, borderTop: `3px solid ${CB}` }}><span style={{ fontFamily: "'Black Ops One',cursive", fontSize: 16, color: CB, letterSpacing: 3 }}>D</span></div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 2 }}>
            {isMy && !finalPhase && didOpen && started && (
              <button onClick={() => { touch(); doPass(); L("Passed."); }} style={{ padding: "8px 14px", background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, fontFamily: "inherit", fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>PASS</button>
            )}
            {log.length > 0 && (
              <div style={{ flex: 1, padding: "5px 9px", background: "rgba(0,0,0,.3)", borderRadius: 8 }}>
                {log.map((l, i) => <div key={i} style={{ fontSize: 10, color: i === 0 ? "rgba(255,255,255,.8)" : "rgba(255,255,255,.3)", padding: "1px 0" }}>{l}</div>)}
              </div>
            )}
          </div>
          <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
            <span style={{ fontFamily: "'Black Ops One',cursive", fontSize: 10, letterSpacing: 2 }}>
              <span style={{ color: "#8b5cf6" }}>DEGEN</span><span style={{ color: "#22c55e" }}>SAFE</span><span style={{ color: "rgba(255,255,255,.3)" }}>.FUN</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const ROOT = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#1a2a4a",
  fontFamily: "'Rajdhani','Oswald',sans-serif",
  color: "#fff",
  overflow: "hidden",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;600;700&display=swap');
  html, body { margin:0; padding:0; background:#1a2a4a; overflow:hidden; }
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  @keyframes pop { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:rgba(0,0,0,.2)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:2px}
`;
