import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

/* ─── FIREBASE ─────────────────────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyAKmKRj7Hhy4K6DsY_XDbqLb3oYOwZC5jw",
  authDomain: "project-freedom-a004e.firebaseapp.com",
  databaseURL: "https://project-freedom-a004e-default-rtdb.firebaseio.com",
  projectId: "project-freedom-a004e",
  storageBucket: "project-freedom-a004e.firebasestorage.app",
  messagingSenderId: "844172246267",
  appId: "1:844172246267:web:a31b8cd6affe8337f7845e",
};
const FB = initializeApp(firebaseConfig);
const db = getDatabase(FB);
const auth = getAuth(FB);

/* ─── CONSTANTS ────────────────────────────────────────── */
const ESCROW  = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS  = [100, 500, 1000];
const T_TURN  = 30;
const T_FINAL = 60;
const T_IDLE  = 60;
const CLR = { A:"#e63946", B:"#f4a261", C:"#2a9d8f", D:"#457b9d", FINAL:"#a78bfa" };

/* ─── PHANTOM ──────────────────────────────────────────── */
async function connectPhantom() {
  try {
    if (!window.solana?.isPhantom) { window.open("https://phantom.app/","_blank"); return null; }
    const r = await window.solana.connect();
    return r.publicKey.toString();
  } catch { return null; }
}
async function signWager(amount, addr) {
  try {
    const msg = new TextEncoder().encode(`Wager ${amount} FREEDOM → ${ESCROW}`);
    await window.solana.signMessage(msg, "utf8");
    return { ok: true, tx: "SIG_"+Date.now() };
  } catch(e) { return { ok: false, err: e.message }; }
}

/* ─── AI BOARD ─────────────────────────────────────────── */
async function aiBoard() {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:1200,
        messages:[{ role:"user", content:
`Return ONLY a JSON object (no markdown) for an English word-association game board:
{"columns":[
  {"id":"A","theme":"WORD","fields":[{"id":"A1","clue":"2-3 word clue","answer":"WORD"},{"id":"A2","clue":"clue","answer":"WORD"},{"id":"A3","clue":"clue","answer":"WORD"},{"id":"A4","clue":"clue","answer":"WORD"}]},
  {"id":"B","theme":"WORD","fields":[{"id":"B1","clue":"clue","answer":"WORD"},{"id":"B2","clue":"clue","answer":"WORD"},{"id":"B3","clue":"clue","answer":"WORD"},{"id":"B4","clue":"clue","answer":"WORD"}]},
  {"id":"C","theme":"WORD","fields":[{"id":"C1","clue":"clue","answer":"WORD"},{"id":"C2","clue":"clue","answer":"WORD"},{"id":"C3","clue":"clue","answer":"WORD"},{"id":"C4","clue":"clue","answer":"WORD"}]},
  {"id":"D","theme":"WORD","fields":[{"id":"D1","clue":"clue","answer":"WORD"},{"id":"D2","clue":"clue","answer":"WORD"},{"id":"D3","clue":"clue","answer":"WORD"},{"id":"D4","clue":"clue","answer":"WORD"}]}
],"final":{"answer":"WORD","hint":"short hint"}}
Rules: 4 distinct themes; clues are 2-3 English words; answers are single UPPERCASE English words; final answer is the overarching category linking all 4 themes.`
        }]
      })
    });
    const d = await res.json();
    return JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim());
  } catch { return DEMO; }
}

const DEMO = {
  columns:[
    {id:"A",theme:"ANIMALS",fields:[{id:"A1",clue:"King of jungle",answer:"LION"},{id:"A2",clue:"Striped horse",answer:"ZEBRA"},{id:"A3",clue:"Long neck",answer:"GIRAFFE"},{id:"A4",clue:"Trunk & ivory",answer:"ELEPHANT"}]},
    {id:"B",theme:"INSTRUMENTS",fields:[{id:"B1",clue:"Six strings",answer:"GUITAR"},{id:"B2",clue:"88 keys",answer:"PIANO"},{id:"B3",clue:"Hit with sticks",answer:"DRUM"},{id:"B4",clue:"Brass & valves",answer:"TRUMPET"}]},
    {id:"C",theme:"SPORTS",fields:[{id:"C1",clue:"Court & racket",answer:"TENNIS"},{id:"C2",clue:"Skates & puck",answer:"HOCKEY"},{id:"C3",clue:"Pool & lanes",answer:"SWIMMING"},{id:"C4",clue:"Eight-sided cage",answer:"MMA"}]},
    {id:"D",theme:"FOOD",fields:[{id:"D1",clue:"Italian flatbread",answer:"PIZZA"},{id:"D2",clue:"Japanese roll",answer:"SUSHI"},{id:"D3",clue:"Mexican wrap",answer:"BURRITO"},{id:"D4",clue:"Long French bread",answer:"BAGUETTE"}]},
  ],
  final:{answer:"FREEDOM",hint:"Project Freedom"}
};

/* ─── HELPERS ──────────────────────────────────────────── */
const norm = s => s.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
const hit  = (a,b) => norm(a)===norm(b);
const uid6 = () => Math.random().toString(36).slice(2,8).toUpperCase();

/* ─── SKULL ────────────────────────────────────────────── */
const Skull = ({sz=44}) => (
  <svg width={sz} height={sz} viewBox="0 0 64 64" fill="none">
    <polygon points="32,2 54,16 54,40 32,54 10,40 10,16" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity=".5"/>
    <circle cx="32" cy="26" r="16" fill="#fff" opacity=".93"/>
    <rect x="24" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93"/>
    <rect x="33" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93"/>
    <ellipse cx="26" cy="24" rx="4.5" ry="5.5" fill="#111"/>
    <ellipse cx="38" cy="24" rx="4.5" ry="5.5" fill="#111"/>
    <ellipse cx="26" cy="23" rx="1.5" ry="2" fill="#8b5cf6" opacity=".9"/>
    <ellipse cx="38" cy="23" rx="1.5" ry="2" fill="#22c55e" opacity=".9"/>
    <path d="M28 34L32 31L36 34" stroke="#444" strokeWidth="1.5" fill="none"/>
  </svg>
);

/* ─── HEADER ───────────────────────────────────────────── */
const Header = () => (
  <div style={{width:"100%",background:"#050505",borderBottom:"2px solid #111",padding:"10px 16px",
    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative",boxSizing:"border-box"}}>
    <div style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontFamily:"'Black Ops One',cursive",fontSize:11,letterSpacing:1}}>
      <span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"#444"}}>.FUN</span>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <Skull sz={44}/>
      <div style={{textAlign:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
          <div style={{width:28,height:1,background:"#22c55e",opacity:.5}}/>
          <span style={{fontFamily:"'Black Ops One',cursive",fontSize:9,color:"#777",letterSpacing:5}}>PROJECT</span>
          <div style={{width:28,height:1,background:"#22c55e",opacity:.5}}/>
        </div>
        <div style={{fontFamily:"'Black Ops One',cursive",fontSize:28,color:"#22c55e",letterSpacing:5,textShadow:"0 0 20px #22c55e99"}}>FREEDOM</div>
        <div style={{fontFamily:"'Black Ops One',cursive",fontSize:11,color:"#8b5cf6",letterSpacing:5,textShadow:"0 0 10px #8b5cf677"}}>ASSOCIATIONS</div>
      </div>
      <Skull sz={44}/>
    </div>
  </div>
);

/* ─── FOOTER ───────────────────────────────────────────── */
const Footer = () => (
  <div style={{width:"100%",background:"#050505",borderTop:"1px solid #111",padding:"6px",
    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    <span style={{fontFamily:"'Black Ops One',cursive",fontSize:12,letterSpacing:2}}>
      <span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"#444"}}>.FUN</span>
    </span>
  </div>
);

/* ─── TIMER BAR ────────────────────────────────────────── */
const TimerBar = ({secs,max,warn=10}) => {
  const hot = secs<=warn;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{flex:1,height:4,background:"#111",borderRadius:2,overflow:"hidden"}}>
        <div style={{width:`${(secs/max)*100}%`,height:"100%",background:hot?"#ef4444":"#22c55e",
          transition:"width 1s linear,background .3s",borderRadius:2}}/>
      </div>
      <span style={{fontFamily:"monospace",fontSize:11,minWidth:24,color:hot?"#ef4444":"#555"}}>{secs}s</span>
    </div>
  );
};

/* ─── FIELD CELL — square 1:1 ──────────────────────────── */
/*
  States:
  "hidden"  → shows field ID, clickable if canClick
  "open"    → shows clue (revealed this turn)
  "solved"  → shows answer (green)
*/
const FieldCell = ({field, state, canClick, onClick, color}) => {
  const base = {
    aspectRatio:"1/1", width:"100%",
    display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center",
    borderRadius:8, boxSizing:"border-box",
    padding:6, textAlign:"center", userSelect:"none",
    transition:"all .15s",
  };
  if (state==="solved") return (
    <div style={{...base, background:`${color}22`, border:`2px solid ${color}`, animation:"pop .3s"}}>
      <span style={{fontSize:11,fontWeight:700,color,letterSpacing:1,lineHeight:1.2}}>{field.answer}</span>
      <span style={{fontSize:7,color:`${color}99`,marginTop:3,lineHeight:1.2}}>{field.clue}</span>
    </div>
  );
  if (state==="open") return (
    <div style={{...base, background:"#0e0e1a", border:`2px solid ${color}`, boxShadow:`0 0 16px ${color}88`}}>
      <span style={{fontSize:7,color:"#777",marginBottom:4,letterSpacing:1}}>{field.id}</span>
      <span style={{fontSize:11,color:"#fff",fontWeight:700,lineHeight:1.3}}>{field.clue}</span>
    </div>
  );
  // hidden
  return (
    <div onClick={canClick?onClick:undefined}
      style={{...base, background:canClick?"#0d0d1a":"#070710",
        border:`2px solid ${canClick?color+"55":"#1a1a1a"}`,
        cursor:canClick?"pointer":"default"}}
      onMouseEnter={e=>{if(canClick){e.currentTarget.style.background="#141428";e.currentTarget.style.borderColor=color+"cc";e.currentTarget.style.boxShadow=`0 0 14px ${color}55`;}}}
      onMouseLeave={e=>{if(canClick){e.currentTarget.style.background="#0d0d1a";e.currentTarget.style.borderColor=color+"55";e.currentTarget.style.boxShadow="none";}}}>
      <span style={{fontSize:13,fontWeight:700,color:canClick?"#666":"#1e1e1e",letterSpacing:2}}>{field.id}</span>
    </div>
  );
};

/* ─── GUESS INPUT ──────────────────────────────────────── */
const GuessBox = ({label, solved, solvedText, disabled, onGuess, color}) => {
  const [v,setV]=useState(""); const [bad,setBad]=useState(false);
  if (solved) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",
      background:`${color}18`,border:`1px solid ${color}66`,borderRadius:6,padding:"5px 8px",minHeight:34}}>
      <span style={{color,fontWeight:700,fontSize:10}}>✓ {solvedText}</span>
    </div>
  );
  const go = () => {
    if(!v.trim()||disabled) return;
    if(!onGuess(v)){setBad(true);setTimeout(()=>setBad(false),500);} else setV("");
  };
  return (
    <div style={{display:"flex",alignItems:"center",gap:4,background:"#0a0a0a",
      border:`1px solid ${bad?"#ef4444":"#1a1a1a"}`,borderRadius:6,padding:"4px 8px",
      opacity:disabled?.2:1,animation:bad?"shake .4s":"none",minHeight:34,transition:"opacity .2s"}}>
      <span style={{fontSize:8,color:"#444",whiteSpace:"nowrap",minWidth:42}}>{label}</span>
      <input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}
        disabled={disabled} placeholder="type answer..." style={{flex:1,background:"transparent",border:"none",
        color:disabled?"#333":"#fff",fontSize:10,outline:"none",fontFamily:"inherit",minWidth:0}}/>
      <button onClick={go} disabled={disabled} style={{background:disabled?"#1a1a1a":color,border:"none",
        borderRadius:4,padding:"3px 8px",color:disabled?"#333":"#fff",fontWeight:700,
        cursor:disabled?"default":"pointer",fontSize:9,flexShrink:0}}>OK</button>
    </div>
  );
};

/* ─── LEADERBOARD ──────────────────────────────────────── */
const Leaderboard = ({onClose}) => {
  const [tab,setTab]=useState("points");
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    get(ref(db,"leaderboard")).then(snap=>{
      const d=snap.val()||{};
      const arr=Object.values(d).filter(x=>x&&x.name);
      setRows(arr); setLoading(false);
    });
  },[]);
  const sorted=[...rows].sort((a,b)=>{
    if(tab==="points") return (b.points||0)-(a.points||0);
    if(tab==="wins")   return (b.wins||0)-(a.wins||0);
    return (b.tokensWon||0)-(a.tokensWon||0);
  }).slice(0,10);
  const medals=["🥇","🥈","🥉"];
  return (
    <div style={{position:"fixed",inset:0,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
      <div style={{background:"#0a0a14",border:"1px solid #1a1a2e",borderRadius:14,padding:20,width:"90%",maxWidth:420}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:"#a78bfa",letterSpacing:3}}>LEADERBOARD</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#555",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:14,background:"#070710",borderRadius:7,padding:3}}>
          {[["points","🏅 Points"],["wins","🏆 Wins"],["tokens","💰 Tokens"]].map(([k,lbl])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"6px 0",borderRadius:5,
              background:tab===k?"#8b5cf6":"transparent",color:tab===k?"#fff":"#555",
              border:"none",fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer"}}>
              {lbl}
            </button>
          ))}
        </div>
        {loading ? <div style={{textAlign:"center",color:"#444",padding:20}}>Loading...</div> :
          sorted.length===0 ? <div style={{textAlign:"center",color:"#444",padding:20}}>No games played yet</div> :
          sorted.map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
              background:i===0?"#8b5cf611":"#070710",borderRadius:7,marginBottom:4,
              border:`1px solid ${i===0?"#8b5cf633":"#111"}`}}>
              <span style={{fontSize:18,minWidth:28}}>{medals[i]||`${i+1}.`}</span>
              <span style={{flex:1,fontSize:12,color:"#ccc",fontWeight:600}}>{r.name}</span>
              <div style={{textAlign:"right"}}>
                {tab==="points" && <span style={{color:"#a78bfa",fontWeight:700,fontSize:13}}>{r.points||0} pts</span>}
                {tab==="wins"   && <span style={{color:"#22c55e",fontWeight:700,fontSize:13}}>{r.wins||0} wins</span>}
                {tab==="tokens" && <span style={{color:"#f4a261",fontWeight:700,fontSize:13}}>{r.tokensWon||0} 🪙</span>}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

/* ─── LOADING ──────────────────────────────────────────── */
const Loading = ({msg}) => (
  <div style={S.root}><style>{CSS}</style><Header/>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{width:48,height:48,border:"3px solid #8b5cf622",borderTop:"3px solid #8b5cf6",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{color:"#555",fontSize:12,letterSpacing:2}}>{msg}</div>
    </div>
  <Footer/></div>
);

/* ══════════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════ */
export default function App() {
  /* lobby */
  const [uid,setUid]         = useState(null);
  const [screen,setScreen]   = useState("lobby"); // lobby|loading|waiting|game|result
  const [name,setName]       = useState("");
  const [wager,setWager]     = useState(100);
  const [mode,setMode]       = useState("create"); // create|join
  const [roomInput,setRoom]  = useState("");
  const [wallet,setWallet]   = useState(null);
  const [wLoading,setWLoad]  = useState(false);
  const [lMsg,setLMsg]       = useState("");
  const [showLB,setShowLB]   = useState(false);
  /* game */
  const [gameId,setGameId]   = useState(null);
  const [myRole,setMyRole]   = useState(null); // p1|p2
  const [gs,setGs]           = useState(null); // gameState from Firebase
  const [started,setStarted] = useState(false);
  const [tTurn,setTTurn]     = useState(T_TURN);
  const [tFinal,setTFinal]   = useState(T_FINAL);
  const [tIdle,setTIdle]     = useState(T_IDLE);
  const [log,setLog]         = useState([]);

  const rTurn=useRef(); const rFinal=useRef(); const rIdle=useRef();
  const lastAct=useRef(Date.now());
  const gRef=useRef(null);

  const addLog = m => setLog(p=>[m,...p].slice(0,6));
  const touch  = () => { lastAct.current=Date.now(); setTIdle(T_IDLE); };

  /* auth */
  useEffect(()=>{ signInAnonymously(auth).then(r=>setUid(r.user.uid)).catch(console.error); },[]);
  useEffect(()=>{ if(window.solana?.isPhantom&&window.solana.publicKey) setWallet(window.solana.publicKey.toString()); },[]);

  /* game listener */
  useEffect(()=>{
    if(!gameId) return;
    gRef.current = ref(db,`ag/${gameId}`);
    const unsub = onValue(gRef.current, snap=>{
      const d=snap.val(); if(!d) return;
      setGs(d);
      if(d.status==="finished") setScreen("result");
      if(d.status==="active"&&d.p1&&d.p2&&!started){ setStarted(true); lastAct.current=Date.now(); }
    });
    return ()=>unsub();
  },[gameId,started]);

  /* turn timer */
  useEffect(()=>{
    if(screen!=="game"||!started||!gs||gs.finalPhase||gs.status==="finished") return;
    clearInterval(rTurn.current); setTTurn(T_TURN);
    rTurn.current=setInterval(()=>setTTurn(t=>{
      if(t<=1){ clearInterval(rTurn.current); if(gs.currentTurn===myRole) doPassTurn(); return T_TURN; }
      return t-1;
    }),1000);
    return ()=>clearInterval(rTurn.current);
  },[gs?.currentTurn,screen,gs?.finalPhase,started]);

  /* final timer */
  useEffect(()=>{
    if(!gs?.finalPhase||gs?.status==="finished") return;
    clearInterval(rFinal.current); setTFinal(T_FINAL);
    rFinal.current=setInterval(()=>setTFinal(t=>{
      if(t<=1){ clearInterval(rFinal.current); const s=gs.scores||{p1:0,p2:0}; doEndGame(s.p1>=s.p2?"p1":"p2","Time's up — winner by points!"); return 0; }
      return t-1;
    }),1000);
    return ()=>clearInterval(rFinal.current);
  },[gs?.finalPhase,gs?.status]);

  /* idle timer — only after both players joined */
  useEffect(()=>{
    if(screen!=="game"||!started||gs?.status==="finished") return;
    clearInterval(rIdle.current);
    rIdle.current=setInterval(()=>{
      const rem=T_IDLE-Math.floor((Date.now()-lastAct.current)/1000);
      setTIdle(Math.max(0,rem));
      if(rem<=0){ clearInterval(rIdle.current); doEndGame(myRole==="p1"?"p2":"p1","Idle 60s — opponent wins!"); }
    },1000);
    return ()=>clearInterval(rIdle.current);
  },[screen,started,myRole,gs?.status]);

  /* check all fields solved → final phase */
  useEffect(()=>{
    if(!gs||gs.finalPhase||gs.status==="finished") return;
    const b=gs.board; if(!b) return;
    const total=b.columns.reduce((s,c)=>s+c.fields.length,0);
    if(Object.keys(gs.solved||{}).length>=total&&gs.currentTurn===myRole){
      update(gRef.current,{finalPhase:true});
      addLog("🎯 All fields open! 60s for the final answer!");
    }
  },[gs]);

  /* wait for p2 */
  useEffect(()=>{
    if(screen!=="waiting"||!gameId) return;
    const unsub=onValue(ref(db,`ag/${gameId}`),snap=>{
      const d=snap.val();
      if(d?.status==="active"&&d.p1&&d.p2){ setGs(d); setStarted(true); lastAct.current=Date.now(); setScreen("game"); addLog("Opponent joined! Your turn!"); }
    });
    return ()=>unsub();
  },[screen,gameId]);

  /* ── wallet ── */
  const connectW = async()=>{ setWLoad(true); const a=await connectPhantom(); if(a) setWallet(a); setWLoad(false); };

  /* ── create ── */
  const doCreate = async()=>{
    if(!name.trim()||!uid||!wallet) return;
    setScreen("loading"); setLMsg("Generating board (AI)...");
    const board=await aiBoard();
    setLMsg("Confirming wager...");
    const tx=await signWager(wager,wallet);
    if(!tx.ok){ alert("Wager failed: "+tx.err); setScreen("lobby"); return; }
    setLMsg("Creating room...");
    const gid=uid6();
    await set(ref(db,`ag/${gid}`),{
      p1:uid, p1name:name, p1wallet:wallet,
      p2:null, p2name:null, p2wallet:null,
      status:"waiting", wager, board,
      scores:{p1:0,p2:0},
      solved:{},      // fieldId → true (correctly answered)
      colSolved:{A:false,B:false,C:false,D:false},
      finalSolved:false, finalPhase:false,
      currentTurn:"p1",
      openedField:null,  // which field is showing clue RIGHT NOW
      clickedBy:null,    // which role clicked it
      lastActivity:Date.now(), winner:null, p1tx:tx.tx
    });
    setGameId(gid); setMyRole("p1"); setStarted(false); setScreen("waiting");
  };

  /* ── join ── */
  const doJoin = async()=>{
    const gid=roomInput.trim().toUpperCase();
    if(!name.trim()||!uid||!wallet||!gid) return;
    setScreen("loading"); setLMsg("Confirming wager...");
    const tx=await signWager(wager,wallet);
    if(!tx.ok){ alert("Wager failed: "+tx.err); setScreen("lobby"); return; }
    setLMsg("Joining room...");
    const snap=await get(ref(db,`ag/${gid}`));
    const d=snap.val();
    if(!d){ alert("Room not found!"); setScreen("lobby"); return; }
    if(d.status!=="waiting"){ alert("Room already started!"); setScreen("lobby"); return; }
    await update(ref(db,`ag/${gid}`),{ p2:uid, p2name:name, p2wallet:wallet, status:"active", currentTurn:"p1", lastActivity:Date.now(), p2tx:tx.tx });
    setWager(d.wager); setGameId(gid); setMyRole("p2"); setStarted(true); lastAct.current=Date.now();
    setScreen("game"); addLog("Joined! You are Player 2.");
  };

  /* ── click field ── */
  const doReveal = async(fieldId)=>{
    if(!isMy||gs?.openedField||gs?.finalPhase) return; // already a field open this turn
    touch();
    await update(gRef.current,{ openedField:fieldId, clickedBy:myRole, lastActivity:Date.now() });
    addLog(`Field ${fieldId} revealed — now guess a theme or final!`);
  };

  /* ── guess column theme ── */
  const doGuessCol = async(colId,val)=>{
    touch();
    const col=gs.board.columns.find(c=>c.id===colId);
    if(!col||gs.colSolved?.[colId]) return false;
    if(hit(val,col.theme)){
      const updates={ [`colSolved/${colId}`]:myRole, [`scores/${myRole}`]:(gs.scores[myRole]||0)+20, lastActivity:Date.now() };
      // mark all fields in this column as solved
      col.fields.forEach(f=>{ updates[`solved/${f.id}`]=true; });
      await update(gRef.current,updates);
      addLog(`✅ Column ${colId}: "${col.theme}"! +20pts`);
      setTimeout(()=>doPassTurn(),500);
      return true;
    }
    addLog(`❌ Wrong theme for column ${colId}`);
    return false;
  };

  /* ── guess final ── */
  const doGuessFinal = async(val)=>{
    touch();
    if(hit(val,gs.board.final.answer)){
      await update(gRef.current,{ finalSolved:myRole, [`scores/${myRole}`]:(gs.scores[myRole]||0)+30, lastActivity:Date.now() });
      doEndGame(myRole,"Final answer correct! +30pts");
      return true;
    }
    addLog("❌ Wrong final answer!");
    return false;
  };

  /* ── pass turn ── */
  const doPassTurn = async()=>{
    const next=myRole==="p1"?"p2":"p1";
    await update(gRef.current,{ currentTurn:next, openedField:null, clickedBy:null, lastActivity:Date.now() });
  };

  /* ── end game ── */
  const doEndGame = async(w,reason)=>{
    if(!gRef.current) return;
    await update(gRef.current,{ status:"finished", winner:w, winReason:reason, finishedAt:Date.now() });
    doLeaderboard(w);
  };

  const doLeaderboard = async(w)=>{
    if(!gs) return;
    const sc=gs.scores||{p1:0,p2:0};
    for(const r of["p1","p2"]){
      const u=gs[r]; if(!u) continue;
      const lb=ref(db,`leaderboard/${u}`);
      const snap=await get(lb);
      const cur=snap.val()||{wins:0,losses:0,points:0,tokensWon:0};
      await set(lb,{ name:r==="p1"?gs.p1name:gs.p2name, wins:(cur.wins||0)+(w===r?1:0), losses:(cur.losses||0)+(w===r?0:1), points:(cur.points||0)+(sc[r]||0), tokensWon:(cur.tokensWon||0)+(w===r?wager*2:0) });
    }
  };

  const doReset = ()=>{ setScreen("lobby"); setGameId(null); setMyRole(null); setGs(null); setLog([]); setRoom(""); setStarted(false); };

  /* ── derived ── */
  const board      = gs?.board||null;
  const isMy       = gs?.currentTurn===myRole;
  const oppRole    = myRole==="p1"?"p2":"p1";
  const scores     = gs?.scores||{p1:0,p2:0};
  const solved     = gs?.solved||{};
  const colSolved  = gs?.colSolved||{};
  const finalSolved= gs?.finalSolved||false;
  const finalPhase = gs?.finalPhase||false;
  const winner     = gs?.winner||null;
  const winReason  = gs?.winReason||"";
  const myName     = myRole==="p1"?gs?.p1name||"P1":gs?.p2name||"P2";
  const oppName    = myRole==="p1"?gs?.p2name||"P2":gs?.p1name||"P1";

  // field can be clicked: my turn, no field open yet this turn, not final phase, game active
  const canClick = isMy && !gs?.openedField && !finalPhase && !winner && gs?.status==="active" && started;
  // can guess: my turn, a field was opened this turn (or final phase), game active
  const canGuess = isMy && (!!gs?.openedField||finalPhase) && !winner && gs?.status==="active" && started;

  const fieldState = (f) => {
    if(solved[f.id]) return "solved";
    if(gs?.openedField===f.id) return "open";
    return "hidden";
  };

  /* ════════════════════════════
     LOBBY
  ════════════════════════════ */
  if(screen==="lobby") return (
    <div style={S.root}><style>{CSS}</style><Header/>
    {showLB && <Leaderboard onClose={()=>setShowLB(false)}/>}
    <div style={{flex:1,overflowY:"auto",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:12}}>
      <div style={S.card}>
        {/* wallet */}
        <div style={{marginBottom:12,padding:12,background:"#060606",borderRadius:8,border:"1px solid #1a1a1a"}}>
          <div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:6}}>PHANTOM WALLET</div>
          {wallet ? (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 8px #22c55e"}}/>
              <span style={{fontSize:10,color:"#22c55e",fontFamily:"monospace"}}>{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
              <span style={{fontSize:9,color:"#444",marginLeft:"auto"}}>✓ Connected</span>
            </div>
          ) : (
            <button onClick={connectW} disabled={wLoading} style={{...S.btn,background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",color:"#fff",boxShadow:"0 0 16px #8b5cf644"}}>
              {wLoading?"CONNECTING...":"🔗 CONNECT PHANTOM WALLET"}
            </button>
          )}
        </div>

        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name / username" style={S.input} maxLength={16}/>

        <div style={{marginTop:12}}>
          <div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:6}}>WAGER — FREEDOM TOKENS</div>
          <div style={{display:"flex",gap:6}}>
            {WAGERS.map(w=><button key={w} onClick={()=>setWager(w)} style={{flex:1,padding:"8px 0",borderRadius:6,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",background:wager===w?"#8b5cf6":"#0e0e0e",color:wager===w?"#fff":"#8b5cf6",border:`1px solid ${wager===w?"#8b5cf6":"#2a2a2a"}`,boxShadow:wager===w?"0 0 14px #8b5cf633":"none"}}>{w}</button>)}
          </div>
        </div>

        {/* tabs */}
        <div style={{marginTop:12,display:"flex",borderRadius:7,overflow:"hidden",border:"1px solid #1a1a1a"}}>
          {[["create","🎮 CREATE ROOM"],["join","🚪 JOIN ROOM"]].map(([m,lbl])=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"9px 0",fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer",background:mode===m?"#8b5cf6":"#0a0a0a",color:mode===m?"#fff":"#555",border:"none",letterSpacing:1,transition:"all .2s"}}>{lbl}</button>
          ))}
        </div>

        {mode==="create" && (
          <button onClick={doCreate} disabled={!name.trim()||!uid||!wallet} style={{...S.btn,marginTop:10,background:name.trim()&&wallet?"linear-gradient(90deg,#8b5cf6,#7c3aed)":"#1a1a1a",color:name.trim()&&wallet?"#fff":"#444",boxShadow:name.trim()&&wallet?"0 0 20px #8b5cf644":"none"}}>
            🎮 CREATE ROOM
          </button>
        )}
        {mode==="join" && (
          <div style={{marginTop:10}}>
            <div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:6}}>ROOM ID</div>
            <input value={roomInput} onChange={e=>setRoom(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123"
              style={{...S.input,textAlign:"center",letterSpacing:8,fontFamily:"'Black Ops One',cursive",fontSize:20,color:"#22c55e"}}/>
            <button onClick={doJoin} disabled={!name.trim()||!uid||!wallet||roomInput.length<6} style={{...S.btn,marginTop:8,background:roomInput.length===6&&name.trim()&&wallet?"linear-gradient(90deg,#22c55e,#16a34a)":"#1a1a1a",color:roomInput.length===6&&name.trim()&&wallet?"#000":"#444"}}>
              🚪 JOIN ROOM
            </button>
          </div>
        )}

        {/* leaderboard btn */}
        <button onClick={()=>setShowLB(true)} style={{...S.btn,marginTop:12,background:"#0a0a14",color:"#a78bfa",border:"1px solid #a78bfa44"}}>
          🏆 LEADERBOARD
        </button>

        {/* rules */}
        <div style={{marginTop:12,padding:12,background:"#060606",borderRadius:8,border:"1px solid #111"}}>
          <div style={{color:"#8b5cf6",fontSize:9,fontWeight:700,letterSpacing:2,marginBottom:8}}>HOW TO PLAY</div>
          {[
            ["1.","Click one field — the clue appears"],
            ["2.","Type the column theme or final answer in the boxes below"],
            ["3.","Correct column theme solves all 4 fields in that column (+20pts)"],
            ["4.","Correct final answer wins instantly (+30pts)"],
            ["5.","30s per turn · 60s idle = auto-loss · Winner takes the wager"],
          ].map(([n,t],i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:4}}>
              <span style={{fontSize:9,color:"#8b5cf6",fontWeight:700,minWidth:16}}>{n}</span>
              <span style={{fontSize:9,color:"#444",lineHeight:1.5}}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <Footer/></div>
  );

  if(screen==="loading") return <Loading msg={lMsg}/>;

  /* ════════════════════════════
     WAITING
  ════════════════════════════ */
  if(screen==="waiting") return (
    <div style={S.root}><style>{CSS}</style><Header/>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:20}}>
      <div style={{width:56,height:56,border:"3px solid #22c55e22",borderTop:"3px solid #22c55e",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{fontFamily:"'Black Ops One',cursive",fontSize:14,color:"#22c55e",letterSpacing:3}}>WAITING FOR OPPONENT</div>
      <div style={{fontSize:11,color:"#444"}}>Wager: <b style={{color:"#a78bfa"}}>{wager}</b> FREEDOM tokens</div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:10,color:"#555",marginBottom:8,letterSpacing:1}}>SHARE THIS ROOM ID:</div>
        <div style={{fontSize:38,fontFamily:"'Black Ops One',cursive",color:"#22c55e",letterSpacing:8,padding:"14px 28px",background:"#0a1a0f",border:"2px solid #22c55e44",borderRadius:10,textShadow:"0 0 20px #22c55e88"}}>{gameId}</div>
      </div>
      <button onClick={()=>{set(ref(db,`ag/${gameId}`),null);setScreen("lobby");setGameId(null);setMyRole(null);}} style={{...S.btn,maxWidth:160,padding:"8px 0",fontSize:10}}>CANCEL</button>
    </div>
    <Footer/></div>
  );

  /* ════════════════════════════
     RESULT
  ════════════════════════════ */
  if(screen==="result"||winner) return (
    <div style={S.root}><style>{CSS}</style><Header/>
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{...S.card,textAlign:"center",maxWidth:340}}>
        <div style={{fontSize:56,lineHeight:1}}>{winner===myRole?"🏆":"💀"}</div>
        <div style={{fontFamily:"'Black Ops One',cursive",fontSize:24,letterSpacing:3,marginTop:8,color:winner===myRole?"#22c55e":"#ef4444",textShadow:`0 0 20px ${winner===myRole?"#22c55e":"#ef4444"}88`}}>
          {winner===myRole?"YOU WIN!":"YOU LOSE"}
        </div>
        <div style={{color:"#555",fontSize:11,marginTop:6,marginBottom:20}}>{winReason}</div>
        <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:20}}>
          {["p1","p2"].map(r=>(
            <div key={r} style={{padding:"12px 24px",borderRadius:10,background:r===winner?"#22c55e0a":"#0a0a0a",border:`2px solid ${r===winner?"#22c55e":"#1a1a1a"}`}}>
              <div style={{fontSize:9,color:"#444"}}>{r===myRole?myName:oppName}</div>
              <div style={{fontSize:30,fontWeight:900,color:r===winner?"#22c55e":"#fff"}}>{scores[r]||0}</div>
              <div style={{fontSize:9,color:"#333"}}>points</div>
            </div>
          ))}
        </div>
        {winner===myRole&&<div style={{color:"#a78bfa",fontSize:12,marginBottom:14,padding:"8px",background:"#a78bfa0a",borderRadius:6,border:"1px solid #a78bfa33"}}>🎉 Winnings: <b>{wager*2}</b> FREEDOM tokens</div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={doReset} style={{...S.btn,flex:1,background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",color:"#fff"}}>NEW GAME</button>
          <button onClick={()=>setShowLB(true)} style={{...S.btn,flex:1,background:"#0a0a14",color:"#a78bfa",border:"1px solid #a78bfa44"}}>🏆 LEADERBOARD</button>
        </div>
      </div>
    </div>
    {showLB&&<Leaderboard onClose={()=>setShowLB(false)}/>}
    <Footer/></div>
  );

  if(!board) return <Loading msg="Loading game..."/>;

  /* ════════════════════════════
     GAME BOARD
     X layout:
     Row 1: [A header]  [???]  [D header]
     Row 2: A1 A2 A3 A4 [???] D4 D3 D2 D1
     Row 3: B1 B2 B3 B4 [???] C4 C3 C2 C1
     Row 4: [B header]  [???]  [C header]
     Row 5: GuessBoxes for A / B / FINAL / C / D
  ════════════════════════════ */
  const [cA,cB,cC,cD] = board.columns;

  // 4 fields per column, rendered as a row of 4 squares
  const ColRow = ({col, reversed=false}) => {
    const fields = reversed ? [...col.fields].reverse() : col.fields;
    return (
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,flex:1}}>
        {fields.map(f=>(
          <FieldCell key={f.id} field={f} state={fieldState(f)}
            canClick={canClick&&!solved[f.id]}
            onClick={()=>doReveal(f.id)}
            color={CLR[col.id]}/>
        ))}
      </div>
    );
  };

  const ColHeader = ({col,borderPos="bottom"}) => (
    <div style={{textAlign:"center",padding:"4px 0",[`border${borderPos==="bottom"?"Bottom":"Top"}`]:`3px solid ${CLR[col.id]}88`}}>
      <span style={{fontFamily:"'Black Ops One',cursive",fontSize:20,color:CLR[col.id],letterSpacing:3,textShadow:`0 0 10px ${CLR[col.id]}88`}}>{col.id}</span>
    </div>
  );

  const FinalBox = ({rows=1}) => (
    <div style={{width:90,flexShrink:0,display:"flex",alignItems:"stretch"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        background:finalPhase?"#a78bfa0c":"#050508",border:`2px solid ${finalPhase?"#a78bfa66":"#1a1a1a"}`,
        borderRadius:8,padding:8,textAlign:"center",animation:finalPhase?"glowPulse 2s infinite":"none",boxSizing:"border-box",
        minHeight: rows===2 ? 88 : 44}}>
        <div style={{fontSize:8,color:"#333",letterSpacing:1,marginBottom:3}}>FINAL</div>
        {finalSolved
          ?<div style={{fontSize:11,fontWeight:900,color:"#22c55e",letterSpacing:1}}>{board.final.answer}</div>
          :<div style={{fontFamily:"'Black Ops One',cursive",fontSize:20,color:"#1a1a1a"}}>???</div>
        }
        <div style={{fontSize:7,color:"#222",marginTop:2}}>{board.final.hint}</div>
      </div>
    </div>
  );

  return (
    <div style={S.root}><style>{CSS}</style><Header/>
    {showLB&&<Leaderboard onClose={()=>setShowLB(false)}/>}

    {/* STATUS BAR */}
    <div style={S.bar}>
      <div style={{display:"flex",gap:5,alignItems:"center",flex:1,minWidth:0}}>
        {["p1","p2"].map(r=>(
          <div key={r} style={{padding:"3px 10px",borderRadius:14,background:gs?.currentTurn===r?"#8b5cf618":"#0a0a0a",border:`1px solid ${gs?.currentTurn===r?"#8b5cf6":"#1a1a1a"}`,fontSize:10,color:r===myRole?"#a78bfa":"#555",fontWeight:gs?.currentTurn===r?700:400,whiteSpace:"nowrap"}}>
            {r===myRole?myName:oppName} <b style={{color:gs?.currentTurn===r?"#fff":"inherit"}}>{scores[r]||0}</b>
          </div>
        ))}
      </div>
      <div style={{width:100}}>
        {finalPhase?<TimerBar secs={tFinal} max={T_FINAL} warn={15}/>:<TimerBar secs={tTurn} max={T_TURN} warn={8}/>}
      </div>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:1,whiteSpace:"nowrap",color:finalPhase?"#f59e0b":isMy?"#22c55e":"#ef4444"}}>
        {finalPhase?"🎯 FINAL":isMy?"⚡ YOUR TURN":"⏳ WAIT"}
      </div>
      {tIdle<20&&started&&<div style={{fontSize:8,color:"#ef4444",animation:"blink 1s infinite"}}>IDLE {tIdle}s</div>}
      <button onClick={()=>setShowLB(true)} style={{padding:"2px 8px",borderRadius:4,background:"#0a0a14",color:"#a78bfa",border:"1px solid #a78bfa44",fontFamily:"inherit",fontSize:8,cursor:"pointer"}}>🏆</button>
      {isMy&&!finalPhase&&!winner&&started&&(
        <button onClick={()=>{touch();doPassTurn();addLog("Turn passed.");}} style={{padding:"2px 8px",borderRadius:4,background:"#111",color:"#333",border:"1px solid #1a1a1a",fontFamily:"inherit",fontSize:8,cursor:"pointer"}}>PASS</button>
      )}
    </div>

    {/* HINT */}
    <div style={{fontSize:9,textAlign:"center",padding:"3px 0",borderBottom:"1px solid #0a0a0a",background:"#050505",
      color:canClick?"#8b5cf6":canGuess?"#a78bfa":isMy?"#333":"#222"}}>
      {!started?"⏳ Waiting for opponent...":
       finalPhase?"🎯 Guess column themes or final answer below!":
       isMy?canClick?"👆 Click a field to reveal its clue":
            gs?.openedField?`Clue shown — now guess the column theme or final answer below`:"Wait for next turn...":
       "Waiting for opponent..."}
    </div>

    {/* BOARD */}
    <div style={{flex:1,overflowY:"auto",padding:"6px 4px"}}>
      <div style={{maxWidth:820,margin:"0 auto"}}>

        {/* Row 1: A header + empty + D header */}
        <div style={{display:"flex",gap:4,marginBottom:3,alignItems:"stretch"}}>
          <div style={{flex:1}}><ColHeader col={cA} borderPos="bottom"/></div>
          <div style={{width:90}}/>
          <div style={{flex:1}}><ColHeader col={cD} borderPos="bottom"/></div>
        </div>

        {/* Row 2: A fields + FINAL (spans 2 rows) + D fields reversed */}
        <div style={{display:"flex",gap:4,marginBottom:4,alignItems:"stretch"}}>
          <ColRow col={cA}/>
          <FinalBox rows={2}/>
          <ColRow col={cD} reversed={true}/>
        </div>

        {/* Row 3: B fields + spacer + C fields reversed */}
        <div style={{display:"flex",gap:4,marginBottom:3,alignItems:"stretch"}}>
          <ColRow col={cB}/>
          <div style={{width:90}}/>
          <ColRow col={cC} reversed={true}/>
        </div>

        {/* Row 4: B header + empty + C header */}
        <div style={{display:"flex",gap:4,marginBottom:6,alignItems:"stretch"}}>
          <div style={{flex:1}}><ColHeader col={cB} borderPos="top"/></div>
          <div style={{width:90}}/>
          <div style={{flex:1}}><ColHeader col={cC} borderPos="top"/></div>
        </div>

        {/* GUESS BOXES */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 90px 1fr 1fr",gap:4,marginBottom:6}}>
          <GuessBox label="Theme A" solved={!!colSolved.A} solvedText={cA.theme} disabled={!canGuess} onGuess={v=>doGuessCol("A",v)} color={CLR.A}/>
          <GuessBox label="Theme B" solved={!!colSolved.B} solvedText={cB.theme} disabled={!canGuess} onGuess={v=>doGuessCol("B",v)} color={CLR.B}/>
          <GuessBox label="FINAL"   solved={!!finalSolved}  solvedText={board.final.answer} disabled={!canGuess} onGuess={doGuessFinal} color={CLR.FINAL}/>
          <GuessBox label="Theme C" solved={!!colSolved.C} solvedText={cC.theme} disabled={!canGuess} onGuess={v=>doGuessCol("C",v)} color={CLR.C}/>
          <GuessBox label="Theme D" solved={!!colSolved.D} solvedText={cD.theme} disabled={!canGuess} onGuess={v=>doGuessCol("D",v)} color={CLR.D}/>
        </div>

        {/* LOG */}
        {log.length>0&&(
          <div style={{padding:"5px 10px",background:"#060606",borderRadius:6,border:"1px solid #0e0e0e"}}>
            {log.map((l,i)=><div key={i} style={{fontSize:9,color:i===0?"#aaa":"#2a2a2a",padding:"2px 0",borderBottom:i<log.length-1?"1px solid #0a0a0a":"none"}}>{l}</div>)}
          </div>
        )}
      </div>
    </div>
    <Footer/></div>
  );
}

/* ─── STYLES ───────────────────────────────────────────── */
const S = {
  root: { height:"100vh", display:"flex", flexDirection:"column", background:"#030305", fontFamily:"'Rajdhani','Oswald',sans-serif", color:"#fff", overflow:"hidden" },
  card: { width:"100%", maxWidth:500, background:"#080810", border:"1px solid #12121e", borderRadius:12, padding:"18px 14px", boxSizing:"border-box" },
  input: { width:"100%", background:"#0a0a14", border:"1px solid #1a1a2e", borderRadius:7, padding:"9px 12px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" },
  btn: { width:"100%", padding:"10px 0", background:"#0a0a0a", color:"#555", border:"1px solid #1a1a1a", borderRadius:7, fontFamily:"inherit", fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:2, transition:"all .2s" },
  bar: { display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", padding:"5px 8px", background:"#070710", borderBottom:"1px solid #0e0e0e", flexShrink:0 },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;600;700&display=swap');
  @keyframes pop  { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes shake{ 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 16px #a78bfa22} 50%{box-shadow:0 0 32px #a78bfa55} }
  @keyframes blink{ 0%,100%{opacity:1} 50%{opacity:.1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  * { box-sizing:border-box; }
  ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#060606} ::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:2px}
`;
