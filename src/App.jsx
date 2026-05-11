import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

/* ═══════════════════════════════════
   FIREBASE CONFIG
═══════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyAKmKRj7Hhy4K6DsY_XDbqLb3oYOwZC5jw",
  authDomain: "project-freedom-a004e.firebaseapp.com",
  databaseURL: "https://project-freedom-a004e-default-rtdb.firebaseio.com",
  projectId: "project-freedom-a004e",
  storageBucket: "project-freedom-a004e.firebasestorage.app",
  messagingSenderId: "844172246267",
  appId: "1:844172246267:web:a31b8cd6affe8337f7845e",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

/* ═══════════════════════════════════
   CONSTANTS
═══════════════════════════════════ */
const ESCROW = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS = [100, 500, 1000];
const TURN_TIME = 30;
const FINAL_TIME = 60;
const IDLE_TIME = 60;
const ACC = { A:"#e63946", B:"#f4a261", C:"#2a9d8f", D:"#457b9d" };

/* ═══════════════════════════════════
   PHANTOM WALLET
═══════════════════════════════════ */
async function connectPhantom() {
  try {
    if (!window.solana?.isPhantom) {
      window.open("https://phantom.app/", "_blank");
      return null;
    }
    const resp = await window.solana.connect();
    return resp.publicKey.toString();
  } catch(e) {
    return null;
  }
}

async function sendWager(amount, walletAddr) {
  try {
    if (!window.solana?.isPhantom) {
      return { success: false, error: "Phantom not found" };
    }
    // Sign a message to confirm wager (actual SPL token transfer requires backend)
    const msg = new TextEncoder().encode(
      `I confirm wager of ${amount} FREEDOM tokens to escrow ${ESCROW}`
    );
    await window.solana.signMessage(msg, "utf8");
    return { success: true, txid: "SIG_" + Date.now() };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

/* ═══════════════════════════════════
   AI BOARD
═══════════════════════════════════ */
async function generateBoard() {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [{
          role: "user",
          content: `Generate a word association game board in English. Return ONLY valid JSON, no markdown, no explanation.
{
  "columns": [
    {"id":"A","theme":"THEME","fields":[{"id":"A1","clue":"clue","answer":"ANSWER"},{"id":"A2","clue":"clue","answer":"ANSWER"},{"id":"A3","clue":"clue","answer":"ANSWER"},{"id":"A4","clue":"clue","answer":"ANSWER"}]},
    {"id":"B","theme":"THEME","fields":[{"id":"B1","clue":"clue","answer":"ANSWER"},{"id":"B2","clue":"clue","answer":"ANSWER"},{"id":"B3","clue":"clue","answer":"ANSWER"},{"id":"B4","clue":"clue","answer":"ANSWER"}]},
    {"id":"C","theme":"THEME","fields":[{"id":"C1","clue":"clue","answer":"ANSWER"},{"id":"C2","clue":"clue","answer":"ANSWER"},{"id":"C3","clue":"clue","answer":"ANSWER"},{"id":"C4","clue":"clue","answer":"ANSWER"}]},
    {"id":"D","theme":"THEME","fields":[{"id":"D1","clue":"clue","answer":"ANSWER"},{"id":"D2","clue":"clue","answer":"ANSWER"},{"id":"D3","clue":"clue","answer":"ANSWER"},{"id":"D4","clue":"clue","answer":"ANSWER"}]}
  ],
  "final":{"answer":"FINALANSWER","hint":"short hint"}
}
Rules: 4 different themes, short English clues 1-3 words, single-word CAPS answers, final answer connects all 4 themes.`
        }]
      })
    });
    const data = await r.json();
    return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
  } catch(e) {
    return FALLBACK;
  }
}

const FALLBACK = {
  columns: [
    { id:"A", theme:"ANIMALS", fields:[{id:"A1",clue:"King of jungle",answer:"LION"},{id:"A2",clue:"Black & white stripes",answer:"ZEBRA"},{id:"A3",clue:"Longest neck",answer:"GIRAFFE"},{id:"A4",clue:"Trunk & tusks",answer:"ELEPHANT"}] },
    { id:"B", theme:"INSTRUMENTS", fields:[{id:"B1",clue:"6 strings",answer:"GUITAR"},{id:"B2",clue:"88 keys",answer:"PIANO"},{id:"B3",clue:"You hit it",answer:"DRUM"},{id:"B4",clue:"Brass wind",answer:"TRUMPET"}] },
    { id:"C", theme:"SPORTS", fields:[{id:"C1",clue:"Court & net",answer:"TENNIS"},{id:"C2",clue:"Ice & skates",answer:"HOCKEY"},{id:"C3",clue:"Pool & cap",answer:"SWIMMING"},{id:"C4",clue:"The octagon",answer:"MMA"}] },
    { id:"D", theme:"FOOD", fields:[{id:"D1",clue:"Italian pie",answer:"PIZZA"},{id:"D2",clue:"Japanese roll",answer:"SUSHI"},{id:"D3",clue:"Mexican wrap",answer:"BURRITO"},{id:"D4",clue:"French bread",answer:"BAGUETTE"}] },
  ],
  final: { answer:"FREEDOM", hint:"Project Freedom" }
};

/* ═══════════════════════════════════
   HELPERS
═══════════════════════════════════ */
function norm(s) { return s.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function match(a, b) { return norm(a) === norm(b); }
function genId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

/* ═══════════════════════════════════
   SKULL ICON
═══════════════════════════════════ */
function Skull({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <polygon points="32,2 54,16 54,40 32,54 10,40 10,16" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity=".5"/>
      <circle cx="32" cy="26" r="16" fill="#fff" opacity=".93"/>
      <rect x="24" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93"/>
      <rect x="33" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93"/>
      <ellipse cx="26" cy="24" rx="4.5" ry="5.5" fill="#111"/>
      <ellipse cx="38" cy="24" rx="4.5" ry="5.5" fill="#111"/>
      <ellipse cx="26" cy="23" rx="1.5" ry="2" fill="#8b5cf6" opacity=".9"/>
      <ellipse cx="38" cy="23" rx="1.5" ry="2" fill="#22c55e" opacity=".9"/>
      <path d="M28 34 L32 31 L36 34" stroke="#333" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

/* ═══════════════════════════════════
   HEADER
═══════════════════════════════════ */
function Header() {
  return (
    <div style={{ width:"100%", background:"#050505", borderBottom:"2px solid #111", padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", boxSizing:"border-box", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <Skull size={36}/>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:24, height:1, background:"#22c55e", opacity:.4 }}/>
            <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:9, color:"#888", letterSpacing:5, lineHeight:1 }}>PROJECT</div>
            <div style={{ width:24, height:1, background:"#22c55e", opacity:.4 }}/>
          </div>
          <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:22, color:"#22c55e", letterSpacing:4, lineHeight:1.1, textShadow:"0 0 20px #22c55e88" }}>FREEDOM</div>
          <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:11, color:"#8b5cf6", letterSpacing:4, lineHeight:1, textShadow:"0 0 10px #8b5cf666" }}>ASSOCIATIONS</div>
        </div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:8, color:"#333", letterSpacing:2 }}>POWERED BY</div>
        <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:12, letterSpacing:2 }}>
          <span style={{ color:"#8b5cf6" }}>DEGEN</span><span style={{ color:"#22c55e" }}>SAFE</span><span style={{ color:"#444" }}>.FUN</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   FOOTER
═══════════════════════════════════ */
function Footer() {
  return (
    <div style={{ width:"100%", background:"#050505", borderTop:"1px solid #111", padding:"6px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxSizing:"border-box", flexShrink:0 }}>
      <div style={{ width:20, height:1, background:"#8b5cf6", opacity:.3 }}/>
      <span style={{ fontSize:9, color:"#2a2a2a", letterSpacing:2 }}>POWERED BY</span>
      <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:13, letterSpacing:2 }}>
        <span style={{ color:"#8b5cf6" }}>DEGEN</span><span style={{ color:"#22c55e" }}>SAFE</span><span style={{ color:"#444" }}>.FUN</span>
      </span>
      <div style={{ width:20, height:1, background:"#22c55e", opacity:.3 }}/>
    </div>
  );
}

/* ═══════════════════════════════════
   TIMER BAR
═══════════════════════════════════ */
function TimerBar({ secs, max, warn = 10 }) {
  const pct = (secs / max) * 100;
  const hot = secs <= warn;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ flex:1, height:4, background:"#111", borderRadius:2, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:hot?"#ef4444":"#22c55e", transition:"width 1s linear, background .3s", borderRadius:2 }}/>
      </div>
      <span style={{ fontFamily:"monospace", fontSize:11, minWidth:24, color:hot?"#ef4444":"#555" }}>{secs}s</span>
    </div>
  );
}

/* ═══════════════════════════════════
   FIELD CELL — 3:1 ratio
═══════════════════════════════════ */
function Field({ field, revealed, active, oppActive, canClick, canGuess, onReveal, onGuess, accent }) {
  const [val, setVal] = useState("");
  const [wrong, setWrong] = useState(false);
  const inp = useRef();

  useEffect(() => { if (active && canGuess && inp.current) inp.current.focus(); }, [active, canGuess]);

  const submit = () => {
    if (!val.trim()) return;
    if (!onGuess(field.id, val)) { setWrong(true); setTimeout(() => setWrong(false), 500); }
    setVal("");
  };

  const base = { borderRadius:5, height:40, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", transition:"all .15s", userSelect:"none", boxSizing:"border-box", width:"100%" };

  if (revealed) return (
    <div style={{ ...base, background:"#141414", border:`1px solid ${accent}55`, flexDirection:"column", gap:1, animation:"pop .25s ease" }}>
      <span style={{ fontSize:10, fontWeight:700, color:accent, letterSpacing:1 }}>{field.answer}</span>
      <span style={{ fontSize:8, color:"#444", textAlign:"center", padding:"0 2px", lineHeight:1.2 }}>{field.clue}</span>
    </div>
  );

  if (oppActive) return (
    <div style={{ ...base, background:"#0a0a14", border:`1px solid #8b5cf633` }}>
      <span style={{ fontSize:11, color:"#333" }}>⏳</span>
    </div>
  );

  if (active && canGuess) return (
    <div style={{ ...base, background:"#0c0c1a", border:`2px solid ${accent}`, boxShadow:`0 0 12px ${accent}55`, animation:wrong?"shake .4s":"none", gap:4, padding:"0 6px", justifyContent:"flex-start" }}>
      <input ref={inp} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
        placeholder={field.clue} style={{ flex:1, background:"transparent", border:"none", color:"#fff", fontSize:10, outline:"none", fontFamily:"inherit", minWidth:0 }}/>
      <button onClick={submit} style={{ background:accent, border:"none", borderRadius:4, padding:"2px 7px", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:9, flexShrink:0 }}>✓</button>
    </div>
  );

  return (
    <div onClick={canClick ? () => onReveal(field.id) : undefined}
      style={{ ...base, background:canClick?"#0e0e1a":"#070710", border:`1px solid ${canClick?accent+"44":"#111"}`, cursor:canClick?"pointer":"default" }}
      onMouseEnter={e => { if (canClick) { e.currentTarget.style.background = "#14142a"; e.currentTarget.style.borderColor = accent + "aa"; }}}
      onMouseLeave={e => { if (canClick) { e.currentTarget.style.background = "#0e0e1a"; e.currentTarget.style.borderColor = accent + "44"; }}}>
      <span style={{ fontSize:10, color:canClick?"#555":"#1a1a1a", fontWeight:700, letterSpacing:1 }}>{field.id}</span>
    </div>
  );
}

/* ═══════════════════════════════════
   GUESS ROW
═══════════════════════════════════ */
function GuessRow({ label, solved, solvedText, disabled, onGuess, accent }) {
  const [val, setVal] = useState("");
  const [wrong, setWrong] = useState(false);

  if (solved) return (
    <div style={{ ...GR, background:accent+"18", border:`1px solid ${accent}55`, justifyContent:"center" }}>
      <span style={{ color:accent, fontWeight:700, fontSize:10 }}>✓ {solvedText}</span>
    </div>
  );

  const sub = () => {
    if (!val.trim() || disabled) return;
    if (!onGuess(val)) { setWrong(true); setTimeout(() => setWrong(false), 500); }
    else setVal("");
  };

  return (
    <div style={{ ...GR, animation:wrong?"shake .4s":"none", opacity:disabled ? .25 : 1 }}>
      <span style={{ fontSize:8, color:"#444", whiteSpace:"nowrap" }}>{label}</span>
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && sub()} disabled={disabled}
        placeholder="guess..." style={{ flex:1, background:"transparent", border:"none", color:disabled?"#333":"#fff", fontSize:10, outline:"none", fontFamily:"inherit", minWidth:0 }}/>
      <button onClick={sub} disabled={disabled} style={{ background:disabled?"#1a1a1a":accent, border:"none", borderRadius:4, padding:"3px 8px", color:disabled?"#333":"#fff", fontWeight:700, cursor:disabled?"default":"pointer", fontSize:9, flexShrink:0 }}>OK</button>
    </div>
  );
}
const GR = { display:"flex", alignItems:"center", gap:5, background:"#0a0a0a", border:"1px solid #1a1a1a", borderRadius:5, padding:"4px 8px", width:"100%", boxSizing:"border-box", height:30 };

/* ═══════════════════════════════════
   LOADING SCREEN
═══════════════════════════════════ */
function LoadingScreen({ msg }) {
  return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <div style={{ width:48, height:48, border:"3px solid #8b5cf622", borderTop:"3px solid #8b5cf6", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
        <div style={{ color:"#555", fontSize:12, letterSpacing:2 }}>{msg}</div>
      </div>
    <Footer/></div>
  );
}

/* ═══════════════════════════════════
   MAIN APP
═══════════════════════════════════ */
export default function App() {
  const [uid, setUid] = useState(null);
  const [screen, setScreen] = useState("lobby");
  const [playerName, setPlayerName] = useState("");
  const [wager, setWager] = useState(100);
  const [lobbyMode, setLobbyMode] = useState("create");
  const [joinId, setJoinId] = useState("");
  const [walletAddr, setWalletAddr] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [gameId, setGameId] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [turnTimer, setTurnTimer] = useState(TURN_TIME);
  const [finalTimer, setFinalTimer] = useState(FINAL_TIME);
  const [idleTimer, setIdleTimer] = useState(IDLE_TIME);
  const [activeField, setActiveField] = useState(null);
  const [usedClick, setUsedClick] = useState(false);
  const [log, setLog] = useState([]);

  const turnRef = useRef();
  const finalRef = useRef();
  const idleRef = useRef();
  const lastAct = useRef(Date.now());
  const gameRef = useRef(null);

  const addLog = m => setLog(p => [m, ...p].slice(0, 6));
  const touch = () => { lastAct.current = Date.now(); setIdleTimer(IDLE_TIME); };

  // Auth
  useEffect(() => {
    signInAnonymously(auth).then(r => setUid(r.user.uid)).catch(console.error);
  }, []);

  // Check if Phantom already connected
  useEffect(() => {
    if (window.solana?.isPhantom && window.solana.publicKey) {
      setWalletAddr(window.solana.publicKey.toString());
    }
  }, []);

  // Game listener
  useEffect(() => {
    if (!gameId) return;
    gameRef.current = ref(db, `assoc_games/${gameId}`);
    const unsub = onValue(gameRef.current, snap => {
      const d = snap.val();
      if (!d) return;
      setGameState(d);
      setActiveField(d[`af_${myRole}`] || null);
      setUsedClick(d[`uc_${myRole}`] || false);
      if (d.status === "finished") setScreen("result");
    });
    return () => unsub();
  }, [gameId, myRole]);

  // Turn timer
  useEffect(() => {
    if (screen !== "game" || !gameState || gameState.finalPhase || gameState.status === "finished") return;
    clearInterval(turnRef.current);
    setTurnTimer(TURN_TIME);
    turnRef.current = setInterval(() => {
      setTurnTimer(t => {
        if (t <= 1) { clearInterval(turnRef.current); if (gameState.currentTurn === myRole) passTurn(); return TURN_TIME; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(turnRef.current);
  }, [gameState?.currentTurn, screen, gameState?.finalPhase]);

  // Final timer
  useEffect(() => {
    if (!gameState?.finalPhase || gameState?.status === "finished") return;
    clearInterval(finalRef.current);
    setFinalTimer(FINAL_TIME);
    finalRef.current = setInterval(() => {
      setFinalTimer(t => {
        if (t <= 1) {
          clearInterval(finalRef.current);
          const s = gameState.scores || { p1:0, p2:0 };
          endGame(s.p1 >= s.p2 ? "p1" : "p2", "Time's up — winner by points!");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(finalRef.current);
  }, [gameState?.finalPhase, gameState?.status]);

  // Idle timer
  useEffect(() => {
    if (screen !== "game" || gameState?.status === "finished") return;
    clearInterval(idleRef.current);
    idleRef.current = setInterval(() => {
      const rem = IDLE_TIME - Math.floor((Date.now() - lastAct.current) / 1000);
      setIdleTimer(Math.max(0, rem));
      if (rem <= 0) { clearInterval(idleRef.current); endGame(myRole === "p1" ? "p2" : "p1", "Idle 60s — opponent wins!"); }
    }, 1000);
    return () => clearInterval(idleRef.current);
  }, [screen, myRole, gameState?.status]);

  // All fields open
  useEffect(() => {
    if (!gameState || gameState.finalPhase || gameState.status === "finished") return;
    const b = gameState.board;
    if (!b) return;
    const total = b.columns.reduce((s, c) => s + c.fields.length, 0);
    if (Object.keys(gameState.revealed || {}).length >= total && gameState.currentTurn === myRole) {
      update(gameRef.current, { finalPhase: true });
      addLog("🎯 All fields open! 60s for the final answer!");
    }
  }, [gameState]);

  // Wait for P2
  useEffect(() => {
    if (screen !== "waiting" || !gameId) return;
    const unsub = onValue(ref(db, `assoc_games/${gameId}`), snap => {
      const d = snap.val();
      if (d?.status === "active") { setGameState(d); setScreen("game"); addLog("Opponent joined! Your turn!"); }
    });
    return () => unsub();
  }, [screen, gameId]);

  /* ── WALLET ── */
  async function handleConnectWallet() {
    setWalletLoading(true);
    const addr = await connectPhantom();
    if (addr) setWalletAddr(addr);
    setWalletLoading(false);
  }

  /* ── CREATE GAME ── */
  async function createGame() {
    if (!playerName.trim() || !uid) return;
    if (!walletAddr) { alert("Please connect Phantom wallet first!"); return; }
    setScreen("loading");
    setLoadingMsg("Generating board with AI...");
    const board = await generateBoard();
    setLoadingMsg("Confirming wager...");
    const tx = await sendWager(wager, walletAddr);
    if (!tx.success) { alert("Wager failed: " + tx.error); setScreen("lobby"); return; }
    setLoadingMsg("Creating room...");
    const gid = genId();
    await set(ref(db, `assoc_games/${gid}`), {
      p1: uid, p1name: playerName, p1wallet: walletAddr,
      p2: null, p2name: null, p2wallet: null,
      status: "waiting", wager, board,
      scores: { p1:0, p2:0 }, revealed: {},
      colSolved: { A:false, B:false, C:false, D:false },
      finalSolved: false, finalPhase: false, currentTurn: "p1",
      af_p1: null, af_p2: null, uc_p1: false, uc_p2: false,
      lastActivity: Date.now(), winner: null, p1tx: tx.txid
    });
    setGameId(gid);
    setMyRole("p1");
    setScreen("waiting");
  }

  /* ── JOIN GAME ── */
  async function joinGame() {
    const gid = joinId.trim().toUpperCase();
    if (!playerName.trim() || !uid || !gid) return;
    if (!walletAddr) { alert("Please connect Phantom wallet first!"); return; }
    setScreen("loading");
    setLoadingMsg("Confirming wager...");
    const tx = await sendWager(wager, walletAddr);
    if (!tx.success) { alert("Wager failed: " + tx.error); setScreen("lobby"); return; }
    setLoadingMsg("Joining room...");
    const gRef = ref(db, `assoc_games/${gid}`);
    const snap = await get(gRef);
    const d = snap.val();
    if (!d) { alert("Room not found!"); setScreen("lobby"); return; }
    if (d.status !== "waiting") { alert("Room already started or full!"); setScreen("lobby"); return; }
    await update(gRef, { p2: uid, p2name: playerName, p2wallet: walletAddr, status: "active", currentTurn: "p1", lastActivity: Date.now(), p2tx: tx.txid });
    setWager(d.wager);
    setGameId(gid);
    setMyRole("p2");
    setScreen("game");
    addLog("Joined! You are Player 2.");
  }

  /* ── GAME ACTIONS ── */
  async function revealField(fid) {
    if (!isMy || usedClick || activeField || gameState?.finalPhase) return;
    touch();
    await update(gameRef.current, { [`af_${myRole}`]: fid, [`uc_${myRole}`]: true, lastActivity: Date.now() });
    addLog(`Field ${fid} revealed!`);
  }

  async function guessField(fid, val) {
    touch();
    const col = gameState.board.columns.find(c => c.fields.some(f => f.id === fid));
    const field = col?.fields.find(f => f.id === fid);
    if (!field) return false;
    if (match(val, field.answer)) {
      await update(gameRef.current, { [`revealed/${fid}`]: true, [`scores/${myRole}`]: (gameState.scores[myRole] || 0) + 10, [`af_${myRole}`]: null, lastActivity: Date.now() });
      setTimeout(() => passTurn(), 500);
      addLog(`✅ Correct! "${field.answer}" +10pts`);
      return true;
    }
    addLog(`❌ Wrong for field ${fid}`);
    return false;
  }

  async function guessCol(cid, val) {
    touch();
    const col = gameState.board.columns.find(c => c.id === cid);
    if (!col || gameState.colSolved?.[cid]) return false;
    if (match(val, col.theme)) {
      await update(gameRef.current, { [`colSolved/${cid}`]: myRole, [`scores/${myRole}`]: (gameState.scores[myRole] || 0) + 20, lastActivity: Date.now() });
      addLog(`✅ Column ${cid} theme correct! +20pts`);
      return true;
    }
    addLog(`❌ Wrong theme for column ${cid}`);
    return false;
  }

  async function guessFinal(val) {
    touch();
    if (match(val, gameState.board.final.answer)) {
      await update(gameRef.current, { finalSolved: myRole, [`scores/${myRole}`]: (gameState.scores[myRole] || 0) + 30, lastActivity: Date.now() });
      endGame(myRole, "Final answer correct! +30pts");
      return true;
    }
    addLog("❌ Wrong final answer!");
    return false;
  }

  async function passTurn() {
    const next = myRole === "p1" ? "p2" : "p1";
    await update(gameRef.current, { currentTurn: next, [`af_${myRole}`]: null, [`uc_${myRole}`]: false, lastActivity: Date.now() });
  }

  async function endGame(w, reason) {
    if (!gameRef.current) return;
    await update(gameRef.current, { status: "finished", winner: w, winReason: reason, finishedAt: Date.now() });
    updateLeaderboard(w);
  }

  async function updateLeaderboard(w) {
    if (!gameState) return;
    const scores = gameState.scores || { p1:0, p2:0 };
    for (const r of ["p1", "p2"]) {
      const u = gameState[r];
      if (!u) continue;
      const lbRef = ref(db, `leaderboard/${u}`);
      const snap = await get(lbRef);
      const curr = snap.val() || { wins:0, losses:0, points:0, tokensWon:0 };
      await set(lbRef, {
        name: r === "p1" ? gameState.p1name : gameState.p2name,
        wins: (curr.wins || 0) + (w === r ? 1 : 0),
        losses: (curr.losses || 0) + (w === r ? 0 : 1),
        points: (curr.points || 0) + (scores[r] || 0),
        tokensWon: (curr.tokensWon || 0) + (w === r ? wager * 2 : 0),
      });
    }
  }

  function resetGame() {
    setScreen("lobby"); setGameId(null); setMyRole(null); setGameState(null);
    setActiveField(null); setUsedClick(false); setLog([]); setJoinId("");
  }

  /* ── DERIVED STATE ── */
  const board = gameState?.board || null;
  const isMy = gameState?.currentTurn === myRole;
  const oppRole = myRole === "p1" ? "p2" : "p1";
  const scores = gameState?.scores || { p1:0, p2:0 };
  const revealed = gameState?.revealed || {};
  const colSolved = gameState?.colSolved || {};
  const finalSolved = gameState?.finalSolved || false;
  const finalPhase = gameState?.finalPhase || false;
  const winner = gameState?.winner || null;
  const winReason = gameState?.winReason || "";
  const myName = myRole === "p1" ? gameState?.p1name || "P1" : gameState?.p2name || "P2";
  const oppName = myRole === "p1" ? gameState?.p2name || "P2" : gameState?.p1name || "P1";
  const oppAf = gameState?.[`af_${oppRole}`] || null;
  const canClick = isMy && !usedClick && !activeField && !finalPhase && !winner && gameState?.status === "active";
  const canGuess = isMy && !!activeField && !finalPhase;
  const canGuessAnytime = isMy && (usedClick || finalPhase) && !winner && gameState?.status === "active";

  /* ════════════════════════════════════════
     LOBBY SCREEN
  ════════════════════════════════════════ */
  if (screen === "lobby") return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, overflowY:"auto", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"12px" }}>
        <div style={S.card}>

          {/* WALLET */}
          <div style={{ marginBottom:14, padding:12, background:"#060606", borderRadius:8, border:"1px solid #1a1a1a" }}>
            <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:8 }}>PHANTOM WALLET</div>
            {walletAddr ? (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e" }}/>
                <span style={{ fontSize:10, color:"#22c55e", fontFamily:"monospace" }}>{walletAddr.slice(0,6)}...{walletAddr.slice(-4)}</span>
                <span style={{ fontSize:9, color:"#444", marginLeft:"auto" }}>✓ Connected</span>
              </div>
            ) : (
              <button onClick={handleConnectWallet} disabled={walletLoading} style={{ width:"100%", padding:"9px 0", background:"linear-gradient(90deg,#8b5cf6,#7c3aed)", border:"none", borderRadius:6, color:"#fff", fontFamily:"inherit", fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:1, boxShadow:"0 0 16px #8b5cf644" }}>
                {walletLoading ? "CONNECTING..." : "🔗 CONNECT PHANTOM WALLET"}
              </button>
            )}
          </div>

          {/* NAME */}
          <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Your name / username" style={S.input} maxLength={16}/>

          {/* WAGER */}
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:6 }}>WAGER — FREEDOM TOKENS</div>
            <div style={{ display:"flex", gap:6 }}>
              {WAGERS.map(w => (
                <button key={w} onClick={() => setWager(w)} style={{ flex:1, padding:"8px 0", borderRadius:6, fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer", background:wager===w?"#8b5cf6":"#0e0e0e", color:wager===w?"#fff":"#8b5cf6", border:`1px solid ${wager===w?"#8b5cf6":"#2a2a2a"}`, boxShadow:wager===w?"0 0 14px #8b5cf633":"none" }}>{w}</button>
              ))}
            </div>
          </div>

          {/* MODE TABS */}
          <div style={{ marginTop:14, display:"flex", gap:0, borderRadius:7, overflow:"hidden", border:"1px solid #1a1a1a" }}>
            {[["create","🎮 CREATE ROOM"],["join","🚪 JOIN ROOM"]].map(([m, label]) => (
              <button key={m} onClick={() => setLobbyMode(m)} style={{ flex:1, padding:"9px 0", fontFamily:"inherit", fontSize:10, fontWeight:700, cursor:"pointer", background:lobbyMode===m?"#8b5cf6":"#0a0a0a", color:lobbyMode===m?"#fff":"#555", border:"none", letterSpacing:1, transition:"all .2s" }}>{label}</button>
            ))}
          </div>

          {/* CREATE */}
          {lobbyMode === "create" && (
            <button onClick={createGame} disabled={!playerName.trim() || !uid || !walletAddr} style={{ ...S.btn, marginTop:10, background:playerName.trim()&&walletAddr?"linear-gradient(90deg,#8b5cf6,#7c3aed)":"#1a1a1a", color:playerName.trim()&&walletAddr?"#fff":"#444", boxShadow:playerName.trim()&&walletAddr?"0 0 20px #8b5cf644":"none" }}>
              🎮 CREATE ROOM & FIND OPPONENT
            </button>
          )}

          {/* JOIN */}
          {lobbyMode === "join" && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:6 }}>ENTER ROOM ID</div>
              <input value={joinId} onChange={e => setJoinId(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123"
                style={{ ...S.input, textAlign:"center", letterSpacing:8, fontFamily:"'Black Ops One',cursive", fontSize:20, color:"#22c55e", boxShadow:joinId.length===6?"0 0 12px #22c55e33":"none" }}/>
              <button onClick={joinGame} disabled={!playerName.trim() || !uid || !walletAddr || joinId.length < 6} style={{ ...S.btn, marginTop:8, background:joinId.length===6&&playerName.trim()&&walletAddr?"linear-gradient(90deg,#22c55e,#16a34a)":"#1a1a1a", color:joinId.length===6&&playerName.trim()&&walletAddr?"#000":"#444", boxShadow:joinId.length===6&&walletAddr?"0 0 20px #22c55e44":"none" }}>
                🚪 JOIN ROOM
              </button>
            </div>
          )}

          {/* ESCROW */}
          <div style={{ fontSize:8, color:"#1a1a1a", fontFamily:"monospace", textAlign:"center", marginTop:8 }}>
            Escrow: {ESCROW.slice(0,12)}…{ESCROW.slice(-6)}
          </div>

          {/* RULES */}
          <div style={{ marginTop:14, padding:12, background:"#060606", borderRadius:8, border:"1px solid #111" }}>
            <div style={{ color:"#8b5cf6", fontSize:9, fontWeight:700, letterSpacing:2, marginBottom:8 }}>GAME RULES</div>
            {[
              ["30s/turn", "Each player has 30 seconds per turn"],
              ["1 click", "Click ONE field — the clue reveals instantly"],
              ["Guess", "Guess: field answer, column theme, or final"],
              ["Final", "All fields open → 60s for the final answer"],
              ["Idle", "60s without activity = automatic loss"],
              ["Points", "Field +10 · Column theme +20 · Final +30"],
            ].map(([t, d], i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:8, color:"#8b5cf6", fontWeight:700, whiteSpace:"nowrap", minWidth:50 }}>{t}</span>
                <span style={{ fontSize:9, color:"#444", lineHeight:1.4 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    <Footer/></div>
  );

  /* ════════════════════════════════════════
     LOADING SCREEN
  ════════════════════════════════════════ */
  if (screen === "loading") return <LoadingScreen msg={loadingMsg}/>;

  /* ════════════════════════════════════════
     WAITING SCREEN
  ════════════════════════════════════════ */
  if (screen === "waiting") return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:20 }}>
        <div style={{ width:56, height:56, border:"3px solid #22c55e22", borderTop:"3px solid #22c55e", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
        <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:14, color:"#22c55e", letterSpacing:3 }}>WAITING FOR OPPONENT</div>
        <div style={{ fontSize:11, color:"#444" }}>Wager: <b style={{ color:"#a78bfa" }}>{wager}</b> FREEDOM tokens</div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:10, color:"#555", marginBottom:8, letterSpacing:1 }}>SHARE THIS ROOM ID:</div>
          <div style={{ fontSize:38, fontFamily:"'Black Ops One',cursive", color:"#22c55e", letterSpacing:8, padding:"14px 28px", background:"#0a1a0f", border:"2px solid #22c55e44", borderRadius:10, textShadow:"0 0 20px #22c55e88" }}>{gameId}</div>
          <div style={{ fontSize:9, color:"#333", marginTop:8 }}>OR opponent auto-matches with same wager ({wager} tokens)</div>
        </div>
        <button onClick={() => { set(ref(db, `assoc_games/${gameId}`), null); setScreen("lobby"); setGameId(null); setMyRole(null); }} style={{ ...S.btn, maxWidth:180, padding:"8px 0", fontSize:10 }}>CANCEL</button>
      </div>
    <Footer/></div>
  );

  /* ════════════════════════════════════════
     RESULT SCREEN
  ════════════════════════════════════════ */
  if (screen === "result" || winner) return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div style={{ ...S.card, textAlign:"center", maxWidth:340 }}>
          <div style={{ fontSize:56, lineHeight:1 }}>{winner === myRole ? "🏆" : "💀"}</div>
          <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:24, letterSpacing:3, marginTop:8, color:winner===myRole?"#22c55e":"#ef4444", textShadow:`0 0 20px ${winner===myRole?"#22c55e":"#ef4444"}88` }}>
            {winner === myRole ? "YOU WIN!" : "YOU LOSE"}
          </div>
          <div style={{ color:"#555", fontSize:11, marginTop:6, marginBottom:20 }}>{winReason}</div>
          <div style={{ display:"flex", gap:14, justifyContent:"center", marginBottom:20 }}>
            {["p1","p2"].map(r => (
              <div key={r} style={{ padding:"12px 24px", borderRadius:10, background:r===winner?"#22c55e0a":"#0a0a0a", border:`2px solid ${r===winner?"#22c55e":"#1a1a1a"}` }}>
                <div style={{ fontSize:9, color:"#444" }}>{r === myRole ? myName : oppName}</div>
                <div style={{ fontSize:30, fontWeight:900, color:r===winner?"#22c55e":"#fff" }}>{scores[r] || 0}</div>
                <div style={{ fontSize:9, color:"#333" }}>points</div>
              </div>
            ))}
          </div>
          {winner === myRole && (
            <div style={{ color:"#a78bfa", fontSize:12, marginBottom:14, padding:"8px", background:"#a78bfa0a", borderRadius:6, border:"1px solid #a78bfa33" }}>
              🎉 Winnings: <b>{wager * 2}</b> FREEDOM tokens
            </div>
          )}
          <button onClick={resetGame} style={{ ...S.btn, background:"linear-gradient(90deg,#8b5cf6,#7c3aed)", color:"#fff", boxShadow:"0 0 16px #8b5cf644" }}>
            NEW GAME
          </button>
        </div>
      </div>
    <Footer/></div>
  );

  /* ════════════════════════════════════════
     GAME BOARD
  ════════════════════════════════════════ */
  if (!board) return <LoadingScreen msg="Loading game..."/>;

  const [colA, colB, colC, colD] = board.columns;

  return (
    <div style={S.root}><style>{CSS}</style><Header/>

      {/* STATUS BAR */}
      <div style={S.statusBar}>
        <div style={{ display:"flex", gap:5, alignItems:"center", flex:1 }}>
          {["p1","p2"].map(r => (
            <div key={r} style={{ padding:"3px 10px", borderRadius:14, background:gameState?.currentTurn===r?"#8b5cf618":"#0a0a0a", border:`1px solid ${gameState?.currentTurn===r?"#8b5cf6":"#1a1a1a"}`, fontSize:10, color:r===myRole?"#a78bfa":"#555", fontWeight:gameState?.currentTurn===r?700:400, whiteSpace:"nowrap" }}>
              {r === myRole ? myName : oppName} <b style={{ color:gameState?.currentTurn===r?"#fff":"inherit" }}>{scores[r] || 0}</b>
            </div>
          ))}
        </div>
        <div style={{ width:110 }}>
          {finalPhase ? <TimerBar secs={finalTimer} max={FINAL_TIME} warn={15}/> : <TimerBar secs={turnTimer} max={TURN_TIME} warn={8}/>}
        </div>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:1, whiteSpace:"nowrap", color:finalPhase?"#f59e0b":isMy?"#22c55e":"#ef4444" }}>
          {finalPhase ? "🎯 FINAL" : isMy ? "⚡ YOUR TURN" : "⏳ WAIT"}
        </div>
        {idleTimer < 20 && <div style={{ fontSize:8, color:"#ef4444", animation:"blink 1s infinite", whiteSpace:"nowrap" }}>IDLE {idleTimer}s</div>}
        {isMy && !finalPhase && !winner && (
          <button onClick={() => { touch(); passTurn(); addLog("Turn passed."); }} style={{ padding:"2px 8px", borderRadius:4, background:"#111", color:"#333", border:"1px solid #1a1a1a", fontFamily:"inherit", fontSize:8, cursor:"pointer" }}>PASS</button>
        )}
      </div>

      {/* HINT BAR */}
      <div style={{ fontSize:9, textAlign:"center", padding:"3px 0", borderBottom:"1px solid #0a0a0a", color:isMy&&canClick?"#8b5cf6":isMy&&activeField?"#a78bfa":"#222", background:"#050505" }}>
        {finalPhase ? "🎯 Guess column theme or final answer!"
          : isMy ? canClick ? "👆 Click any field to reveal it" : activeField ? `Field ${activeField} open — type answer, theme or final` : "Wait for your next turn..."
          : "Waiting for opponent..."}
      </div>

      {/* BOARD */}
      <div style={{ flex:1, overflowY:"auto", padding:"6px 4px" }}>
        <div style={{ maxWidth:880, margin:"0 auto" }}>

          {/* TOP HEADERS: A and D */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 1fr", gap:4, marginBottom:3 }}>
            <div style={{ textAlign:"center", padding:"4px 0", borderBottom:`2px solid ${ACC.A}55` }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:18, color:ACC.A, letterSpacing:3, textShadow:`0 0 8px ${ACC.A}66` }}>A</span>
            </div>
            <div style={{ textAlign:"center", padding:"4px 0", borderBottom:"1px solid #111" }}>
              <span style={{ fontSize:8, color:"#2a2a2a", letterSpacing:1 }}>FINAL</span>
            </div>
            <div style={{ textAlign:"center", padding:"4px 0", borderBottom:`2px solid ${ACC.D}55` }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:18, color:ACC.D, letterSpacing:3, textShadow:`0 0 8px ${ACC.D}66` }}>D</span>
            </div>
          </div>

          {/* ROW 1: A fields | FINAL (spans 2 rows) | D fields reversed */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 1fr", gap:4, marginBottom:3 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:3 }}>
              {colA.fields.map(f => (
                <Field key={f.id} field={f} revealed={!!revealed[f.id]} active={activeField===f.id} oppActive={oppAf===f.id}
                  canClick={canClick} canGuess={canGuess&&activeField===f.id} onReveal={revealField} onGuess={guessField} accent={ACC.A}/>
              ))}
            </div>
            {/* FINAL BOX — spans 2 rows via CSS trick */}
            <div style={{ gridRow:"1 / 3", display:"flex" }}>
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:finalPhase?"#a78bfa08":"#050508", border:`2px solid ${finalPhase?"#a78bfa55":"#111"}`, borderRadius:8, padding:8, textAlign:"center", animation:finalPhase?"glowPulse 2s infinite":"none", boxSizing:"border-box" }}>
                <div style={{ fontSize:8, color:"#333", letterSpacing:1, marginBottom:4 }}>FINAL ANSWER</div>
                {finalSolved
                  ? <div style={{ fontSize:11, fontWeight:900, color:"#22c55e", letterSpacing:1 }}>{board.final.answer}</div>
                  : <div style={{ fontSize:22, color:"#1a1a1a", fontWeight:900, fontFamily:"'Black Ops One',cursive" }}>???</div>
                }
                <div style={{ fontSize:7, color:"#222", marginTop:3 }}>{board.final.hint}</div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:3 }}>
              {[...colD.fields].reverse().map(f => (
                <Field key={f.id} field={f} revealed={!!revealed[f.id]} active={activeField===f.id} oppActive={oppAf===f.id}
                  canClick={canClick} canGuess={canGuess&&activeField===f.id} onReveal={revealField} onGuess={guessField} accent={ACC.D}/>
              ))}
            </div>
          </div>

          {/* ROW 2: B fields | spacer | C fields reversed */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 1fr", gap:4, marginBottom:3 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:3 }}>
              {colB.fields.map(f => (
                <Field key={f.id} field={f} revealed={!!revealed[f.id]} active={activeField===f.id} oppActive={oppAf===f.id}
                  canClick={canClick} canGuess={canGuess&&activeField===f.id} onReveal={revealField} onGuess={guessField} accent={ACC.B}/>
              ))}
            </div>
            <div/>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:3 }}>
              {[...colC.fields].reverse().map(f => (
                <Field key={f.id} field={f} revealed={!!revealed[f.id]} active={activeField===f.id} oppActive={oppAf===f.id}
                  canClick={canClick} canGuess={canGuess&&activeField===f.id} onReveal={revealField} onGuess={guessField} accent={ACC.C}/>
              ))}
            </div>
          </div>

          {/* BOTTOM HEADERS: B and C */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 1fr", gap:4, marginBottom:4 }}>
            <div style={{ textAlign:"center", padding:"3px 0", borderTop:`2px solid ${ACC.B}55` }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:18, color:ACC.B, letterSpacing:3, textShadow:`0 0 8px ${ACC.B}66` }}>B</span>
            </div>
            <div/>
            <div style={{ textAlign:"center", padding:"3px 0", borderTop:`2px solid ${ACC.C}55` }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:18, color:ACC.C, letterSpacing:3, textShadow:`0 0 8px ${ACC.C}66` }}>C</span>
            </div>
          </div>

          {/* GUESS ROW */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 80px 1fr 1fr", gap:3, marginBottom:6 }}>
            <GuessRow label="Theme A" solved={!!colSolved.A} solvedText={colA.theme} disabled={!canGuessAnytime} onGuess={v => guessCol("A", v)} accent={ACC.A}/>
            <GuessRow label="Theme B" solved={!!colSolved.B} solvedText={colB.theme} disabled={!canGuessAnytime} onGuess={v => guessCol("B", v)} accent={ACC.B}/>
            <GuessRow label="Final" solved={!!finalSolved} solvedText={board.final.answer} disabled={!canGuessAnytime} onGuess={guessFinal} accent="#a78bfa"/>
            <GuessRow label="Theme C" solved={!!colSolved.C} solvedText={colC.theme} disabled={!canGuessAnytime} onGuess={v => guessCol("C", v)} accent={ACC.C}/>
            <GuessRow label="Theme D" solved={!!colSolved.D} solvedText={colD.theme} disabled={!canGuessAnytime} onGuess={v => guessCol("D", v)} accent={ACC.D}/>
          </div>

          {/* LOG */}
          {log.length > 0 && (
            <div style={{ padding:"5px 10px", background:"#060606", borderRadius:6, border:"1px solid #0e0e0e" }}>
              {log.map((l, i) => (
                <div key={i} style={{ fontSize:9, color:i===0?"#aaa":"#2a2a2a", padding:"2px 0", borderBottom:i<log.length-1?"1px solid #0a0a0a":"none" }}>{l}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </div>
  );
}

/* ═══════════════════════════════════
   STYLES
═══════════════════════════════════ */
const S = {
  root: { height:"100vh", display:"flex", flexDirection:"column", background:"#030305", fontFamily:"'Rajdhani','Oswald',sans-serif", color:"#fff", overflow:"hidden" },
  card: { width:"100%", maxWidth:500, background:"#080810", border:"1px solid #12121e", borderRadius:12, padding:"18px 14px", boxSizing:"border-box" },
  input: { width:"100%", background:"#0a0a14", border:"1px solid #1a1a2e", borderRadius:7, padding:"9px 12px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" },
  btn: { width:"100%", padding:"11px 0", background:"#0a0a0a", color:"#555", border:"1px solid #1a1a1a", borderRadius:7, fontFamily:"inherit", fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:2, transition:"all .2s" },
  statusBar: { display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", padding:"5px 8px", background:"#070710", borderBottom:"1px solid #0e0e0e", flexShrink:0 },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;600;700&display=swap');
  @keyframes pop { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 16px #a78bfa22} 50%{box-shadow:0 0 32px #a78bfa55} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width:3px }
  ::-webkit-scrollbar-track { background:#060606 }
  ::-webkit-scrollbar-thumb { background:#1a1a1a; border-radius:2px }
`;
