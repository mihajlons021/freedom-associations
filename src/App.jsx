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
  appId: "1:844172246267:web:a31b8cd6affe8337f7845e",
};
const FB = initializeApp(firebaseConfig);
const db = getDatabase(FB);
const auth = getAuth(FB);

const ESCROW = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS = [100, 500, 1000];
const T_TURN = 30;
const T_FINAL = 60;
const T_IDLE = 60;

// Player colors — P1=red, P2=blue
const PCLR = { p1:"#ef4444", p2:"#3b82f6" };
const GREEN = "#22c55e";

async function connectPhantom() {
  try {
    if (!window.solana?.isPhantom) { window.open("https://phantom.app/","_blank"); return null; }
    const r = await window.solana.connect();
    return r.publicKey.toString();
  } catch { return null; }
}
async function signWager(amount) {
  try {
    const msg = new TextEncoder().encode(`Wager ${amount} FREEDOM → ${ESCROW}`);
    await window.solana.signMessage(msg, "utf8");
    return { ok:true, tx:"SIG_"+Date.now() };
  } catch(e) { return { ok:false, err:e.message }; }
}

async function aiBoard() {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:1200,
        messages:[{ role:"user", content:
`Return ONLY a JSON object (no markdown) for an English word-association game:
{"columns":[
  {"id":"A","theme":"WORD","fields":[{"id":"A1","clue":"SHORT CLUE","answer":"WORD"},{"id":"A2","clue":"SHORT CLUE","answer":"WORD"},{"id":"A3","clue":"SHORT CLUE","answer":"WORD"},{"id":"A4","clue":"SHORT CLUE","answer":"WORD"}]},
  {"id":"B","theme":"WORD","fields":[{"id":"B1","clue":"SHORT CLUE","answer":"WORD"},{"id":"B2","clue":"SHORT CLUE","answer":"WORD"},{"id":"B3","clue":"SHORT CLUE","answer":"WORD"},{"id":"B4","clue":"SHORT CLUE","answer":"WORD"}]},
  {"id":"C","theme":"WORD","fields":[{"id":"C1","clue":"SHORT CLUE","answer":"WORD"},{"id":"C2","clue":"SHORT CLUE","answer":"WORD"},{"id":"C3","clue":"SHORT CLUE","answer":"WORD"},{"id":"C4","clue":"SHORT CLUE","answer":"WORD"}]},
  {"id":"D","theme":"WORD","fields":[{"id":"D1","clue":"SHORT CLUE","answer":"WORD"},{"id":"D2","clue":"SHORT CLUE","answer":"WORD"},{"id":"D3","clue":"SHORT CLUE","answer":"WORD"},{"id":"D4","clue":"SHORT CLUE","answer":"WORD"}]}
],"final":{"answer":"WORD","hint":"SHORT HINT"}}
All text UPPERCASE. 4 distinct themes. Clues 2-3 words. Single-word answers. Final connects all 4 themes.` }]
      })
    });
    const d = await res.json();
    return JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim());
  } catch { return DEMO; }
}

const DEMO = {
  columns:[
    {id:"A",theme:"ANIMALS",fields:[{id:"A1",clue:"KING OF JUNGLE",answer:"LION"},{id:"A2",clue:"STRIPED HORSE",answer:"ZEBRA"},{id:"A3",clue:"LONG NECK",answer:"GIRAFFE"},{id:"A4",clue:"TRUNK & IVORY",answer:"ELEPHANT"}]},
    {id:"B",theme:"INSTRUMENTS",fields:[{id:"B1",clue:"SIX STRINGS",answer:"GUITAR"},{id:"B2",clue:"88 KEYS",answer:"PIANO"},{id:"B3",clue:"HIT WITH STICKS",answer:"DRUM"},{id:"B4",clue:"BRASS & VALVES",answer:"TRUMPET"}]},
    {id:"C",theme:"SPORTS",fields:[{id:"C1",clue:"COURT & RACKET",answer:"TENNIS"},{id:"C2",clue:"SKATES & PUCK",answer:"HOCKEY"},{id:"C3",clue:"POOL & LANES",answer:"SWIMMING"},{id:"C4",clue:"EIGHT-SIDED CAGE",answer:"MMA"}]},
    {id:"D",theme:"FOOD",fields:[{id:"D1",clue:"ITALIAN FLATBREAD",answer:"PIZZA"},{id:"D2",clue:"JAPANESE ROLL",answer:"SUSHI"},{id:"D3",clue:"MEXICAN WRAP",answer:"BURRITO"},{id:"D4",clue:"LONG FRENCH BREAD",answer:"BAGUETTE"}]},
  ],
  final:{answer:"FREEDOM",hint:"PROJECT FREEDOM"}
};

const norm = s => s.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
const hit  = (a,b) => norm(a)===norm(b);
const uid6 = () => Math.random().toString(36).slice(2,8).toUpperCase();

/* ─── SKULL ─── */
const Skull = ({sz=40}) => (
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

const Header = () => (
  <div style={{width:"100%",background:"#050505",borderBottom:"2px solid #1a1a1a",padding:"8px 14px",
    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative",boxSizing:"border-box"}}>
    <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
      fontFamily:"'Black Ops One',cursive",fontSize:10,letterSpacing:1}}>
      <span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"#444"}}>.FUN</span>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <Skull sz={38}/>
      <div style={{textAlign:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
          <div style={{width:24,height:1,background:"#22c55e",opacity:.5}}/>
          <span style={{fontFamily:"'Black Ops One',cursive",fontSize:8,color:"#666",letterSpacing:5}}>PROJECT</span>
          <div style={{width:24,height:1,background:"#22c55e",opacity:.5}}/>
        </div>
        <div style={{fontFamily:"'Black Ops One',cursive",fontSize:22,color:"#22c55e",letterSpacing:5,textShadow:"0 0 20px #22c55e88",lineHeight:1}}>FREEDOM</div>
        <div style={{fontFamily:"'Black Ops One',cursive",fontSize:10,color:"#8b5cf6",letterSpacing:4,textShadow:"0 0 8px #8b5cf666",lineHeight:1}}>ASSOCIATIONS</div>
      </div>
      <Skull sz={38}/>
    </div>
  </div>
);

const Footer = () => (
  <div style={{width:"100%",background:"#050505",borderTop:"1px solid #111",padding:"5px",
    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    <span style={{fontFamily:"'Black Ops One',cursive",fontSize:11,letterSpacing:2}}>
      <span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"#444"}}>.FUN</span>
    </span>
  </div>
);

const TimerBar = ({secs,max,warn=10}) => {
  const hot = secs<=warn;
  return (
    <div style={{display:"flex",alignItems:"center",gap:5}}>
      <div style={{flex:1,height:5,background:"#111",borderRadius:3,overflow:"hidden"}}>
        <div style={{width:`${(secs/max)*100}%`,height:"100%",
          background:hot?"#ef4444":GREEN,transition:"width 1s linear",borderRadius:3}}/>
      </div>
      <span style={{fontFamily:"monospace",fontSize:12,minWidth:26,color:hot?"#ef4444":"#666",fontWeight:hot?700:400}}>{secs}s</span>
    </div>
  );
};

/* ════════════════════════════════════════════
   FIELD CELL
   - hidden: shows ID, green border, clickable
   - open: shows CLUE, bright green border
   - solved by p1: red bg
   - solved by p2: blue bg
════════════════════════════════════════════ */
function FieldCell({field, openedClue, solvedBy, canClick, onClick}) {
  const isSolved = !!solvedBy;
  const isOpen   = openedClue && !isSolved;

  let bg, border, cursor;
  if (isSolved) {
    bg     = solvedBy==="p1" ? "#ef444422" : "#3b82f622";
    border = solvedBy==="p1" ? "#ef4444" : "#3b82f6";
    cursor = "default";
  } else if (isOpen) {
    bg     = "#0d1a12";
    border = GREEN;
    cursor = "default";
  } else {
    bg     = canClick ? "#0a0f0a" : "#060606";
    border = GREEN;
    cursor = canClick ? "pointer" : "default";
  }

  return (
    <div
      onClick={canClick && !isSolved && !isOpen ? onClick : undefined}
      style={{
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: 6,
        padding: "8px 6px",
        minHeight: 72,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        cursor,
        transition: "all .15s",
        boxSizing: "border-box",
        boxShadow: isOpen ? `0 0 12px ${GREEN}66` : isSolved ? `0 0 8px ${border}44` : "none",
      }}
      onMouseEnter={e => { if(canClick&&!isSolved&&!isOpen) e.currentTarget.style.background="#0d1a0d"; }}
      onMouseLeave={e => { if(canClick&&!isSolved&&!isOpen) e.currentTarget.style.background=bg; }}
    >
      {isSolved ? (
        <>
          <div style={{fontSize:13,fontWeight:900,color:border,letterSpacing:1,lineHeight:1.2}}>{field.answer}</div>
          <div style={{fontSize:9,color:`${border}99`,marginTop:3,lineHeight:1.2}}>{field.clue}</div>
        </>
      ) : isOpen ? (
        <>
          <div style={{fontSize:9,color:"#22c55e88",marginBottom:3,letterSpacing:1}}>{field.id}</div>
          <div style={{fontSize:12,fontWeight:700,color:"#fff",lineHeight:1.3}}>{field.clue}</div>
        </>
      ) : (
        <div style={{fontSize:14,fontWeight:900,color:canClick?GREEN+"88":"#1e1e1e",letterSpacing:2}}>{field.id}</div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   GUESS INPUT
════════════════════════════════════════════ */
function GuessBox({label, solved, solvedText, solvedBy, disabled, onGuess, color}) {
  const [v,setV]=useState(""); const [bad,setBad]=useState(false);
  const inp=useRef();

  if (solved) {
    const clr = solvedBy==="p1" ? PCLR.p1 : solvedBy==="p2" ? PCLR.p2 : color;
    return (
      <div style={{background:`${clr}18`,border:`2px solid ${clr}`,borderRadius:8,
        padding:"8px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:60}}>
        <div style={{fontSize:9,color:`${clr}99`,letterSpacing:1,marginBottom:2}}>{label}</div>
        <div style={{fontSize:12,fontWeight:900,color:clr,letterSpacing:1}}>✓ {solvedText}</div>
      </div>
    );
  }

  const go = () => {
    if(!v.trim()||disabled) return;
    if(!onGuess(v)){setBad(true);setTimeout(()=>setBad(false),600);} else setV("");
  };

  return (
    <div style={{background:"#0a0a0a",border:`2px solid ${bad?"#ef4444":disabled?"#1a1a1a":color}`,
      borderRadius:8,padding:"6px 8px",minHeight:60,display:"flex",flexDirection:"column",
      justifyContent:"space-between",opacity:disabled?.3:1,animation:bad?"shake .4s":"none",
      transition:"opacity .2s,border-color .2s",boxSizing:"border-box"}}>
      <div style={{fontSize:8,color:disabled?"#333":color,letterSpacing:1,fontWeight:700,marginBottom:4}}>{label}</div>
      <div style={{display:"flex",gap:4}}>
        <input ref={inp} value={v} onChange={e=>setV(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==="Enter"&&go()} disabled={disabled}
          placeholder="TYPE ANSWER..." style={{flex:1,background:"transparent",border:"none",
          color:disabled?"#333":"#fff",fontSize:11,fontWeight:700,outline:"none",fontFamily:"inherit",
          minWidth:0,letterSpacing:1}}/>
        <button onClick={go} disabled={disabled} style={{background:disabled?"#1a1a1a":color,
          border:"none",borderRadius:5,padding:"4px 10px",color:disabled?"#333":"#fff",
          fontWeight:900,cursor:disabled?"default":"pointer",fontSize:10,flexShrink:0}}>OK</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   LEADERBOARD
════════════════════════════════════════════ */
function Leaderboard({onClose}) {
  const [tab,setTab]=useState("points");
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    get(ref(db,"leaderboard")).then(snap=>{
      const d=snap.val()||{};
      setRows(Object.values(d).filter(x=>x?.name));
      setLoading(false);
    });
  },[]);
  const sorted=[...rows].sort((a,b)=>{
    if(tab==="wins")   return (b.wins||0)-(a.wins||0);
    if(tab==="tokens") return (b.tokensWon||0)-(a.tokensWon||0);
    return (b.points||0)-(a.points||0);
  }).slice(0,10);
  const medals=["🥇","🥈","🥉"];
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
      <div style={{background:"#0a0a14",border:"2px solid #1a1a2e",borderRadius:14,padding:20,width:"92%",maxWidth:400}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:"#a78bfa",letterSpacing:3}}>LEADERBOARD</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#555",fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        <div style={{display:"flex",gap:3,marginBottom:12,background:"#070710",borderRadius:7,padding:3}}>
          {[["points","🏅 POINTS"],["wins","🏆 WINS"],["tokens","💰 TOKENS"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"6px 0",borderRadius:5,
              background:tab===k?"#8b5cf6":"transparent",color:tab===k?"#fff":"#444",
              border:"none",fontFamily:"inherit",fontSize:9,fontWeight:700,cursor:"pointer",letterSpacing:1}}>
              {l}
            </button>
          ))}
        </div>
        {loading ? <div style={{textAlign:"center",color:"#444",padding:20,fontSize:12}}>LOADING...</div> :
         sorted.length===0 ? <div style={{textAlign:"center",color:"#333",padding:20,fontSize:12}}>NO GAMES YET</div> :
         sorted.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
            background:i===0?"#8b5cf611":"#070710",borderRadius:7,marginBottom:4,
            border:`1px solid ${i===0?"#8b5cf633":"#111"}`}}>
            <span style={{fontSize:16,minWidth:26}}>{medals[i]||`${i+1}.`}</span>
            <span style={{flex:1,fontSize:12,color:"#ccc",fontWeight:700,letterSpacing:1}}>{r.name}</span>
            <span style={{fontWeight:900,fontSize:13,color:tab==="wins"?"#22c55e":tab==="tokens"?"#f4a261":"#a78bfa"}}>
              {tab==="points"?`${r.points||0} PTS`:tab==="wins"?`${r.wins||0} W`:`${r.tokensWon||0} 🪙`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const Loading = ({msg}) => (
  <div style={S.root}><style>{CSS}</style><Header/>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
      <div style={{width:44,height:44,border:"3px solid #8b5cf622",borderTop:"3px solid #8b5cf6",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{color:"#555",fontSize:11,letterSpacing:2}}>{msg}</div>
    </div>
  <Footer/></div>
);

/* ════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════ */
export default function App() {
  const [uid,setUid]=useState(null);
  const [screen,setScreen]=useState("lobby");
  const [name,setName]=useState("");
  const [wager,setWager]=useState(100);
  const [mode,setMode]=useState("create");
  const [roomIn,setRoomIn]=useState("");
  const [wallet,setWallet]=useState(null);
  const [wLoad,setWLoad]=useState(false);
  const [lMsg,setLMsg]=useState("");
  const [showLB,setShowLB]=useState(false);
  const [gameId,setGameId]=useState(null);
  const [myRole,setMyRole]=useState(null);
  const [gs,setGs]=useState(null);
  const [started,setStarted]=useState(false);
  const [tTurn,setTTurn]=useState(T_TURN);
  const [tFinal,setTFinal]=useState(T_FINAL);
  const [tIdle,setTIdle]=useState(T_IDLE);
  const [log,setLog]=useState([]);

  const rTurn=useRef(); const rFinal=useRef(); const rIdle=useRef();
  const lastAct=useRef(Date.now());
  const gRef=useRef(null);

  const addLog=m=>setLog(p=>[m,...p].slice(0,5));
  const touch=()=>{lastAct.current=Date.now();setTIdle(T_IDLE);};

  useEffect(()=>{signInAnonymously(auth).then(r=>setUid(r.user.uid)).catch(console.error);},[]);
  useEffect(()=>{if(window.solana?.isPhantom&&window.solana.publicKey) setWallet(window.solana.publicKey.toString());},[]);

  useEffect(()=>{
    if(!gameId) return;
    gRef.current=ref(db,`ag2/${gameId}`);
    const u=onValue(gRef.current,snap=>{
      const d=snap.val(); if(!d) return;
      setGs(d);
      if(d.status==="finished") setScreen("result");
      if(d.status==="active"&&d.p1&&d.p2&&!started){setStarted(true);lastAct.current=Date.now();}
    });
    return ()=>u();
  },[gameId,started]);

  useEffect(()=>{
    if(screen!=="game"||!started||!gs||gs.finalPhase||gs.status==="finished") return;
    clearInterval(rTurn.current); setTTurn(T_TURN);
    rTurn.current=setInterval(()=>setTTurn(t=>{
      if(t<=1){clearInterval(rTurn.current);if(gs.currentTurn===myRole) doPass();return T_TURN;}
      return t-1;
    }),1000);
    return ()=>clearInterval(rTurn.current);
  },[gs?.currentTurn,screen,gs?.finalPhase,started]);

  useEffect(()=>{
    if(!gs?.finalPhase||gs?.status==="finished") return;
    clearInterval(rFinal.current); setTFinal(T_FINAL);
    rFinal.current=setInterval(()=>setTFinal(t=>{
      if(t<=1){clearInterval(rFinal.current);const s=gs.scores||{p1:0,p2:0};doEnd(s.p1>=s.p2?"p1":"p2","TIME'S UP — WINNER BY POINTS!");return 0;}
      return t-1;
    }),1000);
    return ()=>clearInterval(rFinal.current);
  },[gs?.finalPhase,gs?.status]);

  useEffect(()=>{
    if(screen!=="game"||!started||gs?.status==="finished") return;
    clearInterval(rIdle.current);
    rIdle.current=setInterval(()=>{
      const rem=T_IDLE-Math.floor((Date.now()-lastAct.current)/1000);
      setTIdle(Math.max(0,rem));
      if(rem<=0){clearInterval(rIdle.current);doEnd(myRole==="p1"?"p2":"p1","IDLE 60S — OPPONENT WINS!");}
    },1000);
    return ()=>clearInterval(rIdle.current);
  },[screen,started,myRole,gs?.status]);

  useEffect(()=>{
    if(!gs||gs.finalPhase||gs.status==="finished") return;
    const b=gs.board; if(!b) return;
    const total=b.columns.reduce((s,c)=>s+c.fields.length,0);
    if(Object.keys(gs.solved||{}).length>=total&&gs.currentTurn===myRole){
      update(gRef.current,{finalPhase:true});
      addLog("🎯 ALL FIELDS OPEN! 60S FOR FINAL ANSWER!");
    }
  },[gs]);

  useEffect(()=>{
    if(screen!=="waiting"||!gameId) return;
    const u=onValue(ref(db,`ag2/${gameId}`),snap=>{
      const d=snap.val();
      if(d?.status==="active"&&d.p1&&d.p2){setGs(d);setStarted(true);lastAct.current=Date.now();setScreen("game");addLog("OPPONENT JOINED! YOUR TURN!");}
    });
    return ()=>u();
  },[screen,gameId]);

  const connectW=async()=>{setWLoad(true);const a=await connectPhantom();if(a)setWallet(a);setWLoad(false);};

  const doCreate=async()=>{
    if(!name.trim()||!uid||!wallet) return;
    setScreen("loading"); setLMsg("GENERATING BOARD...");
    const board=await aiBoard();
    setLMsg("CONFIRMING WAGER...");
    const tx=await signWager(wager);
    if(!tx.ok){alert("WAGER FAILED: "+tx.err);setScreen("lobby");return;}
    const gid=uid6();
    await set(ref(db,`ag2/${gid}`),{
      p1:uid,p1name:name,p1wallet:wallet,
      p2:null,p2name:null,p2wallet:null,
      status:"waiting",wager,board,
      scores:{p1:0,p2:0},
      solved:{},      // fieldId → "p1" or "p2"
      colSolved:{A:null,B:null,C:null,D:null}, // null or "p1"/"p2"
      finalSolved:null,
      finalPhase:false,
      currentTurn:"p1",
      openedField:null,
      lastActivity:Date.now(),
      winner:null,p1tx:tx.tx
    });
    setGameId(gid);setMyRole("p1");setStarted(false);setScreen("waiting");
  };

  const doJoin=async()=>{
    const gid=roomIn.trim().toUpperCase();
    if(!name.trim()||!uid||!wallet||!gid) return;
    setScreen("loading"); setLMsg("CONFIRMING WAGER...");
    const tx=await signWager(wager);
    if(!tx.ok){alert("WAGER FAILED: "+tx.err);setScreen("lobby");return;}
    setLMsg("JOINING ROOM...");
    const snap=await get(ref(db,`ag2/${gid}`));
    const d=snap.val();
    if(!d){alert("ROOM NOT FOUND!");setScreen("lobby");return;}
    if(d.status!=="waiting"){alert("ROOM ALREADY STARTED!");setScreen("lobby");return;}
    await update(ref(db,`ag2/${gid}`),{p2:uid,p2name:name,p2wallet:wallet,status:"active",currentTurn:"p1",lastActivity:Date.now(),p2tx:tx.tx});
    setWager(d.wager);setGameId(gid);setMyRole("p2");setStarted(true);lastAct.current=Date.now();
    setScreen("game");addLog("JOINED! YOU ARE PLAYER 2.");
  };

  const doReveal=async(fieldId)=>{
    if(!isMy||gs?.openedField||gs?.finalPhase||gs?.solved?.[fieldId]) return;
    touch();
    await update(gRef.current,{openedField:fieldId,lastActivity:Date.now()});
    addLog(`FIELD ${fieldId} REVEALED — GUESS THE THEME OR FINAL!`);
  };

  const doGuessCol=async(colId,val)=>{
    touch();
    const col=gs.board.columns.find(c=>c.id===colId);
    if(!col||gs.colSolved?.[colId]) return false;
    if(hit(val,col.theme)){
      const upd={[`colSolved/${colId}`]:myRole,[`scores/${myRole}`]:(gs.scores[myRole]||0)+20,lastActivity:Date.now()};
      col.fields.forEach(f=>{upd[`solved/${f.id}`]=myRole;});
      await update(gRef.current,upd);
      addLog(`✅ COLUMN ${colId}: "${col.theme}"! +20PTS`);
      setTimeout(()=>doPass(),500);
      return true;
    }
    addLog(`❌ WRONG THEME FOR COLUMN ${colId}`);
    return false;
  };

  const doGuessFinal=async(val)=>{
    touch();
    if(hit(val,gs.board.final.answer)){
      await update(gRef.current,{finalSolved:myRole,[`scores/${myRole}`]:(gs.scores[myRole]||0)+30,lastActivity:Date.now()});
      doEnd(myRole,"FINAL ANSWER CORRECT! +30PTS");
      return true;
    }
    addLog("❌ WRONG FINAL ANSWER!");
    return false;
  };

  const doPass=async()=>{
    const next=myRole==="p1"?"p2":"p1";
    await update(gRef.current,{currentTurn:next,openedField:null,lastActivity:Date.now()});
  };

  const doEnd=async(w,reason)=>{
    if(!gRef.current) return;
    await update(gRef.current,{status:"finished",winner:w,winReason:reason,finishedAt:Date.now()});
    doLB(w);
  };

  const doLB=async(w)=>{
    if(!gs) return;
    const sc=gs.scores||{p1:0,p2:0};
    for(const r of["p1","p2"]){
      const u=gs[r]; if(!u) continue;
      const lb=ref(db,`leaderboard/${u}`);
      const snap=await get(lb);
      const cur=snap.val()||{wins:0,losses:0,points:0,tokensWon:0};
      await set(lb,{name:r==="p1"?gs.p1name:gs.p2name,wins:(cur.wins||0)+(w===r?1:0),losses:(cur.losses||0)+(w===r?0:1),points:(cur.points||0)+(sc[r]||0),tokensWon:(cur.tokensWon||0)+(w===r?wager*2:0)});
    }
  };

  const doReset=()=>{setScreen("lobby");setGameId(null);setMyRole(null);setGs(null);setLog([]);setRoomIn("");setStarted(false);};

  const board=gs?.board||null;
  const isMy=gs?.currentTurn===myRole;
  const scores=gs?.scores||{p1:0,p2:0};
  const solved=gs?.solved||{};
  const colSolved=gs?.colSolved||{};
  const finalSolved=gs?.finalSolved||null;
  const finalPhase=gs?.finalPhase||false;
  const winner=gs?.winner||null;
  const winReason=gs?.winReason||"";
  const myName=myRole==="p1"?gs?.p1name||"P1":gs?.p2name||"P2";
  const oppName=myRole==="p1"?gs?.p2name||"P2":gs?.p1name||"P1";

  // can click: my turn, no field open, not final phase, game active
  const canClick=isMy&&!gs?.openedField&&!finalPhase&&!winner&&gs?.status==="active"&&started;
  // can guess: my turn, field opened OR final phase
  const canGuess=isMy&&(!!gs?.openedField||finalPhase)&&!winner&&gs?.status==="active"&&started;

  /* ── LOBBY ── */
  if(screen==="lobby") return (
    <div style={S.root}><style>{CSS}</style><Header/>
    {showLB&&<Leaderboard onClose={()=>setShowLB(false)}/>}
    <div style={{flex:1,overflowY:"auto",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:12}}>
      <div style={S.card}>
        <div style={{marginBottom:12,padding:12,background:"#060606",borderRadius:8,border:"1px solid #1a1a1a"}}>
          <div style={{fontSize:8,color:"#444",letterSpacing:2,marginBottom:6}}>PHANTOM WALLET</div>
          {wallet?(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:GREEN,boxShadow:`0 0 8px ${GREEN}`}}/>
              <span style={{fontSize:10,color:GREEN,fontFamily:"monospace"}}>{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
              <span style={{fontSize:9,color:"#444",marginLeft:"auto"}}>✓ CONNECTED</span>
            </div>
          ):(
            <button onClick={connectW} disabled={wLoad} style={{...S.btn,background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",color:"#fff",boxShadow:"0 0 14px #8b5cf644"}}>
              {wLoad?"CONNECTING...":"🔗 CONNECT PHANTOM WALLET"}
            </button>
          )}
        </div>
        <input value={name} onChange={e=>setName(e.target.value.toUpperCase())} placeholder="YOUR NAME" style={S.input} maxLength={16}/>
        <div style={{marginTop:12}}>
          <div style={{fontSize:8,color:"#444",letterSpacing:2,marginBottom:6}}>WAGER — FREEDOM TOKENS</div>
          <div style={{display:"flex",gap:6}}>
            {WAGERS.map(w=><button key={w} onClick={()=>setWager(w)} style={{flex:1,padding:"8px 0",borderRadius:6,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",background:wager===w?"#8b5cf6":"#0e0e0e",color:wager===w?"#fff":"#8b5cf6",border:`1px solid ${wager===w?"#8b5cf6":"#222"}`,boxShadow:wager===w?"0 0 14px #8b5cf633":"none"}}>{w}</button>)}
          </div>
        </div>
        <div style={{marginTop:12,display:"flex",borderRadius:7,overflow:"hidden",border:"1px solid #1a1a1a"}}>
          {[["create","🎮 CREATE ROOM"],["join","🚪 JOIN ROOM"]].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"9px 0",fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer",background:mode===m?"#8b5cf6":"#0a0a0a",color:mode===m?"#fff":"#555",border:"none",letterSpacing:1}}>{l}</button>
          ))}
        </div>
        {mode==="create"&&(
          <button onClick={doCreate} disabled={!name.trim()||!uid||!wallet} style={{...S.btn,marginTop:10,background:name.trim()&&wallet?"linear-gradient(90deg,#8b5cf6,#7c3aed)":"#1a1a1a",color:name.trim()&&wallet?"#fff":"#444",boxShadow:name.trim()&&wallet?"0 0 18px #8b5cf633":"none"}}>
            🎮 CREATE ROOM
          </button>
        )}
        {mode==="join"&&(
          <div style={{marginTop:10}}>
            <div style={{fontSize:8,color:"#444",letterSpacing:2,marginBottom:6}}>ROOM ID</div>
            <input value={roomIn} onChange={e=>setRoomIn(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123"
              style={{...S.input,textAlign:"center",letterSpacing:8,fontFamily:"'Black Ops One',cursive",fontSize:20,color:GREEN}}/>
            <button onClick={doJoin} disabled={!name.trim()||!uid||!wallet||roomIn.length<6} style={{...S.btn,marginTop:8,background:roomIn.length===6&&name.trim()&&wallet?"linear-gradient(90deg,#22c55e,#16a34a)":"#1a1a1a",color:roomIn.length===6&&name.trim()&&wallet?"#000":"#444"}}>
              🚪 JOIN ROOM
            </button>
          </div>
        )}
        <button onClick={()=>setShowLB(true)} style={{...S.btn,marginTop:10,background:"#0a0a14",color:"#a78bfa",border:"1px solid #a78bfa33"}}>
          🏆 LEADERBOARD
        </button>
        <div style={{marginTop:12,padding:12,background:"#060606",borderRadius:8,border:"1px solid #111"}}>
          <div style={{color:"#22c55e",fontSize:8,fontWeight:700,letterSpacing:2,marginBottom:8}}>HOW TO PLAY</div>
          {[["1.","Click ONE field — the clue appears inside it"],["2.","Type the COLUMN THEME or FINAL ANSWER in the boxes below"],["3.","Correct column theme → all 4 fields turn YOUR COLOR (+20pts)"],["4.","Correct final answer → instant win (+30pts)"],["5.","30s per turn · 60s idle = auto loss · P1=🔴 P2=🔵"]].map(([n,t],i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:4}}>
              <span style={{fontSize:8,color:"#22c55e",fontWeight:700,minWidth:14}}>{n}</span>
              <span style={{fontSize:8,color:"#555",lineHeight:1.5}}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <Footer/></div>
  );

  if(screen==="loading") return <Loading msg={lMsg}/>;

  if(screen==="waiting") return (
    <div style={S.root}><style>{CSS}</style><Header/>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:20}}>
      <div style={{width:52,height:52,border:`3px solid ${GREEN}22`,borderTop:`3px solid ${GREEN}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{fontFamily:"'Black Ops One',cursive",fontSize:14,color:GREEN,letterSpacing:3}}>WAITING FOR OPPONENT</div>
      <div style={{fontSize:11,color:"#444"}}>WAGER: <b style={{color:"#a78bfa"}}>{wager}</b> FREEDOM TOKENS</div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:9,color:"#555",marginBottom:8,letterSpacing:2}}>SHARE THIS ROOM ID:</div>
        <div style={{fontSize:40,fontFamily:"'Black Ops One',cursive",color:GREEN,letterSpacing:8,padding:"14px 28px",background:"#0a1a0f",border:`2px solid ${GREEN}44`,borderRadius:10,textShadow:`0 0 20px ${GREEN}88`}}>{gameId}</div>
      </div>
      <button onClick={()=>{set(ref(db,`ag2/${gameId}`),null);setScreen("lobby");setGameId(null);setMyRole(null);}} style={{...S.btn,maxWidth:160,padding:"8px 0",fontSize:10}}>CANCEL</button>
    </div>
    <Footer/></div>
  );

  if(screen==="result"||winner) return (
    <div style={S.root}><style>{CSS}</style><Header/>
    {showLB&&<Leaderboard onClose={()=>setShowLB(false)}/>}
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{...S.card,textAlign:"center",maxWidth:340}}>
        <div style={{fontSize:56,lineHeight:1}}>{winner===myRole?"🏆":"💀"}</div>
        <div style={{fontFamily:"'Black Ops One',cursive",fontSize:22,letterSpacing:3,marginTop:8,color:winner===myRole?GREEN:"#ef4444",textShadow:`0 0 20px ${winner===myRole?GREEN:"#ef4444"}88`}}>
          {winner===myRole?"YOU WIN!":"YOU LOSE"}
        </div>
        <div style={{color:"#555",fontSize:11,marginTop:6,marginBottom:20}}>{winReason}</div>
        <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:20}}>
          {["p1","p2"].map(r=>(
            <div key={r} style={{padding:"12px 24px",borderRadius:10,background:r===winner?`${GREEN}0a`:"#0a0a0a",border:`2px solid ${r===winner?GREEN:"#1a1a1a"}`}}>
              <div style={{fontSize:9,color:"#444"}}>{r===myRole?myName:oppName}</div>
              <div style={{fontSize:30,fontWeight:900,color:r===winner?GREEN:"#fff"}}>{scores[r]||0}</div>
              <div style={{fontSize:9,color:"#333"}}>PTS</div>
            </div>
          ))}
        </div>
        {winner===myRole&&<div style={{color:"#a78bfa",fontSize:12,marginBottom:14,padding:"8px",background:"#a78bfa0a",borderRadius:6,border:"1px solid #a78bfa33"}}>🎉 WINNINGS: <b>{wager*2}</b> FREEDOM TOKENS</div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={doReset} style={{...S.btn,flex:1,background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",color:"#fff"}}>NEW GAME</button>
          <button onClick={()=>setShowLB(true)} style={{...S.btn,flex:1,background:"#0a0a14",color:"#a78bfa",border:"1px solid #a78bfa33"}}>🏆 LB</button>
        </div>
      </div>
    </div>
    <Footer/></div>
  );

  if(!board) return <Loading msg="LOADING GAME..."/>;

  /* ════════════════════════════════════════════
     GAME BOARD
     
     X-shape layout (like RTS):
     
     COL A (left side, top):    A1 A2 A3 A4  (row, left of center)
     COL B (left side, bottom): B1 B2 B3 B4  (row, left of center)
     COL C (right side, bottom):C1 C2 C3 C4  (row, right of center)
     COL D (right side, top):   D1 D2 D3 D4  (row, right of center)
     CENTER: ??? (final answer box)
     
     Visual:
     [A HDR]──────────────[D HDR]
     [A1][A2][A3][A4] [???] [D1][D2][D3][D4]
     [B1][B2][B3][B4] [   ] [C1][C2][C3][C4]
     [B HDR]──────────────[C HDR]
     
     Guess boxes: [Theme A][Theme B][FINAL][Theme C][Theme D]
  ════════════════════════════════════════════ */
  const [cA,cB,cC,cD]=board.columns;

  const ColGrid=({col,reversed=false})=>{
    const fields=reversed?[...col.fields].reverse():col.fields;
    return (
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,flex:1,minWidth:0}}>
        {fields.map(f=>(
          <FieldCell key={f.id} field={f}
            openedClue={gs?.openedField===f.id ? f.clue : null}
            solvedBy={solved[f.id]||null}
            canClick={canClick&&!solved[f.id]&&gs?.openedField!==f.id}
            onClick={()=>doReveal(f.id)}
          />
        ))}
      </div>
    );
  };

  const ColHdr=({col,pos="top"})=>(
    <div style={{textAlign:"center",padding:"3px 0",[pos==="top"?"borderBottom":"borderTop"]:`3px solid ${GREEN}`,marginBottom:pos==="top"?4:0,marginTop:pos==="top"?0:4}}>
      <span style={{fontFamily:"'Black Ops One',cursive",fontSize:18,color:GREEN,letterSpacing:3,textShadow:`0 0 10px ${GREEN}66`}}>{col.id}</span>
    </div>
  );

  const FinalCenter=()=>(
    <div style={{width:80,flexShrink:0,display:"flex",alignItems:"stretch"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        background:finalPhase?"#0d1a12":"#050508",
        border:`2px solid ${finalPhase?GREEN:"#1a1a1a"}`,
        borderRadius:8,padding:8,textAlign:"center",
        animation:finalPhase?"glowPulse 2s infinite":"none",
        boxSizing:"border-box",minHeight:150}}>
        <div style={{fontSize:7,color:"#444",letterSpacing:1,marginBottom:4}}>FINAL</div>
        {finalSolved?(
          <div style={{fontSize:11,fontWeight:900,color:finalSolved==="p1"?PCLR.p1:PCLR.p2,letterSpacing:1}}>{board.final.answer}</div>
        ):(
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:18,color:"#1a2a1a"}}>???</div>
        )}
        <div style={{fontSize:7,color:"#2a2a2a",marginTop:4,lineHeight:1.3}}>{board.final.hint}</div>
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
          <div key={r} style={{padding:"3px 10px",borderRadius:14,
            background:gs?.currentTurn===r?`${PCLR[r]}22`:"#0a0a0a",
            border:`2px solid ${gs?.currentTurn===r?PCLR[r]:"#1a1a1a"}`,
            fontSize:10,color:r===myRole?PCLR[r]:"#555",
            fontWeight:gs?.currentTurn===r?700:400,whiteSpace:"nowrap"}}>
            {r===myRole?myName:oppName} <b style={{color:gs?.currentTurn===r?"#fff":"inherit"}}>{scores[r]||0}</b>
          </div>
        ))}
      </div>
      <div style={{width:100}}>
        {finalPhase?<TimerBar secs={tFinal} max={T_FINAL} warn={15}/>:<TimerBar secs={tTurn} max={T_TURN} warn={8}/>}
      </div>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:1,whiteSpace:"nowrap",color:finalPhase?"#f59e0b":isMy?GREEN:"#ef4444"}}>
        {finalPhase?"🎯 FINAL":isMy?"⚡ YOUR TURN":"⏳ WAIT"}
      </div>
      {tIdle<20&&started&&<div style={{fontSize:8,color:"#ef4444",animation:"blink 1s infinite"}}>IDLE {tIdle}s</div>}
      <button onClick={()=>setShowLB(true)} style={{padding:"2px 8px",borderRadius:4,background:"#0a0a14",color:"#a78bfa",border:"1px solid #a78bfa33",fontFamily:"inherit",fontSize:8,cursor:"pointer"}}>🏆</button>
      {isMy&&!finalPhase&&!winner&&started&&(
        <button onClick={()=>{touch();doPass();addLog("TURN PASSED.");}} style={{padding:"2px 8px",borderRadius:4,background:"#111",color:"#444",border:"1px solid #1a1a1a",fontFamily:"inherit",fontSize:8,cursor:"pointer"}}>PASS</button>
      )}
    </div>

    {/* HINT */}
    <div style={{fontSize:9,textAlign:"center",padding:"3px 0",borderBottom:"1px solid #0a0a0a",background:"#050505",
      color:canClick?GREEN:canGuess?"#a78bfa":isMy?"#333":"#1a1a1a",letterSpacing:1,fontWeight:700}}>
      {!started?"⏳ WAITING FOR OPPONENT...":
       finalPhase?"🎯 GUESS COLUMN THEME OR FINAL ANSWER BELOW!":
       isMy?canClick?"👆 CLICK A FIELD TO REVEAL ITS CLUE":
            gs?.openedField?"✏️ NOW GUESS THE THEME OR FINAL ANSWER":"WAIT FOR NEXT TURN...":
       "⏳ WAITING FOR OPPONENT..."}
    </div>

    <div style={{flex:1,overflowY:"auto",padding:"6px"}}>
      <div style={{maxWidth:860,margin:"0 auto"}}>

        {/* TOP HEADERS: A (left) + D (right) */}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <div style={{flex:1}}><ColHdr col={cA} pos="top"/></div>
          <div style={{width:80}}/>
          <div style={{flex:1}}><ColHdr col={cD} pos="top"/></div>
        </div>

        {/* MAIN ROWS with FINAL in center */}
        <div style={{display:"flex",gap:8,alignItems:"stretch",marginBottom:2}}>
          {/* LEFT: A top, B bottom */}
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
            <ColGrid col={cA}/>
            <ColGrid col={cB}/>
          </div>

          {/* CENTER: FINAL spans both rows */}
          <FinalCenter/>

          {/* RIGHT: D top, C bottom */}
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
            <ColGrid col={cD} reversed={true}/>
            <ColGrid col={cC} reversed={true}/>
          </div>
        </div>

        {/* BOTTOM HEADERS: B (left) + C (right) */}
        <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
          <div style={{flex:1}}><ColHdr col={cB} pos="bottom"/></div>
          <div style={{width:80}}/>
          <div style={{flex:1}}><ColHdr col={cC} pos="bottom"/></div>
        </div>

        {/* GUESS BOXES */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 1fr 1fr",gap:5,marginTop:8,marginBottom:6}}>
          <GuessBox label="THEME A" solved={!!colSolved.A} solvedText={cA.theme} solvedBy={colSolved.A} disabled={!canGuess} onGuess={v=>doGuessCol("A",v)} color={GREEN}/>
          <GuessBox label="THEME B" solved={!!colSolved.B} solvedText={cB.theme} solvedBy={colSolved.B} disabled={!canGuess} onGuess={v=>doGuessCol("B",v)} color={GREEN}/>
          <GuessBox label="FINAL" solved={!!finalSolved} solvedText={board.final.answer} solvedBy={finalSolved} disabled={!canGuess} onGuess={doGuessFinal} color="#a78bfa"/>
          <GuessBox label="THEME C" solved={!!colSolved.C} solvedText={cC.theme} solvedBy={colSolved.C} disabled={!canGuess} onGuess={v=>doGuessCol("C",v)} color={GREEN}/>
          <GuessBox label="THEME D" solved={!!colSolved.D} solvedText={cD.theme} solvedBy={colSolved.D} disabled={!canGuess} onGuess={v=>doGuessCol("D",v)} color={GREEN}/>
        </div>

        {/* LOG */}
        {log.length>0&&(
          <div style={{padding:"5px 10px",background:"#060606",borderRadius:6,border:"1px solid #0e0e0e"}}>
            {log.map((l,i)=><div key={i} style={{fontSize:9,color:i===0?"#aaa":"#2a2a2a",padding:"2px 0",letterSpacing:.5}}>{l}</div>)}
          </div>
        )}
      </div>
    </div>
    <Footer/></div>
  );
}

const S={
  root:{height:"100vh",display:"flex",flexDirection:"column",background:"#030305",fontFamily:"'Rajdhani','Oswald',sans-serif",color:"#fff",overflow:"hidden"},
  card:{width:"100%",maxWidth:500,background:"#080810",border:"1px solid #12121e",borderRadius:12,padding:"16px 14px",boxSizing:"border-box"},
  input:{width:"100%",background:"#0a0a14",border:`1px solid #1a1a2e`,borderRadius:7,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",letterSpacing:1},
  btn:{width:"100%",padding:"10px 0",background:"#0a0a0a",color:"#555",border:"1px solid #1a1a1a",borderRadius:7,fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:2,transition:"all .2s"},
  bar:{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",padding:"5px 8px",background:"#070710",borderBottom:"1px solid #0e0e0e",flexShrink:0},
};

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;600;700&display=swap');
  @keyframes pop   { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 16px #22c55e22} 50%{box-shadow:0 0 32px #22c55e66} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.1} }
  @keyframes spin  { to{transform:rotate(360deg)} }
  * { box-sizing:border-box; }
  ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#060606} ::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:2px}
`;
