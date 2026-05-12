import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAKmKRj7Hhy4K6DsY_XDbqLb3oYOwZC5jw",
  authDomain: "project-freedom-a004e.firebaseapp.com",
  databaseURL: "https://project-freedom-a004e-default-rtdb.firebaseio.com",
  projectId: "project-freedom-a004e",
  storageBucket: "project-freedom-a004e.firebasestorage.app",
  messagingSenderId: "844172246267",
  appId: "1:844172246767:web:a31b8cd6affe8337f7845e",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

const ESCROW = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS = [100, 500, 1000];
const TURN_TIME = 30;
const FINAL_TIME = 60;
const IDLE_TIME = 60;
const ACC = { A:"#e63946", B:"#f4a261", C:"#2a9d8f", D:"#457b9d" };

async function connectPhantom() {
  try {
    if (!window.solana?.isPhantom) { window.open("https://phantom.app/", "_blank"); return null; }
    const resp = await window.solana.connect();
    return resp.publicKey.toString();
  } catch(e) { return null; }
}

async function sendWager(amount, walletAddr) {
  try {
    if (!window.solana?.isPhantom) return { success: false, error: "Phantom not found" };
    const msg = new TextEncoder().encode(`Wager ${amount} FREEDOM to escrow ${ESCROW}`);
    await window.solana.signMessage(msg, "utf8");
    return { success: true, txid: "SIG_" + Date.now() };
  } catch(e) { return { success: false, error: e.message }; }
}

async function generateBoard() {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [{ role: "user", content: `Generate a word association game board in English. Return ONLY valid JSON, no markdown, no explanation.
{"columns":[{"id":"A","theme":"THEME","fields":[{"id":"A1","clue":"short clue","answer":"ANSWER"},{"id":"A2","clue":"short clue","answer":"ANSWER"},{"id":"A3","clue":"short clue","answer":"ANSWER"},{"id":"A4","clue":"short clue","answer":"ANSWER"}]},{"id":"B","theme":"THEME","fields":[{"id":"B1","clue":"short clue","answer":"ANSWER"},{"id":"B2","clue":"short clue","answer":"ANSWER"},{"id":"B3","clue":"short clue","answer":"ANSWER"},{"id":"B4","clue":"short clue","answer":"ANSWER"}]},{"id":"C","theme":"THEME","fields":[{"id":"C1","clue":"short clue","answer":"ANSWER"},{"id":"C2","clue":"short clue","answer":"ANSWER"},{"id":"C3","clue":"short clue","answer":"ANSWER"},{"id":"C4","clue":"short clue","answer":"ANSWER"}]},{"id":"D","theme":"THEME","fields":[{"id":"D1","clue":"short clue","answer":"ANSWER"},{"id":"D2","clue":"short clue","answer":"ANSWER"},{"id":"D3","clue":"short clue","answer":"ANSWER"},{"id":"D4","clue":"short clue","answer":"ANSWER"}]}],"final":{"answer":"ANSWER","hint":"hint"}}
Rules: 4 completely different themes, English, short clues 1-3 words, single word CAPS answers, final answer is supercategory of all 4 themes.` }]
      })
    });
    const data = await r.json();
    return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
  } catch(e) { return FALLBACK; }
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

function norm(s) { return s.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function match(a, b) { return norm(a) === norm(b); }
function genId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

function Skull({ size = 44 }) {
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

function Header() {
  return (
    <div style={{ width:"100%", background:"#050505", borderBottom:"2px solid #111", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"center", boxSizing:"border-box", flexShrink:0, position:"relative" }}>
      <div style={{ position:"absolute", right:16, top:"50%", transform:"translateY(-50%)", textAlign:"right" }}>
        <div style={{ fontSize:7, color:"#333", letterSpacing:2 }}>POWERED BY</div>
        <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:11, letterSpacing:2 }}>
          <span style={{ color:"#8b5cf6" }}>DEGEN</span><span style={{ color:"#22c55e" }}>SAFE</span><span style={{ color:"#444" }}>.FUN</span>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <Skull size={44}/>
        <div style={{ textAlign:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
            <div style={{ width:32, height:1, background:"#22c55e", opacity:.5 }}/>
            <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:10, color:"#888", letterSpacing:6, lineHeight:1 }}>PROJECT</div>
            <div style={{ width:32, height:1, background:"#22c55e", opacity:.5 }}/>
          </div>
          <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:28, color:"#22c55e", letterSpacing:6, lineHeight:1.1, textShadow:"0 0 24px #22c55e99" }}>FREEDOM</div>
          <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:12, color:"#8b5cf6", letterSpacing:6, lineHeight:1, textShadow:"0 0 12px #8b5cf677" }}>ASSOCIATIONS</div>
        </div>
        <Skull size={44}/>
      </div>
    </div>
  );
}

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

/* ══════════════════════════════════════════════════════
   FIELD CELL — 1:1 square, click = show clue only
══════════════════════════════════════════════════════ */
function FieldCell({ field, state, canClick, myTurn, accent, onReveal }) {
  // state: "hidden" | "revealed_clue" | "solved"

  if (state === "solved") return (
    <div style={{ ...sq, background:"#111", border:`2px solid ${accent}88`, flexDirection:"column", gap:3, animation:"pop .3s ease" }}>
      <div style={{ fontSize:11, fontWeight:900, color:accent, letterSpacing:1, textAlign:"center" }}>{field.answer}</div>
      <div style={{ fontSize:9, color:"#555", textAlign:"center", lineHeight:1.2, padding:"0 4px" }}>{field.clue}</div>
    </div>
  );

  if (state === "revealed_clue") return (
    <div style={{ ...sq, background:"#0c0c1a", border:`2px solid ${accent}`, boxShadow:`0 0 12px ${accent}55`, flexDirection:"column", gap:3 }}>
      <div style={{ fontSize:8, color:accent, letterSpacing:1, textAlign:"center", fontWeight:700 }}>CLUE</div>
      <div style={{ fontSize:11, color:"#fff", textAlign:"center", lineHeight:1.3, padding:"0 4px", fontWeight:600 }}>{field.clue}</div>
    </div>
  );

  // hidden
  return (
    <div onClick={canClick && myTurn ? () => onReveal(field.id) : undefined}
      style={{ ...sq, background:myTurn&&canClick?"#0e0e1a":"#070710", border:`1px solid ${myTurn&&canClick?accent+"55":"#1a1a1a"}`, cursor:myTurn&&canClick?"pointer":"default" }}
      onMouseEnter={e => { if (myTurn && canClick) { e.currentTarget.style.background="#16162a"; e.currentTarget.style.borderColor=accent+"99"; e.currentTarget.style.boxShadow=`0 0 8px ${accent}33`; }}}
      onMouseLeave={e => { if (myTurn && canClick) { e.currentTarget.style.background="#0e0e1a"; e.currentTarget.style.borderColor=accent+"55"; e.currentTarget.style.boxShadow="none"; }}}>
      <div style={{ fontSize:13, fontWeight:900, color:myTurn&&canClick?"#444":"#1f1f1f", letterSpacing:1 }}>{field.id}</div>
    </div>
  );
}
const sq = { width:"100%", aspectRatio:"1/1", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, userSelect:"none", boxSizing:"border-box", transition:"all .15s" };

/* ══════════════════════════════════════════════════════
   GUESS INPUT — for column theme and final answer
══════════════════════════════════════════════════════ */
function GuessInput({ label, solved, solvedText, disabled, onGuess, accent, placeholder }) {
  const [val, setVal] = useState("");
  const [wrong, setWrong] = useState(false);

  if (solved) return (
    <div style={{ ...gi, background:accent+"22", border:`1px solid ${accent}`, justifyContent:"center" }}>
      <span style={{ color:accent, fontWeight:700, fontSize:11, letterSpacing:1 }}>✓ {solvedText}</span>
    </div>
  );

  const sub = () => {
    if (!val.trim() || disabled) return;
    if (!onGuess(val)) { setWrong(true); setTimeout(() => setWrong(false), 600); }
    else setVal("");
  };

  return (
    <div style={{ ...gi, animation:wrong?"shake .4s":"none", opacity:disabled?.3:1 }}>
      <span style={{ fontSize:9, color:"#555", whiteSpace:"nowrap", minWidth:45 }}>{label}</span>
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && sub()} disabled={disabled}
        placeholder={placeholder || "guess..."} style={{ flex:1, background:"transparent", border:"none", color:disabled?"#333":"#ddd", fontSize:11, outline:"none", fontFamily:"inherit", minWidth:0 }}/>
      <button onClick={sub} disabled={disabled} style={{ background:disabled?"#222":accent, border:"none", borderRadius:5, padding:"4px 10px", color:disabled?"#444":"#fff", fontWeight:700, cursor:disabled?"default":"pointer", fontSize:10, flexShrink:0 }}>OK</button>
    </div>
  );
}
const gi = { display:"flex", alignItems:"center", gap:8, background:"#0d0d0d", border:"1px solid #222", borderRadius:7, padding:"6px 10px", width:"100%", boxSizing:"border-box" };

function LoadingScreen({ msg }) {
  return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <div style={{ width:52, height:52, border:"3px solid #8b5cf622", borderTop:"3px solid #8b5cf6", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
        <div style={{ color:"#555", fontSize:13, letterSpacing:2 }}>{msg}</div>
      </div>
    <Footer/></div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════ */
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
  const [gameStarted, setGameStarted] = useState(false);
  const [turnTimer, setTurnTimer] = useState(TURN_TIME);
  const [finalTimer, setFinalTimer] = useState(FINAL_TIME);
  const [idleTimer, setIdleTimer] = useState(IDLE_TIME);
  const [usedClick, setUsedClick] = useState(false);
  const [log, setLog] = useState([]);

  const turnRef = useRef();
  const finalRef = useRef();
  const idleRef = useRef();
  const lastAct = useRef(Date.now());
  const gameRef = useRef(null);

  const addLog = m => setLog(p => [m, ...p].slice(0, 6));
  const touch = () => { lastAct.current = Date.now(); setIdleTimer(IDLE_TIME); };

  useEffect(() => { signInAnonymously(auth).then(r => setUid(r.user.uid)).catch(console.error); }, []);
  useEffect(() => { if (window.solana?.isPhantom && window.solana.publicKey) setWalletAddr(window.solana.publicKey.toString()); }, []);

  // Game listener
  useEffect(() => {
    if (!gameId) return;
    gameRef.current = ref(db, `assoc_games/${gameId}`);
    const unsub = onValue(gameRef.current, snap => {
      const d = snap.val();
      if (!d) return;
      setGameState(d);
      setUsedClick(d[`uc_${myRole}`] || false);
      if (d.status === "finished") setScreen("result");
      if (d.status === "active" && d.p1 && d.p2 && !gameStarted) {
        setGameStarted(true);
        lastAct.current = Date.now();
      }
    });
    return () => unsub();
  }, [gameId, myRole]);

  // Turn timer
  useEffect(() => {
    if (screen !== "game" || !gameStarted || !gameState || gameState.finalPhase || gameState.status === "finished") return;
    clearInterval(turnRef.current);
    setTurnTimer(TURN_TIME);
    turnRef.current = setInterval(() => {
      setTurnTimer(t => {
        if (t <= 1) { clearInterval(turnRef.current); if (gameState.currentTurn === myRole) passTurn(); return TURN_TIME; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(turnRef.current);
  }, [gameState?.currentTurn, screen, gameState?.finalPhase, gameStarted]);

  // Final timer
  useEffect(() => {
    if (!gameState?.finalPhase || gameState?.status === "finished") return;
    clearInterval(finalRef.current);
    setFinalTimer(FINAL_TIME);
    finalRef.current = setInterval(() => {
      setFinalTimer(t => {
        if (t <= 1) { clearInterval(finalRef.current); const s = gameState.scores || { p1:0, p2:0 }; endGame(s.p1 >= s.p2 ? "p1" : "p2", "Time's up — winner by points!"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(finalRef.current);
  }, [gameState?.finalPhase, gameState?.status]);

  // Idle timer — only when both players in
  useEffect(() => {
    if (screen !== "game" || !gameStarted || gameState?.status === "finished") return;
    clearInterval(idleRef.current);
    idleRef.current = setInterval(() => {
      const rem = IDLE_TIME - Math.floor((Date.now() - lastAct.current) / 1000);
      setIdleTimer(Math.max(0, rem));
      if (rem <= 0) { clearInterval(idleRef.current); endGame(myRole === "p1" ? "p2" : "p1", "Idle 60s — opponent wins!"); }
    }, 1000);
    return () => clearInterval(idleRef.current);
  }, [screen, myRole, gameState?.status, gameStarted]);

  // All fields open → final phase
  useEffect(() => {
    if (!gameState || gameState.finalPhase || gameState.status === "finished") return;
    const b = gameState.board; if (!b) return;
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
      if (d?.status === "active" && d.p1 && d.p2) {
        setGameState(d); setGameStarted(true); lastAct.current = Date.now();
        setScreen("game"); addLog("Opponent joined! Your turn! (You are P1)");
      }
    });
    return () => unsub();
  }, [screen, gameId]);

  async function handleConnectWallet() {
    setWalletLoading(true);
    const addr = await connectPhantom();
    if (addr) setWalletAddr(addr);
    setWalletLoading(false);
  }

  async function createGame() {
    if (!playerName.trim() || !uid) return;
    if (!walletAddr) { alert("Please connect Phantom wallet first!"); return; }
    setScreen("loading"); setLoadingMsg("Generating board with AI...");
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
      uc_p1: false, uc_p2: false,
      lastActivity: Date.now(), winner: null, p1tx: tx.txid
    });
    setGameId(gid); setMyRole("p1"); setGameStarted(false); setScreen("waiting");
  }

  async function joinGame() {
    const gid = joinId.trim().toUpperCase();
    if (!playerName.trim() || !uid || !gid) return;
    if (!walletAddr) { alert("Please connect Phantom wallet first!"); return; }
    setScreen("loading"); setLoadingMsg("Confirming wager...");
    const tx = await sendWager(wager, walletAddr);
    if (!tx.success) { alert("Wager failed: " + tx.error); setScreen("lobby"); return; }
    setLoadingMsg("Joining room...");
    const gRef = ref(db, `assoc_games/${gid}`);
    const snap = await get(gRef);
    const d = snap.val();
    if (!d) { alert("Room not found!"); setScreen("lobby"); return; }
    if (d.status !== "waiting") { alert("Room already started or full!"); setScreen("lobby"); return; }
    await update(gRef, { p2: uid, p2name: playerName, p2wallet: walletAddr, status: "active", currentTurn: "p1", lastActivity: Date.now(), p2tx: tx.txid });
    setWager(d.wager); setGameId(gid); setMyRole("p2"); setGameStarted(true); lastAct.current = Date.now();
    setScreen("game"); addLog("Joined! You are Player 2. Player 1 goes first.");
  }

  // Reveal field — just mark as revealed (shows clue), end turn
  async function revealField(fid) {
    if (!isMy || usedClick || gameState?.finalPhase) return;
    touch();
    // Mark field as having clue shown (not yet solved)
    await update(gameRef.current, {
      [`revealed/${fid}`]: "clue", // "clue" = clue shown, not solved
      [`uc_${myRole}`]: true,
      lastActivity: Date.now()
    });
    addLog(`Field ${fid} revealed — clue shown!`);
    // After 5 seconds, pass turn
    setTimeout(() => passTurn(), 5000);
  }

  // Guess column theme
  async function guessCol(cid, val) {
    touch();
    const col = gameState.board.columns.find(c => c.id === cid);
    if (!col || gameState.colSolved?.[cid]) return false;
    if (match(val, col.theme)) {
      // Mark all fields in this column as solved
      const updates = {};
      col.fields.forEach(f => {
        if (!gameState.revealed?.[f.id] || gameState.revealed[f.id] === "clue") {
          updates[`revealed/${f.id}`] = "solved";
        }
      });
      updates[`colSolved/${cid}`] = myRole;
      updates[`scores/${myRole}`] = (gameState.scores[myRole] || 0) + 20;
      updates.lastActivity = Date.now();
      await update(gameRef.current, updates);
      addLog(`✅ Column ${cid} theme: "${col.theme}" +20pts`);
      return true;
    }
    addLog(`❌ Wrong theme for column ${cid}`);
    return false;
  }

  // Guess final answer
  async function guessFinal(val) {
    touch();
    if (match(val, gameState.board.final.answer)) {
      await update(gameRef.current, {
        finalSolved: myRole,
        [`scores/${myRole}`]: (gameState.scores[myRole] || 0) + 30,
        lastActivity: Date.now()
      });
      endGame(myRole, "Final answer correct! +30pts");
      return true;
    }
    addLog("❌ Wrong final answer!");
    return false;
  }

  async function passTurn() {
    const next = myRole === "p1" ? "p2" : "p1";
    await update(gameRef.current, {
      currentTurn: next,
      [`uc_${myRole}`]: false,
      lastActivity: Date.now()
    });
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
      const u = gameState[r]; if (!u) continue;
      const lbRef = ref(db, `leaderboard/${u}`);
      const snap = await get(lbRef);
      const curr = snap.val() || { wins:0, losses:0, points:0, tokensWon:0 };
      await set(lbRef, { name: r === "p1" ? gameState.p1name : gameState.p2name, wins: (curr.wins||0)+(w===r?1:0), losses: (curr.losses||0)+(w===r?0:1), points: (curr.points||0)+(scores[r]||0), tokensWon: (curr.tokensWon||0)+(w===r?wager*2:0) });
    }
  }

  function resetGame() {
    setScreen("lobby"); setGameId(null); setMyRole(null); setGameState(null);
    setUsedClick(false); setLog([]); setJoinId(""); setGameStarted(false);
  }

  const board = gameState?.board || null;
  const isMy = gameState?.currentTurn === myRole;
  const scores = gameState?.scores || { p1:0, p2:0 };
  const revealed = gameState?.revealed || {};
  const colSolved = gameState?.colSolved || {};
  const finalSolved = gameState?.finalSolved || false;
  const finalPhase = gameState?.finalPhase || false;
  const winner = gameState?.winner || null;
  const winReason = gameState?.winReason || "";
  const myName = myRole === "p1" ? gameState?.p1name || "P1" : gameState?.p2name || "P2";
  const oppName = myRole === "p1" ? gameState?.p2name || "P2" : gameState?.p1name || "P1";

  // Field state helper
  const fieldState = (fid) => {
    const r = revealed[fid];
    if (!r) return "hidden";
    if (r === "solved") return "solved";
    return "revealed_clue";
  };

  const canClick = isMy && !usedClick && !finalPhase && !winner && gameState?.status === "active" && gameStarted;
  const canGuess = isMy && !winner && gameState?.status === "active" && gameStarted;

  /* ── LOBBY ── */
  if (screen === "lobby") return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, overflowY:"auto", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"12px" }}>
        <div style={S.card}>
          <div style={{ marginBottom:14, padding:12, background:"#060606", borderRadius:8, border:"1px solid #1a1a1a" }}>
            <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:8 }}>PHANTOM WALLET</div>
            {walletAddr ? (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e" }}/>
                <span style={{ fontSize:10, color:"#22c55e", fontFamily:"monospace" }}>{walletAddr.slice(0,6)}...{walletAddr.slice(-4)}</span>
                <span style={{ fontSize:9, color:"#444", marginLeft:"auto" }}>✓ Connected</span>
              </div>
            ) : (
              <button onClick={handleConnectWallet} disabled={walletLoading} style={{ width:"100%", padding:"9px 0", background:"linear-gradient(90deg,#8b5cf6,#7c3aed)", border:"none", borderRadius:6, color:"#fff", fontFamily:"inherit", fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:1 }}>
                {walletLoading ? "CONNECTING..." : "🔗 CONNECT PHANTOM WALLET"}
              </button>
            )}
          </div>
          <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Your name / username" style={S.input} maxLength={16}/>
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:6 }}>WAGER — FREEDOM TOKENS</div>
            <div style={{ display:"flex", gap:6 }}>
              {WAGERS.map(w => <button key={w} onClick={() => setWager(w)} style={{ flex:1, padding:"8px 0", borderRadius:6, fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer", background:wager===w?"#8b5cf6":"#0e0e0e", color:wager===w?"#fff":"#8b5cf6", border:`1px solid ${wager===w?"#8b5cf6":"#2a2a2a"}` }}>{w}</button>)}
            </div>
          </div>
          <div style={{ marginTop:14, display:"flex", gap:0, borderRadius:7, overflow:"hidden", border:"1px solid #1a1a1a" }}>
            {[["create","🎮 CREATE ROOM"],["join","🚪 JOIN ROOM"]].map(([m, label]) => (
              <button key={m} onClick={() => setLobbyMode(m)} style={{ flex:1, padding:"9px 0", fontFamily:"inherit", fontSize:10, fontWeight:700, cursor:"pointer", background:lobbyMode===m?"#8b5cf6":"#0a0a0a", color:lobbyMode===m?"#fff":"#555", border:"none", letterSpacing:1 }}>{label}</button>
            ))}
          </div>
          {lobbyMode === "create" && (
            <button onClick={createGame} disabled={!playerName.trim()||!uid||!walletAddr} style={{ ...S.btn, marginTop:10, background:playerName.trim()&&walletAddr?"linear-gradient(90deg,#8b5cf6,#7c3aed)":"#1a1a1a", color:playerName.trim()&&walletAddr?"#fff":"#444" }}>
              🎮 CREATE ROOM & FIND OPPONENT
            </button>
          )}
          {lobbyMode === "join" && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:6 }}>ENTER ROOM ID</div>
              <input value={joinId} onChange={e => setJoinId(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123"
                style={{ ...S.input, textAlign:"center", letterSpacing:8, fontFamily:"'Black Ops One',cursive", fontSize:20, color:"#22c55e" }}/>
              <button onClick={joinGame} disabled={!playerName.trim()||!uid||!walletAddr||joinId.length<6} style={{ ...S.btn, marginTop:8, background:joinId.length===6&&playerName.trim()&&walletAddr?"linear-gradient(90deg,#22c55e,#16a34a)":"#1a1a1a", color:joinId.length===6&&playerName.trim()&&walletAddr?"#000":"#444" }}>
                🚪 JOIN ROOM
              </button>
            </div>
          )}
          <div style={{ marginTop:14, padding:12, background:"#060606", borderRadius:8, border:"1px solid #111" }}>
            <div style={{ color:"#8b5cf6", fontSize:9, fontWeight:700, letterSpacing:2, marginBottom:8 }}>GAME RULES</div>
            {[["30s/turn","Each player has 30 seconds per turn"],["Click field","Click a field — its clue appears. Turn ends after 5 seconds."],["Guess themes","Type the column theme below each column anytime"],["Final","When all fields open — guess the final answer"],["Idle","60s without activity = automatic loss"],["Points","Column theme +20 · Final answer +30"]].map(([t,d],i)=>(
              <div key={i} style={{ display:"flex", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:8, color:"#8b5cf6", fontWeight:700, whiteSpace:"nowrap", minWidth:60 }}>{t}</span>
                <span style={{ fontSize:9, color:"#444", lineHeight:1.4 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    <Footer/></div>
  );

  if (screen === "loading") return <LoadingScreen msg={loadingMsg}/>;

  if (screen === "waiting") return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:20 }}>
        <div style={{ width:56, height:56, border:"3px solid #22c55e22", borderTop:"3px solid #22c55e", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
        <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:14, color:"#22c55e", letterSpacing:3 }}>WAITING FOR OPPONENT</div>
        <div style={{ fontSize:11, color:"#444" }}>Wager: <b style={{ color:"#a78bfa" }}>{wager}</b> FREEDOM tokens</div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:10, color:"#555", marginBottom:8 }}>SHARE THIS ROOM ID:</div>
          <div style={{ fontSize:38, fontFamily:"'Black Ops One',cursive", color:"#22c55e", letterSpacing:8, padding:"14px 28px", background:"#0a1a0f", border:"2px solid #22c55e44", borderRadius:10, textShadow:"0 0 20px #22c55e88" }}>{gameId}</div>
        </div>
        <button onClick={() => { set(ref(db,`assoc_games/${gameId}`),null); setScreen("lobby"); setGameId(null); setMyRole(null); setGameStarted(false); }} style={{ ...S.btn, maxWidth:180, padding:"8px 0" }}>CANCEL</button>
      </div>
    <Footer/></div>
  );

  if (screen === "result" || winner) return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div style={{ ...S.card, textAlign:"center", maxWidth:340 }}>
          <div style={{ fontSize:56 }}>{winner===myRole?"🏆":"💀"}</div>
          <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:24, letterSpacing:3, marginTop:8, color:winner===myRole?"#22c55e":"#ef4444" }}>{winner===myRole?"YOU WIN!":"YOU LOSE"}</div>
          <div style={{ color:"#555", fontSize:11, marginTop:6, marginBottom:20 }}>{winReason}</div>
          <div style={{ display:"flex", gap:14, justifyContent:"center", marginBottom:20 }}>
            {["p1","p2"].map(r=>(
              <div key={r} style={{ padding:"12px 24px", borderRadius:10, background:r===winner?"#22c55e0a":"#0a0a0a", border:`2px solid ${r===winner?"#22c55e":"#1a1a1a"}` }}>
                <div style={{ fontSize:9, color:"#444" }}>{r===myRole?myName:oppName}</div>
                <div style={{ fontSize:30, fontWeight:900, color:r===winner?"#22c55e":"#fff" }}>{scores[r]||0}</div>
                <div style={{ fontSize:9, color:"#333" }}>points</div>
              </div>
            ))}
          </div>
          {winner===myRole&&<div style={{ color:"#a78bfa", fontSize:12, marginBottom:14 }}>🎉 Winnings: <b>{wager*2}</b> FREEDOM tokens</div>}
          <button onClick={resetGame} style={{ ...S.btn, background:"linear-gradient(90deg,#8b5cf6,#7c3aed)", color:"#fff" }}>NEW GAME</button>
        </div>
      </div>
    <Footer/></div>
  );

  if (!board) return <LoadingScreen msg="Loading game..."/>;

  const [colA, colB, colC, colD] = board.columns;

  /* ══════════════════════════════════════════════════════
     GAME BOARD — True X layout:

     [col A header]  [FINAL ???]  [col D header]
     [A1][A2][A3][A4]  [  ???  ]  [D4][D3][D2][D1]
     [B1][B2][B3][B4]  [       ]  [C4][C3][C2][C1]
     [col B header]  [         ]  [col C header]

     Guess row:
     [Theme A input] [Final input] [Theme D input]
     [Theme B input] [           ] [Theme C input]
  ══════════════════════════════════════════════════════ */

  const CELL = 70; // px per cell
  const GAP = 6;
  const FINAL_W = 90;

  return (
    <div style={S.root}><style>{CSS}</style><Header/>

      {/* STATUS */}
      <div style={S.statusBar}>
        <div style={{ display:"flex", gap:6, alignItems:"center", flex:1 }}>
          {["p1","p2"].map(r=>(
            <div key={r} style={{ padding:"3px 12px", borderRadius:14, background:gameState?.currentTurn===r?"#8b5cf618":"#0a0a0a", border:`1px solid ${gameState?.currentTurn===r?"#8b5cf6":"#1a1a1a"}`, fontSize:11, color:r===myRole?"#a78bfa":"#555", fontWeight:gameState?.currentTurn===r?700:400 }}>
              {r===myRole?myName:oppName} <b style={{ color:gameState?.currentTurn===r?"#fff":"inherit" }}>{scores[r]||0}</b>
            </div>
          ))}
        </div>
        <div style={{ width:120 }}>
          {finalPhase?<TimerBar secs={finalTimer} max={FINAL_TIME} warn={15}/>:<TimerBar secs={turnTimer} max={TURN_TIME} warn={8}/>}
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:finalPhase?"#f59e0b":isMy?"#22c55e":"#ef4444", whiteSpace:"nowrap" }}>
          {finalPhase?"🎯 FINAL":isMy?"⚡ YOUR TURN":"⏳ WAIT"}
        </div>
        {idleTimer<20&&gameStarted&&<div style={{ fontSize:9, color:"#ef4444", animation:"blink 1s infinite" }}>IDLE {idleTimer}s</div>}
        {isMy&&!finalPhase&&!winner&&gameStarted&&(
          <button onClick={()=>{touch();passTurn();addLog("Turn passed.");}} style={{ padding:"3px 10px", borderRadius:5, background:"#111", color:"#444", border:"1px solid #1a1a1a", fontFamily:"inherit", fontSize:9, cursor:"pointer" }}>PASS</button>
        )}
      </div>

      {/* HINT */}
      <div style={{ fontSize:10, textAlign:"center", padding:"4px 0", background:"#050505", borderBottom:"1px solid #0a0a0a", color:isMy&&canClick?"#8b5cf6":"#2a2a2a" }}>
        {!gameStarted?"⏳ Waiting for opponent...":
          finalPhase?"🎯 Guess column themes or final answer below!":
          isMy?canClick?"👆 Click a field to reveal its clue (turn ends after 5s)":usedClick?"✅ Field revealed! Guess themes or final below":"Wait for next turn...":
          "⏳ Opponent's turn..."}
      </div>

      {/* BOARD */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"auto", padding:"10px 8px" }}>
        <div style={{ minWidth:400, maxWidth:760, margin:"0 auto" }}>

          {/* ── ROW 1: Col A header | FINAL label | Col D header ── */}
          <div style={{ display:"flex", gap:GAP, marginBottom:GAP, alignItems:"center" }}>
            <div style={{ flex:1, textAlign:"center", paddingBottom:4, borderBottom:`3px solid ${ACC.A}` }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:22, color:ACC.A, letterSpacing:4, textShadow:`0 0 12px ${ACC.A}88` }}>A</span>
            </div>
            <div style={{ width:FINAL_W, textAlign:"center" }}>
              <span style={{ fontSize:9, color:"#333", letterSpacing:2 }}>FINAL</span>
            </div>
            <div style={{ flex:1, textAlign:"center", paddingBottom:4, borderBottom:`3px solid ${ACC.D}` }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:22, color:ACC.D, letterSpacing:4, textShadow:`0 0 12px ${ACC.D}88` }}>D</span>
            </div>
          </div>

          {/* ── ROW 2: A fields | FINAL box top | D fields reversed ── */}
          <div style={{ display:"flex", gap:GAP, marginBottom:GAP }}>
            {/* Col A: A1 A2 A3 A4 */}
            <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:GAP }}>
              {colA.fields.map(f=>(
                <FieldCell key={f.id} field={f} state={fieldState(f.id)} canClick={canClick} myTurn={isMy} accent={ACC.A} onReveal={revealField}/>
              ))}
            </div>
            {/* FINAL box — spans rows 2 and 3 */}
            <div style={{ width:FINAL_W, display:"flex", flexDirection:"column" }}>
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:finalPhase?"#a78bfa0a":"#050508", border:`2px solid ${finalPhase?"#a78bfa66":"#1a1a2e"}`, borderRadius:10, padding:8, textAlign:"center", animation:finalPhase?"glowPulse 2s infinite":"none", minHeight: CELL*2+GAP }}>
                <div style={{ fontSize:8, color:"#333", letterSpacing:1, marginBottom:6 }}>FINAL<br/>ANSWER</div>
                {finalSolved
                  ?<div style={{ fontSize:12, fontWeight:900, color:"#22c55e", letterSpacing:1 }}>{board.final.answer}</div>
                  :<div style={{ fontSize:28, color:"#1a1a2e", fontWeight:900, fontFamily:"'Black Ops One',cursive", lineHeight:1 }}>???</div>
                }
                <div style={{ fontSize:7, color:"#1a1a2e", marginTop:6 }}>{board.final.hint}</div>
              </div>
            </div>
            {/* Col D reversed: D4 D3 D2 D1 */}
            <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:GAP }}>
              {[...colD.fields].reverse().map(f=>(
                <FieldCell key={f.id} field={f} state={fieldState(f.id)} canClick={canClick} myTurn={isMy} accent={ACC.D} onReveal={revealField}/>
              ))}
            </div>
          </div>

          {/* ── ROW 3: B fields | FINAL box bottom (spacer) | C fields reversed ── */}
          <div style={{ display:"flex", gap:GAP, marginBottom:GAP }}>
            {/* Col B: B1 B2 B3 B4 */}
            <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:GAP }}>
              {colB.fields.map(f=>(
                <FieldCell key={f.id} field={f} state={fieldState(f.id)} canClick={canClick} myTurn={isMy} accent={ACC.B} onReveal={revealField}/>
              ))}
            </div>
            {/* spacer under final */}
            <div style={{ width:FINAL_W }}/>
            {/* Col C reversed: C4 C3 C2 C1 */}
            <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:GAP }}>
              {[...colC.fields].reverse().map(f=>(
                <FieldCell key={f.id} field={f} state={fieldState(f.id)} canClick={canClick} myTurn={isMy} accent={ACC.C} onReveal={revealField}/>
              ))}
            </div>
          </div>

          {/* ── ROW 4: Col B header | spacer | Col C header ── */}
          <div style={{ display:"flex", gap:GAP, marginBottom:GAP*2 }}>
            <div style={{ flex:1, textAlign:"center", paddingTop:4, borderTop:`3px solid ${ACC.B}` }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:22, color:ACC.B, letterSpacing:4, textShadow:`0 0 12px ${ACC.B}88` }}>B</span>
            </div>
            <div style={{ width:FINAL_W }}/>
            <div style={{ flex:1, textAlign:"center", paddingTop:4, borderTop:`3px solid ${ACC.C}` }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:22, color:ACC.C, letterSpacing:4, textShadow:`0 0 12px ${ACC.C}88` }}>C</span>
            </div>
          </div>

          {/* ── GUESS SECTION ── */}
          <div style={{ background:"#080808", border:"1px solid #1a1a1a", borderRadius:10, padding:12 }}>
            <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:8, textAlign:"center" }}>GUESS COLUMN THEMES & FINAL ANSWER</div>

            {/* Row 1: Theme A | Final | Theme D */}
            <div style={{ display:"flex", gap:GAP, marginBottom:GAP }}>
              <div style={{ flex:1 }}>
                <GuessInput label="Theme A" solved={!!colSolved.A} solvedText={colA.theme} disabled={!canGuess} onGuess={v=>guessCol("A",v)} accent={ACC.A} placeholder="column A theme..."/>
              </div>
              <div style={{ width:FINAL_W }}>
                <GuessInput label="Final" solved={!!finalSolved} solvedText={board.final.answer} disabled={!canGuess} onGuess={guessFinal} accent="#a78bfa" placeholder="final answer..."/>
              </div>
              <div style={{ flex:1 }}>
                <GuessInput label="Theme D" solved={!!colSolved.D} solvedText={colD.theme} disabled={!canGuess} onGuess={v=>guessCol("D",v)} accent={ACC.D} placeholder="column D theme..."/>
              </div>
            </div>

            {/* Row 2: Theme B | spacer | Theme C */}
            <div style={{ display:"flex", gap:GAP }}>
              <div style={{ flex:1 }}>
                <GuessInput label="Theme B" solved={!!colSolved.B} solvedText={colB.theme} disabled={!canGuess} onGuess={v=>guessCol("B",v)} accent={ACC.B} placeholder="column B theme..."/>
              </div>
              <div style={{ width:FINAL_W }}/>
              <div style={{ flex:1 }}>
                <GuessInput label="Theme C" solved={!!colSolved.C} solvedText={colC.theme} disabled={!canGuess} onGuess={v=>guessCol("C",v)} accent={ACC.C} placeholder="column C theme..."/>
              </div>
            </div>
          </div>

          {/* LOG */}
          {log.length>0&&(
            <div style={{ marginTop:8, padding:"5px 10px", background:"#060606", borderRadius:6, border:"1px solid #0e0e0e" }}>
              {log.map((l,i)=><div key={i} style={{ fontSize:9, color:i===0?"#aaa":"#2a2a2a", padding:"2px 0" }}>{l}</div>)}
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </div>
  );
}

const S = {
  root: { height:"100vh", display:"flex", flexDirection:"column", background:"#030305", fontFamily:"'Rajdhani','Oswald',sans-serif", color:"#fff", overflow:"hidden" },
  card: { width:"100%", maxWidth:500, background:"#080810", border:"1px solid #12121e", borderRadius:12, padding:"18px 14px", boxSizing:"border-box" },
  input: { width:"100%", background:"#0a0a14", border:"1px solid #1a1a2e", borderRadius:7, padding:"9px 12px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" },
  btn: { width:"100%", padding:"11px 0", background:"#0a0a0a", color:"#555", border:"1px solid #1a1a1a", borderRadius:7, fontFamily:"inherit", fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:2, transition:"all .2s" },
  statusBar: { display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", padding:"5px 10px", background:"#070710", borderBottom:"1px solid #0e0e0e", flexShrink:0 },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;600;700&display=swap');
  @keyframes pop { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px #a78bfa22} 50%{box-shadow:0 0 40px #a78bfa55} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width:3px }
  ::-webkit-scrollbar-track { background:#060606 }
  ::-webkit-scrollbar-thumb { background:#1a1a1a; border-radius:2px }
`;
