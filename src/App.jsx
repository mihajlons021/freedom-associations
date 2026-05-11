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

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

const ESCROW = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS = [100, 500, 1000];
const TURN_TIME = 30;
const FINAL_TIME = 60;
const IDLE_TIME = 60;

/* ── Board layout (X-shape like RTS):
   LEFT SIDE:          RIGHT SIDE:
   A1  A2  A3  A4      D4  D3  D2  D1
   B1  B2  B3  B4      C4  C3  C2  C1
   [theme A] [theme B] [theme C] [theme D]
   
   CENTER: FINAL ANSWER (???)
   
   Visual X:
   A1 A2 A3 A4 | ??? | D4 D3 D2 D1
   B1 B2 B3 B4 |     | C4 C3 C2 C1
*/

async function generateBoard() {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [{ role: "user", content: `Generate a word association game board in English. Return ONLY valid JSON, no markdown.
{
  "columns": [
    {"id":"A","theme":"THEME_A","fields":[{"id":"A1","clue":"clue","answer":"ANSWER"},{"id":"A2","clue":"clue","answer":"ANSWER"},{"id":"A3","clue":"clue","answer":"ANSWER"},{"id":"A4","clue":"clue","answer":"ANSWER"}]},
    {"id":"B","theme":"THEME_B","fields":[{"id":"B1","clue":"clue","answer":"ANSWER"},{"id":"B2","clue":"clue","answer":"ANSWER"},{"id":"B3","clue":"clue","answer":"ANSWER"},{"id":"B4","clue":"clue","answer":"ANSWER"}]},
    {"id":"C","theme":"THEME_C","fields":[{"id":"C1","clue":"clue","answer":"ANSWER"},{"id":"C2","clue":"clue","answer":"ANSWER"},{"id":"C3","clue":"clue","answer":"ANSWER"},{"id":"C4","clue":"clue","answer":"ANSWER"}]},
    {"id":"D","theme":"THEME_D","fields":[{"id":"D1","clue":"clue","answer":"ANSWER"},{"id":"D2","clue":"clue","answer":"ANSWER"},{"id":"D3","clue":"clue","answer":"ANSWER"},{"id":"D4","clue":"clue","answer":"ANSWER"}]}
  ],
  "final":{"answer":"FINAL","hint":"hint text"}
}
Rules: 4 different themes, short English clues (1-3 words), single-word CAPS answers, final answer connects all 4 themes.` }]
      })
    });
    const data = await r.json();
    return JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim());
  } catch(e) {
    return FALLBACK;
  }
}

const FALLBACK = {
  columns:[
    {id:"A",theme:"ANIMALS",fields:[{id:"A1",clue:"King of jungle",answer:"LION"},{id:"A2",clue:"Black & white stripes",answer:"ZEBRA"},{id:"A3",clue:"Longest neck",answer:"GIRAFFE"},{id:"A4",clue:"Trunk & tusks",answer:"ELEPHANT"}]},
    {id:"B",theme:"INSTRUMENTS",fields:[{id:"B1",clue:"6 strings",answer:"GUITAR"},{id:"B2",clue:"88 keys",answer:"PIANO"},{id:"B3",clue:"You hit it",answer:"DRUM"},{id:"B4",clue:"Brass wind",answer:"TRUMPET"}]},
    {id:"C",theme:"SPORTS",fields:[{id:"C1",clue:"Court & net",answer:"TENNIS"},{id:"C2",clue:"Ice & skates",answer:"HOCKEY"},{id:"C3",clue:"Pool & cap",answer:"SWIMMING"},{id:"C4",clue:"The octagon",answer:"MMA"}]},
    {id:"D",theme:"FOOD",fields:[{id:"D1",clue:"Italian pie",answer:"PIZZA"},{id:"D2",clue:"Japanese roll",answer:"SUSHI"},{id:"D3",clue:"Mexican wrap",answer:"BURRITO"},{id:"D4",clue:"French bread",answer:"BAGUETTE"}]},
  ],
  final:{answer:"FREEDOM",hint:"Project Freedom"}
};

function norm(s){ return s.trim().toUpperCase().replace(/[^A-Z0-9]/g,""); }
function match(a,b){ return norm(a)===norm(b); }
function genId(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }

const SkullIcon=({size=28})=>(
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="28" r="20" fill="#fff" opacity=".9"/>
    <rect x="22" y="42" width="8" height="10" rx="2" fill="#fff" opacity=".9"/>
    <rect x="34" y="42" width="8" height="10" rx="2" fill="#fff" opacity=".9"/>
    <ellipse cx="24" cy="26" rx="5" ry="6" fill="#111"/>
    <ellipse cx="40" cy="26" rx="5" ry="6" fill="#111"/>
    <path d="M27 36 L32 33 L37 36" stroke="#111" strokeWidth="2" fill="none"/>
    <line x1="32" y1="10" x2="32" y2="4" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"/>
    <line x1="32" y1="4" x2="38" y2="10" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

function Header(){
  return(
    <div style={{width:"100%",background:"#050505",borderBottom:"1px solid #111",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",boxSizing:"border-box",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <SkullIcon size={26}/>
        <div>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:10,color:"#aaa",letterSpacing:4,lineHeight:1}}>PROJECT</div>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:18,color:"#22c55e",letterSpacing:4,lineHeight:1,textShadow:"0 0 12px #22c55e66"}}>FREEDOM</div>
        </div>
      </div>
      <div style={{fontFamily:"'Black Ops One',cursive",fontSize:12,color:"#8b5cf6",letterSpacing:3}}>ASSOCIATIONS</div>
    </div>
  );
}

function Footer(){
  return(
    <div style={{width:"100%",background:"#050505",borderTop:"1px solid #111",padding:"7px 16px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxSizing:"border-box",flexShrink:0}}>
      <span style={{fontSize:9,color:"#333",letterSpacing:2}}>POWERED BY</span>
      <span style={{fontSize:12,fontWeight:900,letterSpacing:2}}>
        <span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"#444"}}>.FUN</span>
      </span>
    </div>
  );
}

function TimerBar({secs,max,warn=10}){
  const pct=(secs/max)*100, hot=secs<=warn;
  return(
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{flex:1,height:5,background:"#1a1a1a",borderRadius:3,overflow:"hidden",border:"1px solid #222"}}>
        <div style={{width:`${pct}%`,height:"100%",background:hot?"#ef4444":"#22c55e",transition:"width 1s linear, background .3s",borderRadius:3}}/>
      </div>
      <span style={{fontFamily:"monospace",fontSize:12,minWidth:24,color:hot?"#ef4444":"#777"}}>{secs}s</span>
    </div>
  );
}

/* ── FIELD: 3:1 ratio, wide and short ── */
function Field({field, revealed, active, oppActive, canClick, canGuess, onReveal, onGuess, accent}){
  const [val,setVal]=useState("");
  const [wrong,setWrong]=useState(false);
  const inp=useRef();
  useEffect(()=>{if(active&&canGuess&&inp.current)inp.current.focus();},[active,canGuess]);

  const submit=()=>{
    if(!val.trim()) return;
    const ok=onGuess(field.id,val);
    if(!ok){setWrong(true);setTimeout(()=>setWrong(false),500);}
    setVal("");
  };

  const base={
    borderRadius:6, padding:"0 10px",
    height:44, // 3:1 ratio: wide fields, fixed height
    display:"flex", alignItems:"center", justifyContent:"center",
    position:"relative", overflow:"hidden",
    transition:"all .2s", userSelect:"none",
    boxSizing:"border-box", width:"100%",
  };

  if(revealed) return(
    <div style={{...base,background:"#1a1a1a",border:`1px solid ${accent}44`,animation:"revealAnim .3s ease",flexDirection:"column",gap:1}}>
      <span style={{fontSize:11,fontWeight:700,color:accent,letterSpacing:1}}>{field.answer}</span>
      <span style={{fontSize:9,color:"#555"}}>{field.clue}</span>
    </div>
  );

  if(oppActive) return(
    <div style={{...base,background:"#0a0a12",border:`1px solid #8b5cf633`}}>
      <span style={{fontSize:10,color:"#444"}}>⏳</span>
    </div>
  );

  if(active&&canGuess) return(
    <div style={{...base,background:"#0c0c18",border:`2px solid ${accent}`,boxShadow:`0 0 12px ${accent}44`,animation:wrong?"shake .4s ease":"none",gap:6,padding:"0 8px"}}>
      <span style={{fontSize:9,color:accent,whiteSpace:"nowrap",flexShrink:0}}>{field.clue}</span>
      <input ref={inp} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
        placeholder="answer..." style={{flex:1,background:"#111",border:`1px solid ${accent}55`,borderRadius:4,padding:"3px 6px",color:"#fff",fontSize:11,outline:"none",fontFamily:"inherit",minWidth:0}}/>
      <button onClick={submit} style={{background:accent,border:"none",borderRadius:4,padding:"3px 8px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:10,flexShrink:0}}>✓</button>
    </div>
  );

  return(
    <div onClick={canClick?()=>onReveal(field.id):undefined}
      style={{...base,background:canClick?"#0e0e18":"#080808",border:`1px solid ${canClick?accent+"55":"#1a1a1a"}`,cursor:canClick?"pointer":"default",flexDirection:"column",gap:1}}
      onMouseEnter={e=>{if(canClick)e.currentTarget.style.borderColor=accent;}}
      onMouseLeave={e=>{if(canClick)e.currentTarget.style.borderColor=accent+"55";}}>
      <span style={{fontSize:11,color:canClick?"#444":"#1f1f1f",letterSpacing:1,fontWeight:700}}>{field.id}</span>
    </div>
  );
}

/* ── GUESS ROW (theme / final) ── */
function GuessRow({label,solved,solvedText,disabled,onGuess,accent}){
  const [val,setVal]=useState("");
  const [wrong,setWrong]=useState(false);
  if(solved) return(
    <div style={{...gRow,background:accent+"18",border:`1px solid ${accent}55`,justifyContent:"center"}}>
      <span style={{color:accent,fontWeight:700,fontSize:11}}>✓ {solvedText}</span>
    </div>
  );
  const sub=()=>{
    if(!val.trim()||disabled) return;
    const ok=onGuess(val);
    if(!ok){setWrong(true);setTimeout(()=>setWrong(false),500);}
    else setVal("");
  };
  return(
    <div style={{...gRow,animation:wrong?"shake .4s ease":"none",opacity:disabled?.3:1}}>
      <span style={{fontSize:9,color:"#555",whiteSpace:"nowrap"}}>{label}</span>
      <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sub()} disabled={disabled}
        placeholder="guess theme..." style={{flex:1,background:"#080808",border:`1px solid ${accent}33`,borderRadius:4,padding:"4px 7px",color:"#fff",fontSize:10,outline:"none",fontFamily:"inherit",minWidth:0}}/>
      <button onClick={sub} disabled={disabled} style={{background:disabled?"#1a1a1a":accent,border:"none",borderRadius:4,padding:"4px 8px",color:disabled?"#333":"#fff",fontWeight:700,cursor:disabled?"default":"pointer",fontSize:10,flexShrink:0}}>OK</button>
    </div>
  );
}
const gRow={display:"flex",alignItems:"center",gap:6,background:"#080808",border:"1px solid #1a1a1a",borderRadius:5,padding:"5px 8px",width:"100%",boxSizing:"border-box",height:32};

export default function App(){
  const [uid,setUid]=useState(null);
  const [screen,setScreen]=useState("lobby");
  const [playerName,setPlayerName]=useState("");
  const [wager,setWager]=useState(100);
  const [gameId,setGameId]=useState(null);
  const [myRole,setMyRole]=useState(null);
  const [gameState,setGameState]=useState(null);
  const [turnTimer,setTurnTimer]=useState(TURN_TIME);
  const [finalTimer,setFinalTimer]=useState(FINAL_TIME);
  const [idleTimer,setIdleTimer]=useState(IDLE_TIME);
  const [activeField,setActiveField]=useState(null);
  const [usedClick,setUsedClick]=useState(false);
  const [log,setLog]=useState([]);
  const [loadingMsg,setLoadingMsg]=useState("");

  const turnRef=useRef(),finalRef=useRef(),idleRef=useRef();
  const lastAct=useRef(Date.now());
  const gameRef=useRef(null);

  const addLog=m=>setLog(p=>[m,...p].slice(0,6));
  const touch=()=>{lastAct.current=Date.now();setIdleTimer(IDLE_TIME);};

  useEffect(()=>{signInAnonymously(auth).then(r=>setUid(r.user.uid)).catch(console.error);},[]);

  useEffect(()=>{
    if(!gameId) return;
    gameRef.current=ref(db,`assoc_games/${gameId}`);
    const unsub=onValue(gameRef.current,snap=>{
      const d=snap.val(); if(!d) return;
      setGameState(d);
      setActiveField(d[`af_${myRole}`]||null);
      setUsedClick(d[`uc_${myRole}`]||false);
      if(d.status==="finished") setScreen("result");
    });
    return()=>unsub();
  },[gameId,myRole]);

  // Turn timer
  useEffect(()=>{
    if(screen!=="game"||!gameState||gameState.finalPhase||gameState.status==="finished") return;
    clearInterval(turnRef.current); setTurnTimer(TURN_TIME);
    turnRef.current=setInterval(()=>setTurnTimer(t=>{
      if(t<=1){clearInterval(turnRef.current);if(gameState.currentTurn===myRole)passTurn();return TURN_TIME;}
      return t-1;
    }),1000);
    return()=>clearInterval(turnRef.current);
  },[gameState?.currentTurn,screen,gameState?.finalPhase]);

  // Final timer
  useEffect(()=>{
    if(!gameState?.finalPhase||gameState?.status==="finished") return;
    clearInterval(finalRef.current); setFinalTimer(FINAL_TIME);
    finalRef.current=setInterval(()=>setFinalTimer(t=>{
      if(t<=1){clearInterval(finalRef.current);const s=gameState.scores||{p1:0,p2:0};endGame(s.p1>=s.p2?"p1":"p2","Time's up — winner by points!");return 0;}
      return t-1;
    }),1000);
    return()=>clearInterval(finalRef.current);
  },[gameState?.finalPhase,gameState?.status]);

  // Idle timer
  useEffect(()=>{
    if(screen!=="game"||gameState?.status==="finished") return;
    clearInterval(idleRef.current);
    idleRef.current=setInterval(()=>{
      const rem=IDLE_TIME-Math.floor((Date.now()-lastAct.current)/1000);
      setIdleTimer(rem);
      if(rem<=0){clearInterval(idleRef.current);endGame(myRole==="p1"?"p2":"p1","Idle 60s — opponent wins!");}
    },1000);
    return()=>clearInterval(idleRef.current);
  },[screen,myRole,gameState?.status]);

  // All fields open → final phase
  useEffect(()=>{
    if(!gameState||gameState.finalPhase||gameState.status==="finished") return;
    const b=gameState.board; if(!b) return;
    const total=b.columns.reduce((s,c)=>s+c.fields.length,0);
    if(Object.keys(gameState.revealed||{}).length>=total&&gameState.currentTurn===myRole){
      update(gameRef.current,{finalPhase:true});
      addLog("🎯 All fields open! 60s for the final answer!");
    }
  },[gameState]);

  async function findGame(){
    if(!playerName.trim()||!uid) return;
    setScreen("loading"); setLoadingMsg("Generating board (AI)...");
    const board=await generateBoard();
    setLoadingMsg("Finding opponent...");
    const snap=await get(ref(db,"assoc_match"));
    const waiting=snap.val()||{};
    let found=null;
    for(const [gid,e] of Object.entries(waiting)){
      if(e.wager===wager&&e.status==="waiting"&&e.p1!==uid){found={gid,e};break;}
    }
    if(found){
      const gRef=ref(db,`assoc_games/${found.gid}`);
      await update(gRef,{p2:uid,p2name:playerName,status:"active",currentTurn:"p1",lastActivity:Date.now()});
      await set(ref(db,`assoc_match/${found.gid}`),null);
      setGameId(found.gid);setMyRole("p2");setScreen("game");
      addLog("Opponent found! You are Player 2.");
    } else {
      const gid=genId();
      await set(ref(db,`assoc_games/${gid}`),{
        p1:uid,p1name:playerName,p2:null,p2name:null,status:"waiting",wager,board,
        scores:{p1:0,p2:0},revealed:{},colSolved:{A:false,B:false,C:false,D:false},
        finalSolved:false,finalPhase:false,currentTurn:"p1",
        af_p1:null,af_p2:null,uc_p1:false,uc_p2:false,
        lastActivity:Date.now(),winner:null
      });
      await set(ref(db,`assoc_match/${gid}`),{p1:uid,wager,status:"waiting"});
      setGameId(gid);setMyRole("p1");setScreen("waiting");
    }
  }

  useEffect(()=>{
    if(screen!=="waiting"||!gameId) return;
    const unsub=onValue(ref(db,`assoc_games/${gameId}`),snap=>{
      const d=snap.val();
      if(d?.status==="active"){setGameState(d);setScreen("game");addLog("Opponent joined! Your turn! (P1)");}
    });
    return()=>unsub();
  },[screen,gameId]);

  async function revealField(fid){
    if(!isMy||usedClick||activeField||gameState?.finalPhase) return;
    touch();
    await update(gameRef.current,{[`af_${myRole}`]:fid,[`uc_${myRole}`]:true,lastActivity:Date.now()});
    addLog(`Field ${fid} revealed!`);
  }

  async function guessField(fid,val){
    touch();
    const col=gameState.board.columns.find(c=>c.fields.some(f=>f.id===fid));
    const field=col?.fields.find(f=>f.id===fid);
    if(!field) return false;
    if(match(val,field.answer)){
      await update(gameRef.current,{[`revealed/${fid}`]:true,[`scores/${myRole}`]:(gameState.scores[myRole]||0)+10,[`af_${myRole}`]:null,lastActivity:Date.now()});
      setTimeout(()=>passTurn(),600);
      addLog(`✅ Correct! "${field.answer}" +10pts`);return true;
    }
    addLog(`❌ Wrong for ${fid}`);return false;
  }

  async function guessCol(cid,val){
    touch();
    const col=gameState.board.columns.find(c=>c.id===cid);
    if(!col||gameState.colSolved?.[cid]) return false;
    if(match(val,col.theme)){
      await update(gameRef.current,{[`colSolved/${cid}`]:myRole,[`scores/${myRole}`]:(gameState.scores[myRole]||0)+20,lastActivity:Date.now()});
      addLog(`✅ Column ${cid} theme! +20pts`);return true;
    }
    addLog(`❌ Wrong theme for ${cid}`);return false;
  }

  async function guessFinal(val){
    touch();
    if(match(val,gameState.board.final.answer)){
      await update(gameRef.current,{finalSolved:myRole,[`scores/${myRole}`]:(gameState.scores[myRole]||0)+30,lastActivity:Date.now()});
      endGame(myRole,"Final answer correct! +30pts");return true;
    }
    addLog("❌ Wrong final answer!");return false;
  }

  async function passTurn(){
    const next=myRole==="p1"?"p2":"p1";
    await update(gameRef.current,{currentTurn:next,[`af_${myRole}`]:null,[`uc_${myRole}`]:false,lastActivity:Date.now()});
  }

  async function endGame(w,reason){
    if(!gameRef.current) return;
    await update(gameRef.current,{status:"finished",winner:w,winReason:reason,finishedAt:Date.now()});
  }

  function resetGame(){
    setScreen("lobby");setGameId(null);setMyRole(null);setGameState(null);
    setActiveField(null);setUsedClick(false);setLog([]);
  }

  const board=gameState?.board||null;
  const isMy=gameState?.currentTurn===myRole;
  const oppRole=myRole==="p1"?"p2":"p1";
  const scores=gameState?.scores||{p1:0,p2:0};
  const revealed=gameState?.revealed||{};
  const colSolved=gameState?.colSolved||{};
  const finalSolved=gameState?.finalSolved||false;
  const finalPhase=gameState?.finalPhase||false;
  const winner=gameState?.winner||null;
  const winReason=gameState?.winReason||"";
  const myName=myRole==="p1"?gameState?.p1name||"P1":gameState?.p2name||"P2";
  const oppName=myRole==="p1"?gameState?.p2name||"P2":gameState?.p1name||"P1";
  const oppAf=gameState?.[`af_${oppRole}`]||null;
  const canClick=isMy&&!usedClick&&!activeField&&!finalPhase&&!winner&&gameState?.status==="active";
  const canGuess=isMy&&!!activeField&&!finalPhase;
  const canGuessAnytime=isMy&&(usedClick||finalPhase)&&!winner&&gameState?.status==="active";

  const ACCENTS={A:"#e63946",B:"#f4a261",C:"#2a9d8f",D:"#457b9d"};

  /* ════════ LOBBY ════════ */
  if(screen==="lobby") return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,overflowY:"auto",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px 12px"}}>
        <div style={S.card}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontFamily:"'Black Ops One',cursive",fontSize:28,color:"#a78bfa",letterSpacing:5,textShadow:"0 0 24px #8b5cf666"}}>ASSOCIATIONS</div>
            <div style={{fontSize:10,color:"#444",letterSpacing:3,marginTop:2}}>WORD ASSOCIATION BATTLE</div>
          </div>
          <input value={playerName} onChange={e=>setPlayerName(e.target.value)} placeholder="Your name / username" style={S.input} maxLength={16}/>
          <div style={{marginTop:14}}>
            <div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:6}}>WAGER — FREEDOM TOKENS</div>
            <div style={{display:"flex",gap:6}}>
              {WAGERS.map(w=><button key={w} onClick={()=>setWager(w)} style={{flex:1,padding:"9px 0",borderRadius:7,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",background:wager===w?"#8b5cf6":"#0e0e0e",color:wager===w?"#fff":"#8b5cf6",border:"1px solid #8b5cf6",boxShadow:wager===w?"0 0 14px #8b5cf633":"none"}}>{w}</button>)}
            </div>
          </div>
          <div style={{fontSize:9,color:"#222",fontFamily:"monospace",textAlign:"center",marginTop:8}}>Escrow: {ESCROW.slice(0,10)}…{ESCROW.slice(-6)}</div>
          <button onClick={findGame} disabled={!playerName.trim()||!uid} style={{...S.btn,marginTop:16,background:playerName.trim()?"#8b5cf6":"#333",color:playerName.trim()?"#fff":"#555",boxShadow:playerName.trim()?"0 0 20px #8b5cf644":"none"}}>
            {uid?"FIND OPPONENT":"Connecting..."}
          </button>
          <div style={{marginTop:20,padding:14,background:"#060606",borderRadius:9,border:"1px solid #141414"}}>
            <div style={{color:"#8b5cf6",fontSize:10,fontWeight:700,letterSpacing:2,marginBottom:8}}>GAME RULES</div>
            {[["30s/turn","Each player has 30 seconds per turn"],["1 click","Click ONE field — the clue reveals instantly"],["Guess","Guess: field answer, column theme, or final answer"],["Final","All fields open → 60s for the final answer"],["Idle","60s without activity = automatic loss"],["Points","Field +10 · Column theme +20 · Final +30"]].map(([t,d],i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:5}}>
                <span style={{fontSize:9,color:"#8b5cf6",fontWeight:700,whiteSpace:"nowrap",minWidth:55}}>{t}</span>
                <span style={{fontSize:10,color:"#555",lineHeight:1.4}}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    <Footer/></div>
  );

  /* ════════ LOADING ════════ */
  if(screen==="loading") return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
        <div style={{width:48,height:48,border:"3px solid #8b5cf622",borderTop:"3px solid #8b5cf6",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{color:"#555",fontSize:13,letterSpacing:2}}>{loadingMsg}</div>
      </div>
    <Footer/></div>
  );

  /* ════════ WAITING ════════ */
  if(screen==="waiting") return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:16}}>
        <div style={{width:56,height:56,border:"3px solid #8b5cf622",borderTop:"3px solid #8b5cf6",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{color:"#8b5cf6",fontSize:14,fontWeight:700,letterSpacing:3}}>WAITING FOR OPPONENT</div>
        <div style={{color:"#444",fontSize:11}}>Wager: <b style={{color:"#a78bfa"}}>{wager}</b> FREEDOM tokens</div>
        <div style={{fontSize:10,color:"#555"}}>Share this Game ID with your opponent:</div>
        <div style={{fontSize:22,fontFamily:"monospace",color:"#22c55e",fontWeight:900,letterSpacing:6,padding:"10px 24px",background:"#0a1a0a",border:"2px solid #22c55e44",borderRadius:8}}>{gameId}</div>
        <div style={{fontSize:10,color:"#333"}}>OR they can auto-match by selecting same wager ({wager})</div>
        <button onClick={()=>{set(ref(db,`assoc_games/${gameId}`),null);set(ref(db,`assoc_match/${gameId}`),null);setScreen("lobby");setGameId(null);setMyRole(null);}} style={{...S.btn,maxWidth:200,padding:"8px 0",fontSize:11}}>CANCEL</button>
      </div>
    <Footer/></div>
  );

  /* ════════ RESULT ════════ */
  if(screen==="result"||winner) return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{...S.card,textAlign:"center",maxWidth:340}}>
          <div style={{fontSize:56,lineHeight:1}}>{winner===myRole?"🏆":"💀"}</div>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:22,letterSpacing:3,marginTop:8,color:winner===myRole?"#22c55e":"#ef4444"}}>{winner===myRole?"YOU WIN!":"YOU LOSE"}</div>
          <div style={{color:"#555",fontSize:11,marginTop:6,marginBottom:20}}>{winReason}</div>
          <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:20}}>
            {["p1","p2"].map(r=>(
              <div key={r} style={{padding:"12px 24px",borderRadius:10,background:r===winner?"#22c55e0e":"#0e0e0e",border:`2px solid ${r===winner?"#22c55e":"#2a2a2a"}`}}>
                <div style={{fontSize:9,color:"#444"}}>{r===myRole?myName:oppName}</div>
                <div style={{fontSize:28,fontWeight:900,color:r===winner?"#22c55e":"#fff"}}>{scores[r]||0}</div>
                <div style={{fontSize:9,color:"#333"}}>points</div>
              </div>
            ))}
          </div>
          {winner===myRole&&<div style={{color:"#a78bfa",fontSize:12,marginBottom:14}}>🎉 Winnings: <b>{wager*2}</b> FREEDOM tokens</div>}
          <button onClick={resetGame} style={{...S.btn,background:"#8b5cf6",color:"#fff"}}>NEW GAME</button>
        </div>
      </div>
    <Footer/></div>
  );

  /* ════════ GAME ════════ */
  if(!board) return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{color:"#555"}}>Loading game...</div>
      </div>
    <Footer/></div>
  );

  const colA=board.columns[0], colB=board.columns[1], colC=board.columns[2], colD=board.columns[3];

  return(
    <div style={S.root}><style>{CSS}</style><Header/>

      {/* STATUS */}
      <div style={S.statusBar}>
        <div style={{display:"flex",gap:6,alignItems:"center",flex:1}}>
          {["p1","p2"].map(r=>(
            <div key={r} style={{padding:"3px 12px",borderRadius:16,background:gameState?.currentTurn===r?"#8b5cf618":"#0e0e0e",border:`1px solid ${gameState?.currentTurn===r?"#8b5cf6":"#222"}`,fontSize:11,color:r===myRole?"#a78bfa":"#666",fontWeight:gameState?.currentTurn===r?700:400,whiteSpace:"nowrap"}}>
              {r===myRole?myName:oppName} <b style={{color:gameState?.currentTurn===r?"#fff":"inherit"}}>{scores[r]||0}</b>
            </div>
          ))}
        </div>
        <div style={{flex:1,maxWidth:130}}>
          {finalPhase?<TimerBar secs={finalTimer} max={FINAL_TIME} warn={15}/>:<TimerBar secs={turnTimer} max={TURN_TIME} warn={8}/>}
        </div>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1,whiteSpace:"nowrap",color:finalPhase?"#f59e0b":isMy?"#22c55e":"#ef4444"}}>
          {finalPhase?"🎯 FINAL":isMy?"⚡ YOUR TURN":"⏳ WAIT"}
        </div>
        {idleTimer<20&&<div style={{fontSize:9,color:"#ef4444",animation:"blink 1s infinite"}}>IDLE {idleTimer}s</div>}
        {isMy&&!finalPhase&&!winner&&(
          <button onClick={()=>{touch();passTurn();addLog("Turn passed.");}} style={{padding:"3px 10px",borderRadius:5,background:"#111",color:"#444",border:"1px solid #222",fontFamily:"inherit",fontSize:9,cursor:"pointer"}}>PASS</button>
        )}
      </div>

      {/* HINT */}
      <div style={{fontSize:10,textAlign:"center",padding:"4px 0",borderBottom:"1px solid #0e0e0e",color:isMy&&canClick?"#8b5cf6":isMy&&activeField?"#a78bfa":"#333"}}>
        {finalPhase?"🎯 Guess column theme or final answer!"
          :isMy?canClick?"👆 Click a field to reveal it":activeField?`Field ${activeField} open — type answer, theme or final`:"Wait for your next turn..."
          :"Waiting for opponent..."}
      </div>

      {/* ════════ X-BOARD ════════ */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 6px"}}>
        <div style={{maxWidth:900,margin:"0 auto",padding:"0 4px"}}>

          {/* 
            X-SHAPE LAYOUT:
            Row 1: [ColA header] [ColB header] [FINAL] [ColC header] [ColD header]
            Row 2: A1 A2 A3 A4 | ??? | D4 D3 D2 D1
            Row 3: B1 B2 B3 B4 |     | C4 C3 C2 C1
            Row 4: [Theme A] [Theme B] [Final guess] [Theme C] [Theme D]
          */}

          {/* Column Headers */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 90px 1fr 1fr",gap:4,marginBottom:4}}>
            {[colA,colB].map(col=>(
              <div key={col.id} style={{textAlign:"center",padding:"6px 0",borderBottom:`2px solid ${ACCENTS[col.id]}55`}}>
                <span style={{fontFamily:"'Black Ops One',cursive",fontSize:18,color:ACCENTS[col.id],letterSpacing:3,textShadow:`0 0 10px ${ACCENTS[col.id]}66`}}>{col.id}</span>
              </div>
            ))}
            <div style={{textAlign:"center",padding:"6px 0",borderBottom:"2px solid #2a2a2a"}}>
              <span style={{fontSize:9,color:"#444",letterSpacing:1}}>FINAL</span>
            </div>
            {[colC,colD].map(col=>(
              <div key={col.id} style={{textAlign:"center",padding:"6px 0",borderBottom:`2px solid ${ACCENTS[col.id]}55`}}>
                <span style={{fontFamily:"'Black Ops One',cursive",fontSize:18,color:ACCENTS[col.id],letterSpacing:3,textShadow:`0 0 10px ${ACCENTS[col.id]}66`}}>{col.id}</span>
              </div>
            ))}
          </div>

          {/* Row A + D (top row of X) */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 90px 1fr 1fr",gap:4,marginBottom:4}}>
            {/* Col A fields — left to right: A1 A2 A3 A4 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,gridColumn:1}}>
              {colA.fields.map(f=>(
                <Field key={f.id} field={f} revealed={!!revealed[f.id]} active={activeField===f.id} oppActive={oppAf===f.id}
                  canClick={canClick} canGuess={canGuess&&activeField===f.id}
                  onReveal={revealField} onGuess={guessField} accent={ACCENTS.A}/>
              ))}
            </div>
            {/* Empty for col B row - top of X only has A and D */}
            <div style={{gridColumn:2}}/>
            {/* FINAL CENTER — spans 2 rows */}
            <div style={{gridColumn:3,gridRow:"1 / 3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{
                width:"100%",height:"100%",minHeight:96,
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                background:finalPhase?"#a78bfa0c":"#050505",
                border:`2px solid ${finalPhase?"#a78bfa66":"#1a1a1a"}`,
                borderRadius:10,padding:8,textAlign:"center",
                animation:finalPhase?"glowPulse 2s infinite":"none",
                boxSizing:"border-box"
              }}>
                <div style={{fontSize:9,color:"#444",letterSpacing:1,marginBottom:4}}>FINAL</div>
                {finalSolved
                  ?<div style={{fontSize:13,fontWeight:900,color:"#22c55e",letterSpacing:1}}>{board.final.answer}</div>
                  :<div style={{fontSize:24,color:"#222",fontWeight:900}}>???</div>
                }
                <div style={{fontSize:8,color:"#333",marginTop:3}}>{board.final.hint}</div>
              </div>
            </div>
            {/* Empty for col C row */}
            <div style={{gridColumn:4}}/>
            {/* Col D fields — reversed: D4 D3 D2 D1 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,gridColumn:5}}>
              {[...colD.fields].reverse().map(f=>(
                <Field key={f.id} field={f} revealed={!!revealed[f.id]} active={activeField===f.id} oppActive={oppAf===f.id}
                  canClick={canClick} canGuess={canGuess&&activeField===f.id}
                  onReveal={revealField} onGuess={guessField} accent={ACCENTS.D}/>
              ))}
            </div>
          </div>

          {/* Row B + C (bottom row of X) */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 90px 1fr 1fr",gap:4,marginBottom:4}}>
            {/* Empty for col A */}
            <div style={{gridColumn:1}}/>
            {/* Col B fields */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,gridColumn:2}}>
              {colB.fields.map(f=>(
                <Field key={f.id} field={f} revealed={!!revealed[f.id]} active={activeField===f.id} oppActive={oppAf===f.id}
                  canClick={canClick} canGuess={canGuess&&activeField===f.id}
                  onReveal={revealField} onGuess={guessField} accent={ACCENTS.B}/>
              ))}
            </div>
            {/* Final center already rendered above */}
            <div style={{gridColumn:3}}/>
            {/* Col C fields — reversed: C4 C3 C2 C1 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,gridColumn:4}}>
              {[...colC.fields].reverse().map(f=>(
                <Field key={f.id} field={f} revealed={!!revealed[f.id]} active={activeField===f.id} oppActive={oppAf===f.id}
                  canClick={canClick} canGuess={canGuess&&activeField===f.id}
                  onReveal={revealField} onGuess={guessField} accent={ACCENTS.C}/>
              ))}
            </div>
            {/* Empty for col D */}
            <div style={{gridColumn:5}}/>
          </div>

          {/* Theme guess row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 90px 1fr 1fr",gap:4,marginBottom:8}}>
            <GuessRow label="Theme A" solved={!!colSolved.A} solvedText={colA.theme} disabled={!canGuessAnytime} onGuess={v=>guessCol("A",v)} accent={ACCENTS.A}/>
            <GuessRow label="Theme B" solved={!!colSolved.B} solvedText={colB.theme} disabled={!canGuessAnytime} onGuess={v=>guessCol("B",v)} accent={ACCENTS.B}/>
            <GuessRow label="Final" solved={!!finalSolved} solvedText={board.final.answer} disabled={!canGuessAnytime} onGuess={guessFinal} accent="#a78bfa"/>
            <GuessRow label="Theme C" solved={!!colSolved.C} solvedText={colC.theme} disabled={!canGuessAnytime} onGuess={v=>guessCol("C",v)} accent={ACCENTS.C}/>
            <GuessRow label="Theme D" solved={!!colSolved.D} solvedText={colD.theme} disabled={!canGuessAnytime} onGuess={v=>guessCol("D",v)} accent={ACCENTS.D}/>
          </div>

          {/* Log */}
          {log.length>0&&(
            <div style={{padding:"6px 10px",background:"#060606",borderRadius:7,border:"1px solid #111"}}>
              {log.map((l,i)=>(
                <div key={i} style={{fontSize:10,color:i===0?"#bbb":"#333",padding:"2px 0",borderBottom:i<log.length-1?"1px solid #0e0e0e":"none"}}>{l}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </div>
  );
}

const S={
  root:{height:"100vh",display:"flex",flexDirection:"column",background:"#030303",fontFamily:"'Rajdhani','Oswald',sans-serif",color:"#fff",overflow:"hidden"},
  card:{width:"100%",maxWidth:520,background:"#090909",border:"1px solid #141414",borderRadius:12,padding:"20px 16px",boxSizing:"border-box"},
  input:{width:"100%",background:"#0e0e0e",border:"1px solid #222",borderRadius:7,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
  btn:{width:"100%",padding:"11px 0",background:"#0e0e0e",color:"#777",border:"1px solid #2a2a2a",borderRadius:7,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:2,transition:"all .2s"},
  statusBar:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",padding:"6px 10px",background:"#080808",borderBottom:"1px solid #0e0e0e",flexShrink:0},
};

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;600;700&display=swap');
  @keyframes revealAnim{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 20px #a78bfa22}50%{box-shadow:0 0 40px #a78bfa55}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
  @keyframes spin{to{transform:rotate(360deg)}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#080808}::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
`;
