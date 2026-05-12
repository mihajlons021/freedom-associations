import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue, child } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAKmKRj7Hhy4K6DsY_XDbqLb3oYOwZC5jw",
  authDomain: "project-freedom-a004e.firebaseapp.com",
  databaseURL: "https://project-freedom-a004e-default-rtdb.firebaseio.com",
  projectId: "project-freedom-a004e",
  storageBucket: "project-freedom-a004e.firebasestorage.app",
  messagingSenderId: "844172246267",
  appId: "1:844172246267:web:a31b8cd6affe8337f7845e",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const ESCROW = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS = [100, 500, 1000];
const TURN_TIME = 30;
const FINAL_IDLE = 60;
const ACC = { A:"#e63946", B:"#f4a261", C:"#2a9d8f", D:"#457b9d" };

async function connectPhantom() {
  try {
    if (!window.solana?.isPhantom) { window.open("https://phantom.app/","_blank"); return null; }
    const r = await window.solana.connect();
    return r.publicKey.toString();
  } catch(e) { return null; }
}

async function sendWager(amount) {
  try {
    if (!window.solana?.isPhantom) return { success: false, error: "No Phantom wallet" };
    const msg = new TextEncoder().encode(`Wager ${amount} FREEDOM to ${ESCROW}`);
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
        messages: [{ role: "user", content: `Generate a word association game board in English. Return ONLY valid JSON, no markdown.
{"columns":[{"id":"A","theme":"THEME","fields":[{"id":"A1","clue":"clue","answer":"ANSWER"},{"id":"A2","clue":"clue","answer":"ANSWER"},{"id":"A3","clue":"clue","answer":"ANSWER"},{"id":"A4","clue":"clue","answer":"ANSWER"}]},{"id":"B","theme":"THEME","fields":[{"id":"B1","clue":"clue","answer":"ANSWER"},{"id":"B2","clue":"clue","answer":"ANSWER"},{"id":"B3","clue":"clue","answer":"ANSWER"},{"id":"B4","clue":"clue","answer":"ANSWER"}]},{"id":"C","theme":"THEME","fields":[{"id":"C1","clue":"clue","answer":"ANSWER"},{"id":"C2","clue":"clue","answer":"ANSWER"},{"id":"C3","clue":"clue","answer":"ANSWER"},{"id":"C4","clue":"clue","answer":"ANSWER"}]},{"id":"D","theme":"THEME","fields":[{"id":"D1","clue":"clue","answer":"ANSWER"},{"id":"D2","clue":"clue","answer":"ANSWER"},{"id":"D3","clue":"clue","answer":"ANSWER"},{"id":"D4","clue":"clue","answer":"ANSWER"}]}],"final":{"answer":"ANSWER","hint":"hint"}}
4 different themes, short English clues 1-3 words, single-word CAPS answers, final connects all 4.` }]
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

function norm(s) { return s.trim().toUpperCase().replace(/[^A-Z0-9]/g,""); }
function match(a,b) { return norm(a) === norm(b); }
function genId() { return Math.random().toString(36).slice(2,8).toUpperCase(); }

function Skull({ size=40 }) {
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
      <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:13, letterSpacing:2 }}>
        <span style={{ color:"#8b5cf6" }}>DEGEN</span><span style={{ color:"#22c55e" }}>SAFE</span><span style={{ color:"#444" }}>.FUN</span>
      </span>
    </div>
  );
}

function TimerBar({ secs, max, warn=8 }) {
  const pct = (secs/max)*100, hot = secs<=warn;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ flex:1, height:5, background:"#111", borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:hot?"#ef4444":"#22c55e", transition:"width 1s linear", borderRadius:3 }}/>
      </div>
      <span style={{ fontFamily:"monospace", fontSize:12, minWidth:26, color:hot?"#ef4444":"#555", fontWeight:hot?700:400 }}>{secs}s</span>
    </div>
  );
}

/* ── SQUARE FIELD ── */
function FieldSquare({ field, fstate, canOpen, accent, onOpen }) {
  const outer = (extra={}) => ({
    position:"relative", width:"100%", paddingBottom:"100%",
    borderRadius:8, userSelect:"none", boxSizing:"border-box",
    overflow:"hidden", transition:"all .15s", cursor: canOpen&&fstate==="hidden" ? "pointer" : "default", ...extra
  });
  const inner = {
    position:"absolute", inset:0, display:"flex", alignItems:"center",
    justifyContent:"center", flexDirection:"column", gap:2, padding:5, boxSizing:"border-box"
  };

  if (fstate === "solved") return (
    <div style={outer({ background:"#111", border:`2px solid ${accent}88`, animation:"pop .3s ease" })}>
      <div style={inner}>
        <div style={{ fontSize:9, fontWeight:900, color:accent, letterSpacing:1, textAlign:"center" }}>{field.answer}</div>
        <div style={{ fontSize:7, color:"#555", textAlign:"center", lineHeight:1.2 }}>{field.clue}</div>
      </div>
    </div>
  );

  if (fstate === "clue") return (
    <div style={outer({ background:"#0d0d20", border:`2px solid ${accent}`, boxShadow:`0 0 14px ${accent}44` })}>
      <div style={inner}>
        <div style={{ fontSize:7, color:accent, letterSpacing:1, fontWeight:700, marginBottom:2 }}>CLUE</div>
        <div style={{ fontSize:9, color:"#fff", textAlign:"center", lineHeight:1.3, fontWeight:600 }}>{field.clue}</div>
      </div>
    </div>
  );

  return (
    <div
      onClick={canOpen ? () => onOpen(field.id) : undefined}
      style={outer({ background:canOpen?"#0e0e1a":"#070710", border:`1px solid ${canOpen?accent+"55":"#1a1a1a"}` })}
      onMouseEnter={e=>{ if(canOpen){e.currentTarget.style.background="#14142a";e.currentTarget.style.borderColor=accent+"99";e.currentTarget.style.boxShadow=`0 0 10px ${accent}33`;}}}
      onMouseLeave={e=>{ if(canOpen){e.currentTarget.style.background="#0e0e1a";e.currentTarget.style.borderColor=accent+"55";e.currentTarget.style.boxShadow="none";}}}
    >
      <div style={inner}>
        <span style={{ fontSize:13, fontWeight:900, color:canOpen?"#666":"#222", letterSpacing:1 }}>{field.id}</span>
      </div>
    </div>
  );
}

/* ── GUESS INPUT ── */
function GuessInput({ label, solved, solvedText, disabled, onGuess, accent, ph }) {
  const [val, setVal] = useState("");
  const [wrong, setWrong] = useState(false);

  if (solved) return (
    <div style={{ ...GI, background:accent+"22", border:`1px solid ${accent}`, justifyContent:"center" }}>
      <span style={{ color:accent, fontWeight:700, fontSize:10 }}>✓ {solvedText}</span>
    </div>
  );

  const sub = () => {
    if (!val.trim() || disabled) return;
    if (!onGuess(val)) { setWrong(true); setTimeout(() => setWrong(false), 600); }
    else setVal("");
  };

  return (
    <div style={{ ...GI, animation:wrong?"shake .4s":"none", opacity:disabled?.25:1 }}>
      <span style={{ fontSize:9, color:"#555", whiteSpace:"nowrap", minWidth:52 }}>{label}</span>
      <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sub()} disabled={disabled}
        placeholder={ph||"guess..."} style={{ flex:1, background:"transparent", border:"none", color:disabled?"#333":"#ddd", fontSize:11, outline:"none", fontFamily:"inherit", minWidth:0 }}/>
      <button onClick={sub} disabled={disabled} style={{ background:disabled?"#222":accent, border:"none", borderRadius:5, padding:"5px 12px", color:disabled?"#444":"#fff", fontWeight:700, cursor:disabled?"default":"pointer", fontSize:10, flexShrink:0 }}>OK</button>
    </div>
  );
}
const GI = { display:"flex", alignItems:"center", gap:8, background:"#0d0d0d", border:"1px solid #222", borderRadius:7, padding:"7px 10px", width:"100%", boxSizing:"border-box" };

function Spinner({ msg }) {
  return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <div style={{ width:52, height:52, border:"3px solid #8b5cf622", borderTop:"3px solid #8b5cf6", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
        <div style={{ color:"#555", fontSize:13, letterSpacing:2 }}>{msg}</div>
      </div>
    <Footer/></div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════ */
export default function App() {
  const [uid, setUid] = useState(null);
  const [screen, setScreen] = useState("lobby");
  const [name, setName] = useState("");
  const [wager, setWager] = useState(100);
  const [mode, setMode] = useState("create");
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [gid, setGid] = useState(null);
  const [role, setRole] = useState(null); // "p1" | "p2"
  const [gs, setGs] = useState(null); // game state
  const [started, setStarted] = useState(false);
  const [tTimer, setTTimer] = useState(TURN_TIME);
  const [iTimer, setITimer] = useState(FINAL_IDLE);
  const [opened, setOpened] = useState(false); // opened a field this turn?
  const [log, setLog] = useState([]);

  const tRef = useRef();
  const iRef = useRef();
  const lastAct = useRef(Date.now());
  const gRef = useRef(null);

  const L = m => setLog(p => [m,...p].slice(0,6));
  const touch = () => { lastAct.current = Date.now(); setITimer(FINAL_IDLE); };

  // Auth
  useEffect(() => { signInAnonymously(auth).then(r => setUid(r.user.uid)).catch(console.error); }, []);
  useEffect(() => { if (window.solana?.isPhantom && window.solana.publicKey) setWallet(window.solana.publicKey.toString()); }, []);

  // Listen to game
  useEffect(() => {
    if (!gid) return;
    gRef.current = ref(db, `games/${gid}`);
    const unsub = onValue(gRef.current, snap => {
      const d = snap.val();
      if (!d) return;
      setGs(d);
      if (d.status === "finished") setScreen("result");
      if (d.status === "active" && d.p1 && d.p2 && !started) {
        setStarted(true);
        lastAct.current = Date.now();
      }
    });
    return () => unsub();
  }, [gid, role, started]);

  // Turn timer — 30s per turn, auto-reveal on expire
  useEffect(() => {
    if (screen !== "game" || !started || !gs) return;
    if (gs.status === "finished" || gs.finalPhase) return;
    if (gs.currentTurn !== role) return;
    clearInterval(tRef.current);
    setTTimer(TURN_TIME);
    tRef.current = setInterval(() => {
      setTTimer(t => {
        if (t <= 1) {
          clearInterval(tRef.current);
          doAutoReveal();
          return TURN_TIME;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tRef.current);
  }, [gs?.currentTurn, gs?.finalPhase, screen, started]);

  // Final phase idle timer — 60s idle = lose
  useEffect(() => {
    if (!gs?.finalPhase || gs?.status === "finished" || !started) return;
    clearInterval(iRef.current);
    iRef.current = setInterval(() => {
      const rem = FINAL_IDLE - Math.floor((Date.now() - lastAct.current) / 1000);
      setITimer(Math.max(0, rem));
      if (rem <= 0 && gs.currentTurn === role) {
        clearInterval(iRef.current);
        doEndGame(role === "p1" ? "p2" : "p1", "Idle 60s — opponent wins!");
      }
    }, 1000);
    return () => clearInterval(iRef.current);
  }, [gs?.finalPhase, gs?.status, gs?.currentTurn, role, started]);

  // Check all fields open → final phase
  useEffect(() => {
    if (!gs || gs.finalPhase || gs.status === "finished" || !gs.board) return;
    const total = gs.board.columns.reduce((s,c) => s + c.fields.length, 0);
    const cnt = Object.keys(gs.revealed || {}).length;
    if (cnt >= total) {
      update(gRef.current, { finalPhase: true });
      L("🎯 All fields open! Guess final answer!");
    }
  }, [gs?.revealed]);

  // Wait for P2 to join
  useEffect(() => {
    if (screen !== "waiting" || !gid) return;
    const unsub = onValue(ref(db, `games/${gid}`), snap => {
      const d = snap.val();
      if (d?.status === "active" && d.p1 && d.p2) {
        setGs(d); setStarted(true); lastAct.current = Date.now();
        setScreen("game"); L("Opponent joined! Your turn! (You are P1)");
      }
    });
    return () => unsub();
  }, [screen, gid]);

  async function doConnectWallet() {
    setWalletLoading(true);
    const a = await connectPhantom();
    if (a) setWallet(a);
    setWalletLoading(false);
  }

  /* ── CREATE GAME ── */
  async function doCreate() {
    if (!name.trim() || !uid) return;
    if (!wallet) { alert("Connect Phantom wallet first!"); return; }
    setScreen("loading"); setLoadMsg("Generating board...");
    const board = await generateBoard();
    setLoadMsg("Confirming wager...");
    const tx = await sendWager(wager);
    if (!tx.success) { alert("Wager failed: " + tx.error); setScreen("lobby"); return; }
    setLoadMsg("Creating room...");
    const id = genId();
    // Write directly to games/ID
    await set(ref(db, `games/${id}`), {
      p1: uid, p1name: name, p1wallet: wallet,
      p2: null, p2name: null, p2wallet: null,
      status: "waiting", wager, board,
      scores: { p1:0, p2:0 },
      revealed: {},
      colSolved: { A:false, B:false, C:false, D:false },
      finalSolved: false, finalPhase: false,
      currentTurn: "p1",
      lastActivity: Date.now(),
      winner: null,
      p1tx: tx.txid
    });
    setGid(id); setRole("p1"); setStarted(false); setScreen("waiting");
  }

  /* ── JOIN GAME ── */
  async function doJoin() {
    const id = joinInput.trim().toUpperCase();
    if (!name.trim() || !uid || id.length < 6) return;
    if (!wallet) { alert("Connect Phantom wallet first!"); return; }
    setJoinError("");
    setScreen("loading"); setLoadMsg("Looking for room " + id + "...");

    try {
      // Read directly from games/ID
      const snap = await get(ref(db, `games/${id}`));
      
      if (!snap.exists()) {
        setJoinError("Room " + id + " not found! Check the ID and try again.");
        setScreen("lobby");
        return;
      }

      const d = snap.val();

      if (d.status !== "waiting") {
        setJoinError("Room " + id + " already started or finished!");
        setScreen("lobby");
        return;
      }

      if (d.p1 === uid) {
        setJoinError("You can't join your own room!");
        setScreen("lobby");
        return;
      }

      setLoadMsg("Confirming wager...");
      const tx = await sendWager(d.wager);
      if (!tx.success) { alert("Wager failed: " + tx.error); setScreen("lobby"); return; }

      setLoadMsg("Joining...");
      await update(ref(db, `games/${id}`), {
        p2: uid,
        p2name: name,
        p2wallet: wallet,
        status: "active",
        currentTurn: "p1",
        lastActivity: Date.now(),
        p2tx: tx.txid
      });

      setWager(d.wager);
      setGid(id);
      setRole("p2");
      setStarted(true);
      lastAct.current = Date.now();
      setScreen("game");
      L("Joined room " + id + "! You are Player 2. Player 1 goes first.");

    } catch(e) {
      console.error("Join error:", e);
      setJoinError("Error joining room: " + e.message);
      setScreen("lobby");
    }
  }

  /* ── OPEN FIELD ── */
  async function doOpen(fid) {
    if (!isMy || opened || gs?.finalPhase || !started) return;
    touch();
    setOpened(true);
    await update(gRef.current, {
      [`revealed/${fid}`]: "clue",
      lastActivity: Date.now()
    });
    L(`Field ${fid} opened!`);
  }

  /* ── AUTO REVEAL ON TIMER EXPIRE ── */
  async function doAutoReveal() {
    if (!gs?.board || !gRef.current) return;
    const all = gs.board.columns.flatMap(c => c.fields);
    const hidden = all.filter(f => !gs.revealed?.[f.id]);
    if (hidden.length === 0) {
      await update(gRef.current, { finalPhase: true });
      return;
    }
    const pick = hidden[Math.floor(Math.random() * hidden.length)];
    await update(gRef.current, { [`revealed/${pick.id}`]: "clue", lastActivity: Date.now() });
    L(`⏱ Time up! Field ${pick.id} auto-revealed.`);
    await doPassTurn();
  }

  /* ── GUESS COLUMN THEME ── */
  async function doGuessCol(cid, val) {
    touch();
    const col = gs.board.columns.find(c => c.id === cid);
    if (!col || gs.colSolved?.[cid]) return false;
    if (match(val, col.theme)) {
      const upd = {};
      col.fields.forEach(f => { upd[`revealed/${f.id}`] = "solved"; });
      upd[`colSolved/${cid}`] = role;
      upd[`scores/${role}`] = (gs.scores?.[role] || 0) + 20;
      upd.lastActivity = Date.now();
      await update(gRef.current, upd);
      L(`✅ Column ${cid}: "${col.theme}" +20pts! Keep guessing!`);
      return true;
    }
    L(`❌ Wrong theme for ${cid}. Opponent's turn!`);
    await doPassTurn();
    return false;
  }

  /* ── GUESS FINAL ── */
  async function doGuessFinal(val) {
    touch();
    if (match(val, gs.board.final.answer)) {
      await update(gRef.current, {
        finalSolved: role,
        [`scores/${role}`]: (gs.scores?.[role] || 0) + 30,
        lastActivity: Date.now()
      });
      doEndGame(role, "Final answer correct! +30pts 🎉");
      return true;
    }
    L(`❌ Wrong final answer. Opponent's turn!`);
    await doPassTurn();
    return false;
  }

  /* ── PASS TURN ── */
  async function doPassTurn() {
    clearInterval(tRef.current);
    const next = role === "p1" ? "p2" : "p1";
    setOpened(false);
    await update(gRef.current, { currentTurn: next, lastActivity: Date.now() });
  }

  /* ── END GAME ── */
  async function doEndGame(w, reason) {
    if (!gRef.current) return;
    clearInterval(tRef.current); clearInterval(iRef.current);
    await update(gRef.current, { status:"finished", winner:w, winReason:reason, finishedAt:Date.now() });
    // Leaderboard
    if (!gs) return;
    const scores = gs.scores || { p1:0, p2:0 };
    for (const r of ["p1","p2"]) {
      const u = gs[r]; if (!u) continue;
      const lbRef = ref(db, `leaderboard/${u}`);
      const snap = await get(lbRef);
      const curr = snap.val() || { wins:0, losses:0, points:0, tokensWon:0 };
      await set(lbRef, { name:r==="p1"?gs.p1name:gs.p2name, wins:(curr.wins||0)+(w===r?1:0), losses:(curr.losses||0)+(w===r?0:1), points:(curr.points||0)+(scores[r]||0), tokensWon:(curr.tokensWon||0)+(w===r?wager*2:0) });
    }
  }

  function doReset() {
    setScreen("lobby"); setGid(null); setRole(null); setGs(null);
    setOpened(false); setLog([]); setJoinInput(""); setJoinError(""); setStarted(false);
  }

  /* ── DERIVED ── */
  const board = gs?.board || null;
  const isMy = gs?.currentTurn === role;
  const scores = gs?.scores || { p1:0, p2:0 };
  const revealed = gs?.revealed || {};
  const colSolved = gs?.colSolved || {};
  const finalSolved = gs?.finalSolved || false;
  const finalPhase = gs?.finalPhase || false;
  const winner = gs?.winner || null;
  const winReason = gs?.winReason || "";
  const myName = role==="p1" ? gs?.p1name||"P1" : gs?.p2name||"P2";
  const oppName = role==="p1" ? gs?.p2name||"P2" : gs?.p1name||"P1";
  const fstate = fid => { const r=revealed[fid]; if(!r) return "hidden"; if(r==="solved") return "solved"; return "clue"; };
  const canOpen = isMy && !opened && !finalPhase && !winner && gs?.status==="active" && started;
  const canGuess = isMy && (opened || finalPhase) && !winner && gs?.status==="active" && started;

  /* ════════════════ LOBBY ════════════════ */
  if (screen === "lobby") return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, overflowY:"auto", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"12px" }}>
        <div style={S.card}>

          {/* Wallet */}
          <div style={{ marginBottom:14, padding:12, background:"#060606", borderRadius:8, border:"1px solid #1a1a1a" }}>
            <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:8 }}>PHANTOM WALLET</div>
            {wallet ? (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e" }}/>
                <span style={{ fontSize:10, color:"#22c55e", fontFamily:"monospace" }}>{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
                <span style={{ fontSize:9, color:"#444", marginLeft:"auto" }}>✓ Connected</span>
              </div>
            ) : (
              <button onClick={doConnectWallet} disabled={walletLoading} style={{ width:"100%", padding:"9px 0", background:"linear-gradient(90deg,#8b5cf6,#7c3aed)", border:"none", borderRadius:6, color:"#fff", fontFamily:"inherit", fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:1 }}>
                {walletLoading ? "CONNECTING..." : "🔗 CONNECT PHANTOM WALLET"}
              </button>
            )}
          </div>

          {/* Name */}
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name / username" style={S.input} maxLength={16}/>

          {/* Wager */}
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:6 }}>WAGER — FREEDOM TOKENS</div>
            <div style={{ display:"flex", gap:6 }}>
              {WAGERS.map(w => <button key={w} onClick={()=>setWager(w)} style={{ flex:1, padding:"8px 0", borderRadius:6, fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer", background:wager===w?"#8b5cf6":"#0e0e0e", color:wager===w?"#fff":"#8b5cf6", border:`1px solid ${wager===w?"#8b5cf6":"#2a2a2a"}` }}>{w}</button>)}
            </div>
          </div>

          {/* Mode */}
          <div style={{ marginTop:14, display:"flex", borderRadius:7, overflow:"hidden", border:"1px solid #1a1a1a" }}>
            {[["create","🎮 CREATE ROOM"],["join","🚪 JOIN ROOM"]].map(([m,l]) => (
              <button key={m} onClick={()=>{setMode(m);setJoinError("");}} style={{ flex:1, padding:"9px 0", fontFamily:"inherit", fontSize:10, fontWeight:700, cursor:"pointer", background:mode===m?"#8b5cf6":"#0a0a0a", color:mode===m?"#fff":"#555", border:"none", letterSpacing:1 }}>{l}</button>
            ))}
          </div>

          {/* Create */}
          {mode === "create" && (
            <button onClick={doCreate} disabled={!name.trim()||!uid||!wallet} style={{ ...S.btn, marginTop:10, background:name.trim()&&wallet?"linear-gradient(90deg,#8b5cf6,#7c3aed)":"#1a1a1a", color:name.trim()&&wallet?"#fff":"#444" }}>
              🎮 CREATE ROOM
            </button>
          )}

          {/* Join */}
          {mode === "join" && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2, marginBottom:6 }}>ENTER ROOM ID (6 characters)</div>
              <input
                value={joinInput}
                onChange={e => { setJoinInput(e.target.value.toUpperCase()); setJoinError(""); }}
                maxLength={6}
                placeholder="ABC123"
                style={{ ...S.input, textAlign:"center", letterSpacing:10, fontFamily:"'Black Ops One',cursive", fontSize:22, color:"#22c55e", boxShadow:joinInput.length===6?"0 0 14px #22c55e33":"none" }}
              />
              {joinError && (
                <div style={{ marginTop:6, padding:"8px 10px", background:"#ef444411", border:"1px solid #ef444433", borderRadius:6, fontSize:10, color:"#ef4444" }}>
                  ⚠ {joinError}
                </div>
              )}
              <button onClick={doJoin} disabled={!name.trim()||!uid||!wallet||joinInput.length<6} style={{ ...S.btn, marginTop:8, background:joinInput.length===6&&name.trim()&&wallet?"linear-gradient(90deg,#22c55e,#16a34a)":"#1a1a1a", color:joinInput.length===6&&name.trim()&&wallet?"#000":"#444" }}>
                🚪 JOIN ROOM
              </button>
            </div>
          )}

          {/* Rules */}
          <div style={{ marginTop:14, padding:12, background:"#060606", borderRadius:8, border:"1px solid #111" }}>
            <div style={{ color:"#8b5cf6", fontSize:9, fontWeight:700, letterSpacing:2, marginBottom:8 }}>GAME RULES</div>
            {[
              ["30s/turn","Timer starts when both players join. Open 1 field per turn."],
              ["After open","Guess column theme or final. Correct = keep your turn. Wrong = opponent's turn."],
              ["Time up","30s expire = 1 random field auto-reveals, turn passes."],
              ["Final phase","All fields open: 60s idle = opponent wins."],
              ["Points","Column theme +20 · Final answer +30"],
            ].map(([t,d],i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}>
                <span style={{ fontSize:8, color:"#8b5cf6", fontWeight:700, whiteSpace:"nowrap", minWidth:60 }}>{t}</span>
                <span style={{ fontSize:9, color:"#444", lineHeight:1.4 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    <Footer/></div>
  );

  if (screen === "loading") return <Spinner msg={loadMsg}/>;

  /* ════════════════ WAITING ════════════════ */
  if (screen === "waiting") return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:20 }}>
        <div style={{ width:56, height:56, border:"3px solid #22c55e22", borderTop:"3px solid #22c55e", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
        <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:14, color:"#22c55e", letterSpacing:3 }}>WAITING FOR OPPONENT</div>
        <div style={{ fontSize:11, color:"#444" }}>Wager: <b style={{ color:"#a78bfa" }}>{wager}</b> FREEDOM tokens</div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:11, color:"#555", marginBottom:10, letterSpacing:1 }}>SHARE THIS ROOM ID WITH YOUR OPPONENT:</div>
          <div style={{ fontSize:42, fontFamily:"'Black Ops One',cursive", color:"#22c55e", letterSpacing:10, padding:"16px 32px", background:"#0a1a0f", border:"2px solid #22c55e55", borderRadius:12, textShadow:"0 0 24px #22c55eaa", boxShadow:"0 0 40px #22c55e22" }}>{gid}</div>
          <div style={{ fontSize:10, color:"#333", marginTop:10 }}>Opponent opens the game and enters this code under "JOIN ROOM"</div>
        </div>
        <button onClick={() => { set(ref(db,`games/${gid}`),null); setScreen("lobby"); setGid(null); setRole(null); setStarted(false); }} style={{ ...S.btn, maxWidth:180, padding:"8px 0" }}>CANCEL</button>
      </div>
    <Footer/></div>
  );

  /* ════════════════ RESULT ════════════════ */
  if (screen === "result" || winner) return (
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div style={{ ...S.card, textAlign:"center", maxWidth:340 }}>
          <div style={{ fontSize:56 }}>{winner===role?"🏆":"💀"}</div>
          <div style={{ fontFamily:"'Black Ops One',cursive", fontSize:24, letterSpacing:3, marginTop:8, color:winner===role?"#22c55e":"#ef4444" }}>
            {winner===role?"YOU WIN!":"YOU LOSE"}
          </div>
          <div style={{ color:"#555", fontSize:11, marginTop:6, marginBottom:20 }}>{winReason}</div>
          <div style={{ display:"flex", gap:14, justifyContent:"center", marginBottom:20 }}>
            {["p1","p2"].map(r => (
              <div key={r} style={{ padding:"12px 24px", borderRadius:10, background:r===winner?"#22c55e0a":"#0a0a0a", border:`2px solid ${r===winner?"#22c55e":"#1a1a1a"}` }}>
                <div style={{ fontSize:9, color:"#444" }}>{r===role?myName:oppName}</div>
                <div style={{ fontSize:30, fontWeight:900, color:r===winner?"#22c55e":"#fff" }}>{scores[r]||0}</div>
                <div style={{ fontSize:9, color:"#333" }}>points</div>
              </div>
            ))}
          </div>
          {winner===role && <div style={{ color:"#a78bfa", fontSize:12, marginBottom:14 }}>🎉 Winnings: <b>{wager*2}</b> FREEDOM tokens</div>}
          <button onClick={doReset} style={{ ...S.btn, background:"linear-gradient(90deg,#8b5cf6,#7c3aed)", color:"#fff" }}>NEW GAME</button>
        </div>
      </div>
    <Footer/></div>
  );

  if (!board) return <Spinner msg="Loading game..."/>;
  const [colA, colB, colC, colD] = board.columns;
  const G = 8;

  /* ════════════════ GAME ════════════════ */
  return (
    <div style={S.root}><style>{CSS}</style><Header/>

      {/* STATUS */}
      <div style={S.statusBar}>
        <div style={{ display:"flex", gap:6, alignItems:"center", flex:1 }}>
          {["p1","p2"].map(r => (
            <div key={r} style={{ padding:"3px 12px", borderRadius:14, background:gs?.currentTurn===r?"#8b5cf618":"#0a0a0a", border:`1px solid ${gs?.currentTurn===r?"#8b5cf6":"#1a1a1a"}`, fontSize:11, color:r===role?"#a78bfa":"#555", fontWeight:gs?.currentTurn===r?700:400, whiteSpace:"nowrap" }}>
              {r===role?myName:oppName} <b style={{ color:gs?.currentTurn===r?"#fff":"inherit" }}>{scores[r]||0}</b>
            </div>
          ))}
        </div>
        {!finalPhase && started && isMy && (
          <div style={{ width:120 }}><TimerBar secs={tTimer} max={TURN_TIME} warn={8}/></div>
        )}
        {!finalPhase && started && !isMy && (
          <div style={{ fontSize:10, color:"#333", width:120, textAlign:"center" }}>opponent's turn</div>
        )}
        {finalPhase && started && isMy && (
          <div style={{ width:120 }}><TimerBar secs={iTimer} max={FINAL_IDLE} warn={15}/></div>
        )}
        <div style={{ fontSize:10, fontWeight:700, color:finalPhase?"#f59e0b":isMy?"#22c55e":"#ef4444", whiteSpace:"nowrap" }}>
          {!started?"⏳":finalPhase?"🎯 FINAL":isMy?"⚡ YOUR TURN":"⏳ WAIT"}
        </div>
        {isMy && !finalPhase && opened && started && (
          <button onClick={()=>{touch();doPassTurn();L("Turn passed.");}} style={{ padding:"3px 10px", borderRadius:5, background:"#111", color:"#555", border:"1px solid #1a1a1a", fontFamily:"inherit", fontSize:9, cursor:"pointer" }}>PASS</button>
        )}
      </div>

      {/* HINT */}
      <div style={{ fontSize:10, textAlign:"center", padding:"4px 0", background:"#050505", borderBottom:"1px solid #0a0a0a", color:"#3a3a3a" }}>
        {!started ? "⏳ Waiting for opponent..." :
          finalPhase ? (isMy?"🎯 Guess themes or final answer!":"⏳ Opponent guessing...") :
          isMy ? (canOpen ? "👆 Click a field to reveal its clue" : canGuess ? "💡 Guess a column theme or final answer" : "...") :
          "⏳ Opponent's turn..."}
      </div>

      {/* BOARD */}
      <div style={{ flex:1, overflowY:"auto", padding:"8px" }}>
        <div style={{ maxWidth:700, margin:"0 auto" }}>

          {/* A header | FINAL label | D header */}
          <div style={{ display:"flex", gap:G, marginBottom:4, alignItems:"flex-end" }}>
            <div style={{ flex:4, textAlign:"center", borderBottom:`3px solid ${ACC.A}`, paddingBottom:3 }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:22, color:ACC.A, letterSpacing:4, textShadow:`0 0 12px ${ACC.A}88` }}>A</span>
            </div>
            <div style={{ width:76, textAlign:"center" }}>
              <span style={{ fontSize:8, color:"#333", letterSpacing:1 }}>FINAL</span>
            </div>
            <div style={{ flex:4, textAlign:"center", borderBottom:`3px solid ${ACC.D}`, paddingBottom:3 }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:22, color:ACC.D, letterSpacing:4, textShadow:`0 0 12px ${ACC.D}88` }}>D</span>
            </div>
          </div>

          {/* A fields | FINAL box | D fields */}
          <div style={{ display:"flex", gap:G, marginBottom:G }}>
            <div style={{ flex:4, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:G }}>
              {colA.fields.map(f => <FieldSquare key={f.id} field={f} fstate={fstate(f.id)} canOpen={canOpen&&fstate(f.id)==="hidden"} accent={ACC.A} onOpen={doOpen}/>)}
            </div>
            {/* FINAL BOX spanning 2 rows — we use a relative container */}
            <div style={{ width:76, flexShrink:0, display:"flex", flexDirection:"column", gap:G }}>
              <div style={{
                flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                background:finalPhase?"#a78bfa0a":"#050508", border:`2px solid ${finalPhase?"#a78bfa66":"#1a1a2e"}`,
                borderRadius:10, padding:8, textAlign:"center", animation:finalPhase?"glowPulse 2s infinite":"none",
                minHeight: "calc(200% + " + G + "px)" // spans both rows
              }}>
                <div style={{ fontSize:7, color:"#333", letterSpacing:1, marginBottom:4 }}>FINAL</div>
                {finalSolved
                  ? <div style={{ fontSize:10, fontWeight:900, color:"#22c55e" }}>{board.final.answer}</div>
                  : <div style={{ fontSize:24, color:"#1a1a2e", fontWeight:900, fontFamily:"'Black Ops One',cursive", lineHeight:1 }}>???</div>
                }
                <div style={{ fontSize:7, color:"#1a1a2e", marginTop:4 }}>{board.final.hint}</div>
              </div>
            </div>
            <div style={{ flex:4, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:G }}>
              {[...colD.fields].reverse().map(f => <FieldSquare key={f.id} field={f} fstate={fstate(f.id)} canOpen={canOpen&&fstate(f.id)==="hidden"} accent={ACC.D} onOpen={doOpen}/>)}
            </div>
          </div>

          {/* B fields | spacer | C fields */}
          <div style={{ display:"flex", gap:G, marginBottom:4 }}>
            <div style={{ flex:4, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:G }}>
              {colB.fields.map(f => <FieldSquare key={f.id} field={f} fstate={fstate(f.id)} canOpen={canOpen&&fstate(f.id)==="hidden"} accent={ACC.B} onOpen={doOpen}/>)}
            </div>
            <div style={{ width:76, flexShrink:0 }}/>
            <div style={{ flex:4, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:G }}>
              {[...colC.fields].reverse().map(f => <FieldSquare key={f.id} field={f} fstate={fstate(f.id)} canOpen={canOpen&&fstate(f.id)==="hidden"} accent={ACC.C} onOpen={doOpen}/>)}
            </div>
          </div>

          {/* B header | spacer | C header */}
          <div style={{ display:"flex", gap:G, marginBottom:12 }}>
            <div style={{ flex:4, textAlign:"center", borderTop:`3px solid ${ACC.B}`, paddingTop:3 }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:22, color:ACC.B, letterSpacing:4, textShadow:`0 0 12px ${ACC.B}88` }}>B</span>
            </div>
            <div style={{ width:76, flexShrink:0 }}/>
            <div style={{ flex:4, textAlign:"center", borderTop:`3px solid ${ACC.C}`, paddingTop:3 }}>
              <span style={{ fontFamily:"'Black Ops One',cursive", fontSize:22, color:ACC.C, letterSpacing:4, textShadow:`0 0 12px ${ACC.C}88` }}>C</span>
            </div>
          </div>

          {/* GUESS SECTION */}
          <div style={{ background:"#080808", border:"1px solid #1a1a1a", borderRadius:10, padding:12 }}>
            <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginBottom:10, textAlign:"center" }}>GUESS THEMES & FINAL ANSWER</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
              <GuessInput label="Theme A" solved={!!colSolved.A} solvedText={colA.theme} disabled={!canGuess} onGuess={v=>doGuessCol("A",v)} accent={ACC.A} ph="col A theme..."/>
              <GuessInput label="Theme D" solved={!!colSolved.D} solvedText={colD.theme} disabled={!canGuess} onGuess={v=>doGuessCol("D",v)} accent={ACC.D} ph="col D theme..."/>
              <GuessInput label="Theme B" solved={!!colSolved.B} solvedText={colB.theme} disabled={!canGuess} onGuess={v=>doGuessCol("B",v)} accent={ACC.B} ph="col B theme..."/>
              <GuessInput label="Theme C" solved={!!colSolved.C} solvedText={colC.theme} disabled={!canGuess} onGuess={v=>doGuessCol("C",v)} accent={ACC.C} ph="col C theme..."/>
            </div>
            <GuessInput label="🎯 FINAL" solved={!!finalSolved} solvedText={board.final.answer} disabled={!canGuess} onGuess={doGuessFinal} accent="#a78bfa" ph="final answer..."/>
          </div>

          {/* LOG */}
          {log.length > 0 && (
            <div style={{ marginTop:8, padding:"5px 10px", background:"#060606", borderRadius:6, border:"1px solid #0e0e0e" }}>
              {log.map((l,i) => <div key={i} style={{ fontSize:9, color:i===0?"#aaa":"#2a2a2a", padding:"2px 0" }}>{l}</div>)}
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
  @keyframes pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 20px #a78bfa22}50%{box-shadow:0 0 40px #a78bfa55}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#060606}::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:2px}
`;
