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
const fbApp = initializeApp(firebaseConfig);
const db = getDatabase(fbApp);
const auth = getAuth(fbApp);

const ESCROW = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS = [100, 500, 1000];
const TURN_SEC = 30;
const IDLE_SEC = 60;

// Colors per column
const COL_COLOR = { A:"#e63946", B:"#f4a261", C:"#2a9d8f", D:"#457b9d" };

async function connectPhantom() {
  try {
    if (!window.solana?.isPhantom) { window.open("https://phantom.app/","_blank"); return null; }
    const r = await window.solana.connect();
    return r.publicKey.toString();
  } catch { return null; }
}
async function signWager(amount) {
  try {
    if (!window.solana?.isPhantom) return { ok:false, err:"No Phantom" };
    await window.solana.signMessage(new TextEncoder().encode(`Wager ${amount} FREEDOM to ${ESCROW}`),"utf8");
    return { ok:true, id:"SIG_"+Date.now() };
  } catch(e) { return { ok:false, err:e.message }; }
}

async function makeBoard() {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1200,
        messages:[{role:"user",content:`Make a word association board in English. Return ONLY raw JSON, no markdown.
{"columns":[
{"id":"A","theme":"THEME","fields":[{"id":"A1","clue":"clue","answer":"ANSWER"},{"id":"A2","clue":"clue","answer":"ANSWER"},{"id":"A3","clue":"clue","answer":"ANSWER"},{"id":"A4","clue":"clue","answer":"ANSWER"}]},
{"id":"B","theme":"THEME","fields":[{"id":"B1","clue":"clue","answer":"ANSWER"},{"id":"B2","clue":"clue","answer":"ANSWER"},{"id":"B3","clue":"clue","answer":"ANSWER"},{"id":"B4","clue":"clue","answer":"ANSWER"}]},
{"id":"C","theme":"THEME","fields":[{"id":"C1","clue":"clue","answer":"ANSWER"},{"id":"C2","clue":"clue","answer":"ANSWER"},{"id":"C3","clue":"clue","answer":"ANSWER"},{"id":"C4","clue":"clue","answer":"ANSWER"}]},
{"id":"D","theme":"THEME","fields":[{"id":"D1","clue":"clue","answer":"ANSWER"},{"id":"D2","clue":"clue","answer":"ANSWER"},{"id":"D3","clue":"clue","answer":"ANSWER"},{"id":"D4","clue":"clue","answer":"ANSWER"}]}],
"final":{"answer":"ANSWER","hint":"hint"}}
Rules: 4 different themes, English clues 1-3 words, single CAPS answers, final is supercategory of all 4.`}]
      })
    });
    const d = await r.json();
    return JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim());
  } catch { return FB; }
}

const FB = {
  columns:[
    {id:"A",theme:"ANIMALS",fields:[{id:"A1",clue:"King of jungle",answer:"LION"},{id:"A2",clue:"Black & white stripes",answer:"ZEBRA"},{id:"A3",clue:"Longest neck",answer:"GIRAFFE"},{id:"A4",clue:"Trunk & tusks",answer:"ELEPHANT"}]},
    {id:"B",theme:"INSTRUMENTS",fields:[{id:"B1",clue:"6 strings",answer:"GUITAR"},{id:"B2",clue:"88 keys",answer:"PIANO"},{id:"B3",clue:"You hit it",answer:"DRUM"},{id:"B4",clue:"Brass wind",answer:"TRUMPET"}]},
    {id:"C",theme:"SPORTS",fields:[{id:"C1",clue:"Court & net",answer:"TENNIS"},{id:"C2",clue:"Ice & skates",answer:"HOCKEY"},{id:"C3",clue:"Pool & cap",answer:"SWIMMING"},{id:"C4",clue:"The octagon",answer:"MMA"}]},
    {id:"D",theme:"FOOD",fields:[{id:"D1",clue:"Italian pie",answer:"PIZZA"},{id:"D2",clue:"Japanese roll",answer:"SUSHI"},{id:"D3",clue:"Mexican wrap",answer:"BURRITO"},{id:"D4",clue:"French bread",answer:"BAGUETTE"}]},
  ],
  final:{answer:"FREEDOM",hint:"Project Freedom"}
};

function nrm(s){ return s.trim().toUpperCase().replace(/[^A-Z0-9]/g,""); }
function hit(a,b){ return nrm(a)===nrm(b); }
function gid(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }

/* ── SKULL ── */
function Skull({sz=36}){
  return(
    <svg width={sz} height={sz} viewBox="0 0 64 64" fill="none">
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

/* ── HEADER ── */
function Header(){
  return(
    <div style={{width:"100%",background:"#050505",borderBottom:"2px solid #111",padding:"8px 16px",
      display:"flex",alignItems:"center",justifyContent:"center",
      boxSizing:"border-box",flexShrink:0,position:"relative"}}>
      <div style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",textAlign:"right"}}>
        <div style={{fontSize:7,color:"#2a2a2a",letterSpacing:2}}>POWERED BY</div>
        <span style={{fontFamily:"'Black Ops One',cursive",fontSize:10,letterSpacing:2}}>
          <span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"#333"}}>.FUN</span>
        </span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <Skull sz={40}/>
        <div style={{textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
            <div style={{width:28,height:1,background:"#22c55e",opacity:.5}}/>
            <div style={{fontFamily:"'Black Ops One',cursive",fontSize:9,color:"#777",letterSpacing:5,lineHeight:1}}>PROJECT</div>
            <div style={{width:28,height:1,background:"#22c55e",opacity:.5}}/>
          </div>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:26,color:"#22c55e",letterSpacing:5,lineHeight:1.1,textShadow:"0 0 20px #22c55e99"}}>FREEDOM</div>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:11,color:"#8b5cf6",letterSpacing:5,lineHeight:1,textShadow:"0 0 10px #8b5cf677"}}>ASSOCIATIONS</div>
        </div>
        <Skull sz={40}/>
      </div>
    </div>
  );
}

/* ── FOOTER ── */
function Footer(){
  return(
    <div style={{width:"100%",background:"#050505",borderTop:"1px solid #111",padding:"5px",
      display:"flex",alignItems:"center",justifyContent:"center",boxSizing:"border-box",flexShrink:0}}>
      <span style={{fontFamily:"'Black Ops One',cursive",fontSize:12,letterSpacing:2}}>
        <span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"#444"}}>.FUN</span>
      </span>
    </div>
  );
}

/* ── TIMER BAR ── */
function TBar({secs,max,warn=8}){
  const pct=(secs/max)*100, hot=secs<=warn;
  return(
    <div style={{display:"flex",alignItems:"center",gap:5}}>
      <div style={{flex:1,height:5,background:"#111",borderRadius:3,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:hot?"#ef4444":"#22c55e",transition:"width 1s linear",borderRadius:3}}/>
      </div>
      <span style={{fontFamily:"monospace",fontSize:12,minWidth:26,color:hot?"#ef4444":"#555",fontWeight:hot?700:400}}>{secs}s</span>
    </div>
  );
}

/* ════════════════════════════════════════════════
   FIELD ROW — one row of 4 fields, 3:1 ratio each
   Layout for left side:  [A4][A3][A2][A1]
   Layout for right side: [B1][B2][B3][B4]
════════════════════════════════════════════════ */
function FieldRow({ fields, revealed, canOpen, colId, onOpen, reversed }) {
  const arr = reversed ? [...fields].reverse() : fields;
  const cc = COL_COLOR[colId];
  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${fields.length},1fr)`, gap:4 }}>
      {arr.map(f => {
        const st = !revealed[f.id] ? "hidden" : revealed[f.id]==="solved" ? "solved" : "clue";
        return (
          <FieldCell key={f.id} field={f} state={st} canOpen={canOpen && st==="hidden"} color={cc} onOpen={onOpen}/>
        );
      })}
    </div>
  );
}

/* ── FIELD CELL: 3:1 ratio (width >> height) ── */
function FieldCell({ field, state, canOpen, color, onOpen }) {
  // 3:1 ratio = height is ~33% of width. We use a fixed height approach.
  const base = {
    height:52, width:"100%", borderRadius:6,
    display:"flex", alignItems:"center", justifyContent:"center",
    flexDirection:"column", gap:1,
    boxSizing:"border-box", userSelect:"none",
    transition:"all .15s", overflow:"hidden",
    cursor: canOpen ? "pointer" : "default",
  };

  if (state==="solved") return (
    <div style={{...base, background:"#111", border:`2px solid ${color}88`, animation:"pop .3s ease"}}>
      <div style={{fontSize:10,fontWeight:900,color:color,letterSpacing:.5,textAlign:"center",padding:"0 3px"}}>{field.answer}</div>
      <div style={{fontSize:7,color:"#555",textAlign:"center",padding:"0 2px",lineHeight:1.1}}>{field.clue}</div>
    </div>
  );

  if (state==="clue") return (
    <div style={{...base, background:"#0d0d20", border:`2px solid ${color}`, boxShadow:`0 0 10px ${color}44`}}>
      <div style={{fontSize:7,color:color,fontWeight:700,letterSpacing:.5}}>CLUE</div>
      <div style={{fontSize:10,color:"#fff",textAlign:"center",fontWeight:600,padding:"0 3px",lineHeight:1.2}}>{field.clue}</div>
    </div>
  );

  // hidden
  return (
    <div
      onClick={canOpen ? ()=>onOpen(field.id) : undefined}
      style={{...base, background:canOpen?"#0e0e1a":"#07070f", border:`1px solid ${canOpen?color+"55":"#1a1a1a"}`}}
      onMouseEnter={e=>{ if(canOpen){e.currentTarget.style.background="#14142a";e.currentTarget.style.borderColor=color+"99";e.currentTarget.style.boxShadow=`0 0 8px ${color}33`;}}}
      onMouseLeave={e=>{ if(canOpen){e.currentTarget.style.background="#0e0e1a";e.currentTarget.style.borderColor=color+"55";e.currentTarget.style.boxShadow="none";}}}
    >
      <div style={{fontSize:11,fontWeight:900,color:canOpen?"#555":"#1f1f1f",letterSpacing:.5}}>{field.id}</div>
    </div>
  );
}

/* ── COLUMN GUESS INPUT (between fields and final) ── */
function ColGuess({ colId, solved, theme, disabled, onGuess }) {
  const [v,setV] = useState("");
  const [err,setErr] = useState(false);
  const cc = COL_COLOR[colId];

  if (solved) return (
    <div style={{...cgi, background:cc+"22", border:`1px solid ${cc}`, justifyContent:"center"}}>
      <span style={{color:cc,fontWeight:700,fontSize:11,letterSpacing:.5}}>✓ {theme}</span>
    </div>
  );

  const sub = () => {
    if (!v.trim()||disabled) return;
    if (!onGuess(v)) { setErr(true); setTimeout(()=>setErr(false),600); }
    else setV("");
  };

  return (
    <div style={{...cgi, animation:err?"shake .4s":"none", opacity:disabled?.2:1}}>
      <input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sub()} disabled={disabled}
        placeholder={`${colId} theme`}
        style={{flex:1,background:"transparent",border:"none",color:disabled?"#333":"#ddd",fontSize:11,outline:"none",fontFamily:"inherit",minWidth:0,textAlign:"center"}}/>
      <button onClick={sub} disabled={disabled}
        style={{background:disabled?"#222":cc,border:"none",borderRadius:4,padding:"4px 10px",color:disabled?"#444":"#fff",fontWeight:700,cursor:disabled?"default":"pointer",fontSize:10,flexShrink:0}}>
        OK
      </button>
    </div>
  );
}
const cgi={display:"flex",alignItems:"center",gap:6,background:"#0d0d0d",border:"1px solid #222",borderRadius:6,padding:"5px 8px",width:"100%",boxSizing:"border-box",height:34};

/* ── FINAL GUESS INPUT ── */
function FinalGuess({ solved, answer, disabled, onGuess }) {
  const [v,setV] = useState("");
  const [err,setErr] = useState(false);
  if (solved) return (
    <div style={{...fgi, background:"#22c55e22", border:"1px solid #22c55e", justifyContent:"center"}}>
      <span style={{color:"#22c55e",fontWeight:700,fontSize:12,letterSpacing:1}}>✓ {answer}</span>
    </div>
  );
  const sub = () => {
    if (!v.trim()||disabled) return;
    if (!onGuess(v)){setErr(true);setTimeout(()=>setErr(false),600);}
    else setV("");
  };
  return (
    <div style={{...fgi, animation:err?"shake .4s":"none", opacity:disabled?.2:1}}>
      <input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sub()} disabled={disabled}
        placeholder="FINAL ANSWER"
        style={{flex:1,background:"transparent",border:"none",color:disabled?"#333":"#fff",fontSize:12,outline:"none",fontFamily:"inherit",minWidth:0,textAlign:"center",fontWeight:700,letterSpacing:1}}/>
      <button onClick={sub} disabled={disabled}
        style={{background:disabled?"#222":"#a78bfa",border:"none",borderRadius:4,padding:"5px 12px",color:disabled?"#444":"#fff",fontWeight:700,cursor:disabled?"default":"pointer",fontSize:11,flexShrink:0}}>
        OK
      </button>
    </div>
  );
}
const fgi={display:"flex",alignItems:"center",gap:6,background:"#0d0d12",border:"1px solid #2a2a3a",borderRadius:7,padding:"6px 10px",width:"100%",boxSizing:"border-box",height:40};

function Spin({msg}){
  return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
        <div style={{width:48,height:48,border:"3px solid #8b5cf622",borderTop:"3px solid #8b5cf6",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{color:"#555",fontSize:12,letterSpacing:2}}>{msg}</div>
      </div>
    <Footer/></div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════════════════ */
export default function App(){
  const [uid,setUid]=useState(null);
  const [scr,setScr]=useState("lobby");
  const [nm,setNm]=useState("");
  const [wager,setWager]=useState(100);
  const [mode,setMode]=useState("create");
  const [jin,setJin]=useState("");
  const [jerr,setJerr]=useState("");
  const [wallet,setWallet]=useState(null);
  const [wload,setWload]=useState(false);
  const [ldmsg,setLdmsg]=useState("");
  const [roomId,setRoomId]=useState(null);
  const [myRole,setMyRole]=useState(null);
  const [gs,setGs]=useState(null);
  const [started,setStarted]=useState(false);
  const [ttimer,setTtimer]=useState(TURN_SEC);
  const [itimer,setItimer]=useState(IDLE_SEC);
  const [didOpen,setDidOpen]=useState(false); // opened a field this turn
  const [log,setLog]=useState([]);

  const tRef=useRef(); const iRef=useRef();
  const lastAct=useRef(Date.now());
  const rRef=useRef(null); // Firebase ref to game

  const L=m=>setLog(p=>[m,...p].slice(0,5));
  const touch=()=>{ lastAct.current=Date.now(); setItimer(IDLE_SEC); };

  // Firebase auth
  useEffect(()=>{ signInAnonymously(auth).then(r=>setUid(r.user.uid)).catch(console.error); },[]);
  // Auto-connect Phantom if available
  useEffect(()=>{ if(window.solana?.isPhantom&&window.solana.publicKey) setWallet(window.solana.publicKey.toString()); },[]);

  // Listen to game changes
  useEffect(()=>{
    if(!roomId) return;
    rRef.current=ref(db,`games/${roomId}`);
    const unsub=onValue(rRef.current,snap=>{
      const d=snap.val(); if(!d) return;
      setGs(d);
      if(d.status==="finished") setScr("result");
      if(d.status==="active"&&d.p1&&d.p2&&!started){
        setStarted(true); lastAct.current=Date.now();
      }
    });
    return()=>unsub();
  },[roomId,started]);

  // Turn timer — 30s, my turn only, not in final phase
  useEffect(()=>{
    if(scr!=="game"||!started||!gs) return;
    if(gs.status==="finished"||gs.finalPhase||gs.currentTurn!==myRole) return;
    clearInterval(tRef.current); setTtimer(TURN_SEC);
    tRef.current=setInterval(()=>{
      setTtimer(t=>{
        if(t<=1){ clearInterval(tRef.current); autoReveal(); return TURN_SEC; }
        return t-1;
      });
    },1000);
    return()=>clearInterval(tRef.current);
  },[gs?.currentTurn,gs?.finalPhase,scr,started]);

  // Idle timer — final phase only, 60s
  useEffect(()=>{
    if(!gs?.finalPhase||gs?.status==="finished"||!started) return;
    clearInterval(iRef.current);
    iRef.current=setInterval(()=>{
      const rem=IDLE_SEC-Math.floor((Date.now()-lastAct.current)/1000);
      setItimer(Math.max(0,rem));
      if(rem<=0&&gs.currentTurn===myRole){
        clearInterval(iRef.current);
        doEnd(myRole==="p1"?"p2":"p1","Idle 60s — opponent wins!");
      }
    },1000);
    return()=>clearInterval(iRef.current);
  },[gs?.finalPhase,gs?.status,gs?.currentTurn,myRole,started]);

  // Detect all fields revealed → final phase
  useEffect(()=>{
    if(!gs||gs.finalPhase||gs.status==="finished"||!gs.board) return;
    const total=gs.board.columns.reduce((s,c)=>s+c.fields.length,0);
    if(Object.keys(gs.revealed||{}).length>=total){
      update(rRef.current,{finalPhase:true});
      L("🎯 All fields open! Guess final answer!");
    }
  },[gs?.revealed]);

  // Wait for P2
  useEffect(()=>{
    if(scr!=="waiting"||!roomId) return;
    const unsub=onValue(ref(db,`games/${roomId}`),snap=>{
      const d=snap.val();
      if(d?.status==="active"&&d.p1&&d.p2){
        setGs(d); setStarted(true); lastAct.current=Date.now();
        setScr("game"); L("Opponent joined! Your turn!");
      }
    });
    return()=>unsub();
  },[scr,roomId]);

  async function doWallet(){
    setWload(true);
    const a=await connectPhantom(); if(a) setWallet(a);
    setWload(false);
  }

  async function doCreate(){
    if(!nm.trim()||!uid) return;
    if(!wallet){alert("Connect Phantom first!");return;}
    setScr("loading"); setLdmsg("Generating board...");
    const board=await makeBoard();
    setLdmsg("Confirming wager...");
    const tx=await signWager(wager);
    if(!tx.ok){alert("Wager failed: "+tx.err);setScr("lobby");return;}
    setLdmsg("Creating room...");
    const id=gid();
    await set(ref(db,`games/${id}`),{
      p1:uid,p1name:nm,p1wallet:wallet,
      p2:null,p2name:null,p2wallet:null,
      status:"waiting",wager,board,
      scores:{p1:0,p2:0},revealed:{},
      colSolved:{A:false,B:false,C:false,D:false},
      finalSolved:false,finalPhase:false,
      currentTurn:"p1",lastActivity:Date.now(),winner:null,p1tx:tx.id
    });
    setRoomId(id); setMyRole("p1"); setStarted(false); setScr("waiting");
  }

  async function doJoin(){
    const id=jin.trim().toUpperCase();
    if(!nm.trim()||!uid||id.length<6) return;
    if(!wallet){alert("Connect Phantom first!");return;}
    setJerr(""); setScr("loading"); setLdmsg("Looking for room "+id+"...");
    try{
      const snap=await get(ref(db,`games/${id}`));
      if(!snap.exists()){ setJerr("Room "+id+" not found!"); setScr("lobby"); return; }
      const d=snap.val();
      if(d.status!=="waiting"){ setJerr("Room "+id+" already started!"); setScr("lobby"); return; }
      if(d.p1===uid){ setJerr("You can't join your own room!"); setScr("lobby"); return; }
      setLdmsg("Confirming wager...");
      const tx=await signWager(d.wager);
      if(!tx.ok){alert("Wager failed: "+tx.err);setScr("lobby");return;}
      await update(ref(db,`games/${id}`),{
        p2:uid,p2name:nm,p2wallet:wallet,
        status:"active",currentTurn:"p1",lastActivity:Date.now(),p2tx:tx.id
      });
      setWager(d.wager); setRoomId(id); setMyRole("p2");
      setStarted(true); lastAct.current=Date.now();
      setScr("game"); L("Joined! You are P2. P1 goes first.");
    }catch(e){
      setJerr("Error: "+e.message); setScr("lobby");
    }
  }

  async function doOpen(fid){
    if(!isMy||didOpen||gs?.finalPhase||!started) return;
    touch(); setDidOpen(true);
    await update(rRef.current,{[`revealed/${fid}`]:"clue",lastActivity:Date.now()});
    L("Field "+fid+" opened!");
  }

  async function autoReveal(){
    if(!gs?.board||!rRef.current) return;
    const all=gs.board.columns.flatMap(c=>c.fields);
    const hidden=all.filter(f=>!gs.revealed?.[f.id]);
    if(!hidden.length){ await update(rRef.current,{finalPhase:true}); return; }
    const pick=hidden[Math.floor(Math.random()*hidden.length)];
    await update(rRef.current,{[`revealed/${pick.id}`]:"clue",lastActivity:Date.now()});
    L("⏱ Time up! "+pick.id+" auto-revealed.");
    await doPass();
  }

  async function doGuessCol(cid,val){
    touch();
    const col=gs.board.columns.find(c=>c.id===cid);
    if(!col||gs.colSolved?.[cid]) return false;
    if(hit(val,col.theme)){
      const upd={}; col.fields.forEach(f=>{upd[`revealed/${f.id}`]="solved";});
      upd[`colSolved/${cid}`]=myRole;
      upd[`scores/${myRole}`]=(gs.scores?.[myRole]||0)+20;
      upd.lastActivity=Date.now();
      await update(rRef.current,upd);
      L("✅ Column "+cid+': "'+col.theme+'" +20pts!');
      return true; // keep turn
    }
    L("❌ Wrong theme for "+cid+". Opponent's turn!");
    await doPass(); return false;
  }

  async function doGuessFinal(val){
    touch();
    if(hit(val,gs.board.final.answer)){
      await update(rRef.current,{finalSolved:myRole,[`scores/${myRole}`]:(gs.scores?.[myRole]||0)+30,lastActivity:Date.now()});
      doEnd(myRole,"Final answer correct! +30pts 🎉"); return true;
    }
    L("❌ Wrong final. Opponent's turn!"); await doPass(); return false;
  }

  async function doPass(){
    clearInterval(tRef.current);
    setDidOpen(false);
    await update(rRef.current,{currentTurn:myRole==="p1"?"p2":"p1",lastActivity:Date.now()});
  }

  async function doEnd(w,reason){
    clearInterval(tRef.current); clearInterval(iRef.current);
    if(!rRef.current) return;
    await update(rRef.current,{status:"finished",winner:w,winReason:reason,finishedAt:Date.now()});
    if(!gs) return;
    const sc=gs.scores||{p1:0,p2:0};
    for(const r of["p1","p2"]){
      const u=gs[r]; if(!u) continue;
      const lb=ref(db,`leaderboard/${u}`);
      const sn=await get(lb); const cv=sn.val()||{wins:0,losses:0,points:0,tokensWon:0};
      await set(lb,{name:r==="p1"?gs.p1name:gs.p2name,wins:(cv.wins||0)+(w===r?1:0),losses:(cv.losses||0)+(w===r?0:1),points:(cv.points||0)+(sc[r]||0),tokensWon:(cv.tokensWon||0)+(w===r?wager*2:0)});
    }
  }

  function doReset(){
    setScr("lobby");setRoomId(null);setMyRole(null);setGs(null);
    setDidOpen(false);setLog([]);setJin("");setJerr("");setStarted(false);
  }

  const board=gs?.board||null;
  const isMy=gs?.currentTurn===myRole;
  const scores=gs?.scores||{p1:0,p2:0};
  const revealed=gs?.revealed||{};
  const colSolved=gs?.colSolved||{};
  const finalSolved=gs?.finalSolved||false;
  const finalPhase=gs?.finalPhase||false;
  const winner=gs?.winner||null;
  const winReason=gs?.winReason||"";
  const myNm=myRole==="p1"?gs?.p1name||"P1":gs?.p2name||"P2";
  const opNm=myRole==="p1"?gs?.p2name||"P2":gs?.p1name||"P1";
  const canOpen=isMy&&!didOpen&&!finalPhase&&!winner&&gs?.status==="active"&&started;
  const canGuess=isMy&&(didOpen||finalPhase)&&!winner&&gs?.status==="active"&&started;

  /* ── LOBBY ── */
  if(scr==="lobby") return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,overflowY:"auto",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"12px"}}>
        <div style={S.card}>
          {/* wallet */}
          <div style={{marginBottom:12,padding:10,background:"#060606",borderRadius:8,border:"1px solid #1a1a1a"}}>
            <div style={{fontSize:8,color:"#444",letterSpacing:2,marginBottom:7}}>PHANTOM WALLET</div>
            {wallet?(
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e"}}/>
                <span style={{fontSize:10,color:"#22c55e",fontFamily:"monospace"}}>{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
                <span style={{fontSize:9,color:"#444",marginLeft:"auto"}}>✓ Connected</span>
              </div>
            ):(
              <button onClick={doWallet} disabled={wload} style={{width:"100%",padding:"8px 0",background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",border:"none",borderRadius:6,color:"#fff",fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1}}>
                {wload?"CONNECTING...":"🔗 CONNECT PHANTOM WALLET"}
              </button>
            )}
          </div>
          <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="Your name / username" style={S.inp} maxLength={16}/>
          <div style={{marginTop:11}}>
            <div style={{fontSize:8,color:"#444",letterSpacing:2,marginBottom:5}}>WAGER — FREEDOM TOKENS</div>
            <div style={{display:"flex",gap:6}}>
              {WAGERS.map(w=><button key={w} onClick={()=>setWager(w)} style={{flex:1,padding:"8px 0",borderRadius:6,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",background:wager===w?"#8b5cf6":"#0e0e0e",color:wager===w?"#fff":"#8b5cf6",border:`1px solid ${wager===w?"#8b5cf6":"#2a2a2a"}`}}>{w}</button>)}
            </div>
          </div>
          <div style={{marginTop:12,display:"flex",borderRadius:7,overflow:"hidden",border:"1px solid #1a1a1a"}}>
            {[["create","🎮 CREATE"],["join","🚪 JOIN"]].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setJerr("");}} style={{flex:1,padding:"9px 0",fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer",background:mode===m?"#8b5cf6":"#0a0a0a",color:mode===m?"#fff":"#555",border:"none",letterSpacing:1}}>{l}</button>
            ))}
          </div>
          {mode==="create"&&(
            <button onClick={doCreate} disabled={!nm.trim()||!uid||!wallet} style={{...S.btn,marginTop:10,background:nm.trim()&&wallet?"linear-gradient(90deg,#8b5cf6,#7c3aed)":"#1a1a1a",color:nm.trim()&&wallet?"#fff":"#444"}}>
              🎮 CREATE ROOM
            </button>
          )}
          {mode==="join"&&(
            <div style={{marginTop:10}}>
              <div style={{fontSize:8,color:"#444",letterSpacing:2,marginBottom:5}}>ROOM ID (6 characters)</div>
              <input value={jin} onChange={e=>{setJin(e.target.value.toUpperCase());setJerr("");}} maxLength={6} placeholder="ABC123"
                style={{...S.inp,textAlign:"center",letterSpacing:10,fontFamily:"'Black Ops One',cursive",fontSize:22,color:"#22c55e",boxShadow:jin.length===6?"0 0 14px #22c55e33":"none"}}/>
              {jerr&&<div style={{marginTop:5,padding:"7px 9px",background:"#ef444411",border:"1px solid #ef444433",borderRadius:5,fontSize:10,color:"#ef4444"}}>⚠ {jerr}</div>}
              <button onClick={doJoin} disabled={!nm.trim()||!uid||!wallet||jin.length<6} style={{...S.btn,marginTop:8,background:jin.length===6&&nm.trim()&&wallet?"linear-gradient(90deg,#22c55e,#16a34a)":"#1a1a1a",color:jin.length===6&&nm.trim()&&wallet?"#000":"#444"}}>
                🚪 JOIN ROOM
              </button>
            </div>
          )}
          <div style={{marginTop:12,padding:10,background:"#060606",borderRadius:8,border:"1px solid #111"}}>
            <div style={{color:"#8b5cf6",fontSize:8,fontWeight:700,letterSpacing:2,marginBottom:7}}>RULES</div>
            {[["30s/turn","Timer starts when both join. Open 1 field per turn."],
              ["Guessing","Correct guess = keep your turn. Wrong = opponent's turn."],
              ["Time up","30s expire = random field auto-reveals, turn passes."],
              ["Final","All fields open: 60s idle = opponent wins."],
              ["Points","Column theme +20 · Final +30"]].map(([t,d],i)=>(
              <div key={i} style={{display:"flex",gap:7,marginBottom:4}}>
                <span style={{fontSize:8,color:"#8b5cf6",fontWeight:700,whiteSpace:"nowrap",minWidth:55}}>{t}</span>
                <span style={{fontSize:9,color:"#444",lineHeight:1.4}}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    <Footer/></div>
  );

  if(scr==="loading") return <Spin msg={ldmsg}/>;

  /* ── WAITING ── */
  if(scr==="waiting") return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:20}}>
        <div style={{width:52,height:52,border:"3px solid #22c55e22",borderTop:"3px solid #22c55e",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{fontFamily:"'Black Ops One',cursive",fontSize:13,color:"#22c55e",letterSpacing:3}}>WAITING FOR OPPONENT</div>
        <div style={{fontSize:11,color:"#444"}}>Wager: <b style={{color:"#a78bfa"}}>{wager}</b> FREEDOM tokens</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:11,color:"#555",marginBottom:8}}>SHARE THIS ROOM ID:</div>
          <div style={{fontSize:40,fontFamily:"'Black Ops One',cursive",color:"#22c55e",letterSpacing:10,padding:"14px 30px",background:"#0a1a0f",border:"2px solid #22c55e55",borderRadius:12,textShadow:"0 0 24px #22c55eaa"}}>{roomId}</div>
          <div style={{fontSize:9,color:"#333",marginTop:8}}>Opponent goes to JOIN ROOM and enters this code</div>
        </div>
        <button onClick={()=>{set(ref(db,`games/${roomId}`),null);setScr("lobby");setRoomId(null);setMyRole(null);setStarted(false);}} style={{...S.btn,maxWidth:160,padding:"8px 0",fontSize:10}}>CANCEL</button>
      </div>
    <Footer/></div>
  );

  /* ── RESULT ── */
  if(scr==="result"||winner) return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{...S.card,textAlign:"center",maxWidth:320}}>
          <div style={{fontSize:52}}>{winner===myRole?"🏆":"💀"}</div>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:22,letterSpacing:3,marginTop:7,color:winner===myRole?"#22c55e":"#ef4444"}}>{winner===myRole?"YOU WIN!":"YOU LOSE"}</div>
          <div style={{color:"#555",fontSize:11,marginTop:5,marginBottom:18}}>{winReason}</div>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:18}}>
            {["p1","p2"].map(r=>(
              <div key={r} style={{padding:"11px 22px",borderRadius:10,background:r===winner?"#22c55e0a":"#0a0a0a",border:`2px solid ${r===winner?"#22c55e":"#1a1a1a"}`}}>
                <div style={{fontSize:9,color:"#444"}}>{r===myRole?myNm:opNm}</div>
                <div style={{fontSize:28,fontWeight:900,color:r===winner?"#22c55e":"#fff"}}>{scores[r]||0}</div>
                <div style={{fontSize:9,color:"#333"}}>pts</div>
              </div>
            ))}
          </div>
          {winner===myRole&&<div style={{color:"#a78bfa",fontSize:12,marginBottom:12}}>🎉 Winnings: <b>{wager*2}</b> FREEDOM tokens</div>}
          <button onClick={doReset} style={{...S.btn,background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",color:"#fff"}}>NEW GAME</button>
        </div>
      </div>
    <Footer/></div>
  );

  if(!board) return <Spin msg="Loading..."/>;

  const [colA,colB,colC,colD]=board.columns;

  /* ════════════════════════════════════════════════════════
     BOARD LAYOUT — matches RTS TV show:

     TOP ROW:
     [A4][A3][A2][A1]  [Col A theme input]  [  ???  ]  [Col B theme input]  [B1][B2][B3][B4]

     BOTTOM ROW:
     [C4][C3][C2][C1]  [Col C theme input]  [  ???  ]  [Col D theme input]  [D1][D2][D3][D4]

     Col headers above/below each column group.
     Final answer input below the ??? box.
  ════════════════════════════════════════════════════════ */

  return(
    <div style={S.root}><style>{CSS}</style><Header/>

      {/* STATUS BAR */}
      <div style={S.sbar}>
        <div style={{display:"flex",gap:5,alignItems:"center",flex:1}}>
          {["p1","p2"].map(r=>(
            <div key={r} style={{padding:"3px 11px",borderRadius:14,background:gs?.currentTurn===r?"#8b5cf618":"#0a0a0a",border:`1px solid ${gs?.currentTurn===r?"#8b5cf6":"#1a1a1a"}`,fontSize:11,color:r===myRole?"#a78bfa":"#555",fontWeight:gs?.currentTurn===r?700:400,whiteSpace:"nowrap"}}>
              {r===myRole?myNm:opNm} <b style={{color:gs?.currentTurn===r?"#fff":"inherit"}}>{scores[r]||0}</b>
            </div>
          ))}
        </div>
        {started&&!finalPhase&&isMy&&<div style={{width:110}}><TBar secs={ttimer} max={TURN_SEC} warn={8}/></div>}
        {started&&finalPhase&&isMy&&<div style={{width:110}}><TBar secs={itimer} max={IDLE_SEC} warn={15}/></div>}
        {started&&!isMy&&<div style={{fontSize:10,color:"#333"}}>opponent's turn</div>}
        <div style={{fontSize:10,fontWeight:700,color:finalPhase?"#f59e0b":isMy?"#22c55e":"#ef4444",whiteSpace:"nowrap"}}>
          {!started?"⏳":finalPhase?"🎯 FINAL":isMy?"⚡ YOUR TURN":"⏳ WAIT"}
        </div>
        {isMy&&!finalPhase&&didOpen&&started&&(
          <button onClick={()=>{touch();doPass();L("Turn passed.");}} style={{padding:"3px 9px",borderRadius:5,background:"#111",color:"#555",border:"1px solid #1a1a1a",fontFamily:"inherit",fontSize:8,cursor:"pointer"}}>PASS</button>
        )}
      </div>

      {/* HINT */}
      <div style={{fontSize:9,textAlign:"center",padding:"3px 0",background:"#050505",borderBottom:"1px solid #0a0a0a",color:"#333"}}>
        {!started?"⏳ Waiting for opponent...":finalPhase?(isMy?"🎯 Guess themes or final answer!":"⏳ Opponent guessing..."):isMy?(canOpen?"👆 Click a field to reveal its clue":canGuess?"💡 Guess a column theme or the final answer":"..."):"⏳ Opponent's turn..."}
      </div>

      {/* BOARD */}
      <div style={{flex:1,overflowY:"auto",overflowX:"auto",padding:"8px 6px"}}>
        <div style={{maxWidth:980,margin:"0 auto",minWidth:560}}>

          {/* ══ TOP ROW: A (left) + Final center + B (right) ══ */}
          <div style={{marginBottom:14}}>
            {/* Column headers */}
            <div style={{display:"flex",gap:6,marginBottom:4,alignItems:"center"}}>
              <div style={{flex:4,textAlign:"center"}}>
                <span style={{fontFamily:"'Black Ops One',cursive",fontSize:20,color:COL_COLOR.A,letterSpacing:3,textShadow:`0 0 10px ${COL_COLOR.A}77`}}>A</span>
              </div>
              <div style={{width:120}}/>
              <div style={{width:100}}/>
              <div style={{width:120}}/>
              <div style={{flex:4,textAlign:"center"}}>
                <span style={{fontFamily:"'Black Ops One',cursive",fontSize:20,color:COL_COLOR.B,letterSpacing:3,textShadow:`0 0 10px ${COL_COLOR.B}77`}}>B</span>
              </div>
            </div>

            {/* Fields row */}
            <div style={{display:"flex",gap:6,alignItems:"stretch"}}>
              {/* Col A — reversed: A4 A3 A2 A1 */}
              <div style={{flex:4,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                {[...colA.fields].reverse().map(f=>{
                  const st=!revealed[f.id]?"hidden":revealed[f.id]==="solved"?"solved":"clue";
                  return <FieldCell key={f.id} field={f} state={st} canOpen={canOpen&&st==="hidden"} color={COL_COLOR.A} onOpen={doOpen}/>;
                })}
              </div>

              {/* Col A theme guess */}
              <div style={{width:120,display:"flex",alignItems:"center"}}>
                <ColGuess colId="A" solved={!!colSolved.A} theme={colA.theme} disabled={!canGuess} onGuess={v=>doGuessCol("A",v)}/>
              </div>

              {/* FINAL CENTER */}
              <div style={{width:100,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4,padding:"6px 4px",
                background:finalPhase?"#a78bfa0a":"#050508",
                border:`2px solid ${finalPhase?"#a78bfa66":"#12121e"}`,
                borderRadius:10, animation:finalPhase?"glowPulse 2s infinite":"none",
                textAlign:"center",flexShrink:0
              }}>
                <div style={{fontSize:7,color:"#333",letterSpacing:1}}>FINAL</div>
                {finalSolved
                  ?<div style={{fontSize:11,fontWeight:900,color:"#22c55e"}}>{board.final.answer}</div>
                  :<div style={{fontSize:22,color:"#1a1a2e",fontWeight:900,fontFamily:"'Black Ops One',cursive",lineHeight:1}}>???</div>
                }
                <div style={{fontSize:7,color:"#1a1a2e"}}>{board.final.hint}</div>
              </div>

              {/* Col B theme guess */}
              <div style={{width:120,display:"flex",alignItems:"center"}}>
                <ColGuess colId="B" solved={!!colSolved.B} theme={colB.theme} disabled={!canGuess} onGuess={v=>doGuessCol("B",v)}/>
              </div>

              {/* Col B — B1 B2 B3 B4 */}
              <div style={{flex:4,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                {colB.fields.map(f=>{
                  const st=!revealed[f.id]?"hidden":revealed[f.id]==="solved"?"solved":"clue";
                  return <FieldCell key={f.id} field={f} state={st} canOpen={canOpen&&st==="hidden"} color={COL_COLOR.B} onOpen={doOpen}/>;
                })}
              </div>
            </div>
          </div>

          {/* ══ BOTTOM ROW: C (left) + Final center + D (right) ══ */}
          <div style={{marginBottom:10}}>
            {/* Column headers */}
            <div style={{display:"flex",gap:6,marginBottom:4,alignItems:"center"}}>
              <div style={{flex:4,textAlign:"center"}}>
                <span style={{fontFamily:"'Black Ops One',cursive",fontSize:20,color:COL_COLOR.C,letterSpacing:3,textShadow:`0 0 10px ${COL_COLOR.C}77`}}>C</span>
              </div>
              <div style={{width:120}}/>
              <div style={{width:100}}/>
              <div style={{width:120}}/>
              <div style={{flex:4,textAlign:"center"}}>
                <span style={{fontFamily:"'Black Ops One',cursive",fontSize:20,color:COL_COLOR.D,letterSpacing:3,textShadow:`0 0 10px ${COL_COLOR.D}77`}}>D</span>
              </div>
            </div>

            {/* Fields row */}
            <div style={{display:"flex",gap:6,alignItems:"stretch"}}>
              {/* Col C reversed: C4 C3 C2 C1 */}
              <div style={{flex:4,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                {[...colC.fields].reverse().map(f=>{
                  const st=!revealed[f.id]?"hidden":revealed[f.id]==="solved"?"solved":"clue";
                  return <FieldCell key={f.id} field={f} state={st} canOpen={canOpen&&st==="hidden"} color={COL_COLOR.C} onOpen={doOpen}/>;
                })}
              </div>

              {/* Col C theme guess */}
              <div style={{width:120,display:"flex",alignItems:"center"}}>
                <ColGuess colId="C" solved={!!colSolved.C} theme={colC.theme} disabled={!canGuess} onGuess={v=>doGuessCol("C",v)}/>
              </div>

              {/* FINAL CENTER bottom — just spacer to align */}
              <div style={{width:100,flexShrink:0}}/>

              {/* Col D theme guess */}
              <div style={{width:120,display:"flex",alignItems:"center"}}>
                <ColGuess colId="D" solved={!!colSolved.D} theme={colD.theme} disabled={!canGuess} onGuess={v=>doGuessCol("D",v)}/>
              </div>

              {/* Col D — D1 D2 D3 D4 */}
              <div style={{flex:4,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                {colD.fields.map(f=>{
                  const st=!revealed[f.id]?"hidden":revealed[f.id]==="solved"?"solved":"clue";
                  return <FieldCell key={f.id} field={f} state={st} canOpen={canOpen&&st==="hidden"} color={COL_COLOR.D} onOpen={doOpen}/>;
                })}
              </div>
            </div>
          </div>

          {/* FINAL ANSWER INPUT */}
          <div style={{padding:"0 6px",marginBottom:8}}>
            <FinalGuess solved={!!finalSolved} answer={board.final.answer} disabled={!canGuess} onGuess={doGuessFinal}/>
          </div>

          {/* LOG */}
          {log.length>0&&(
            <div style={{padding:"5px 10px",background:"#060606",borderRadius:6,border:"1px solid #0e0e0e"}}>
              {log.map((l,i)=><div key={i} style={{fontSize:9,color:i===0?"#aaa":"#2a2a2a",padding:"2px 0"}}>{l}</div>)}
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </div>
  );
}

const S={
  root:{height:"100vh",display:"flex",flexDirection:"column",background:"#030305",fontFamily:"'Rajdhani','Oswald',sans-serif",color:"#fff",overflow:"hidden"},
  card:{width:"100%",maxWidth:480,background:"#080810",border:"1px solid #12121e",borderRadius:12,padding:"16px 14px",boxSizing:"border-box"},
  inp:{width:"100%",background:"#0a0a14",border:"1px solid #1a1a2e",borderRadius:7,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
  btn:{width:"100%",padding:"10px 0",background:"#0a0a0a",color:"#555",border:"1px solid #1a1a1a",borderRadius:7,fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:2,transition:"all .2s"},
  sbar:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",padding:"5px 10px",background:"#070710",borderBottom:"1px solid #0e0e0e",flexShrink:0},
};

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;600;700&display=swap');
  @keyframes pop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 20px #a78bfa22}50%{box-shadow:0 0 40px #a78bfa55}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#060606}::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:2px}
`;
