import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

/* ═══════════════════════════════════════════════════════════
   FIREBASE CONFIG
═══════════════════════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyAKmKRj7Hhy4K6DsY_XDbqLb3oYOwZC5jw",
  authDomain: "project-freedom-a004e.firebaseapp.com",
  databaseURL: "https://project-freedom-a004e-default-rtdb.firebaseio.com",
  projectId: "project-freedom-a004e",
  storageBucket: "project-freedom-a004e.firebasestorage.app",
  messagingSenderId: "844172246267",
  appId: "1:844172246267:web:a31b8cd6affe8337f7845e",
  measurementId: "G-9GBDQFN9LG"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const ESCROW     = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS     = [100, 500, 1000];
const TURN_TIME  = 30;
const FINAL_TIME = 60;
const IDLE_TIME  = 60;

/* ═══════════════════════════════════════════════════════════
   CLAUDE AI — GENERATE BOARD (English)
═══════════════════════════════════════════════════════════ */
async function generateBoardFromAI() {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [{
          role: "user",
          content: `Generate a board for the word association game in English.
Return ONLY valid JSON, no explanations, no markdown backticks, just clean JSON.

Format:
{
  "columns": [
    {
      "id": "A",
      "theme": "COLUMN_THEME_IN_CAPS",
      "fields": [
        {"id":"A1","clue":"short clue","answer":"ANSWER"},
        {"id":"A2","clue":"short clue","answer":"ANSWER"},
        {"id":"A3","clue":"short clue","answer":"ANSWER"},
        {"id":"A4","clue":"short clue","answer":"ANSWER"}
      ]
    },
    { "id":"B", "theme":"...", "fields":[{"id":"B1"...},...] },
    { "id":"C", "theme":"...", "fields":[{"id":"C1"...},...] },
    { "id":"D", "theme":"...", "fields":[{"id":"D1"...},...] }
  ],
  "final": {
    "answer": "FINAL_ANSWER",
    "hint": "short hint"
  }
}

Rules:
- Each column must have a completely different theme (e.g. ANIMALS, CITIES, MOVIES, SPORTS...)
- Clues are short (1-3 words), clear, in English
- Answers are single words, ALL CAPS, in English
- The final answer is a common supercategory that connects all 4 themes
- Everything in English`
        }]
      })
    });
    const data = await response.json();
    const text = data.content[0].text.trim();
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("AI board generation failed, using fallback:", e);
    return FALLBACK_BOARD;
  }
}

/* ═══════════════════════════════════════════════════════════
   FALLBACK BOARD (English)
═══════════════════════════════════════════════════════════ */
const FALLBACK_BOARD = {
  columns: [
    { id:"A", theme:"ANIMALS",
      fields:[
        {id:"A1", clue:"King of the jungle",  answer:"LION"},
        {id:"A2", clue:"Black and white stripes", answer:"ZEBRA"},
        {id:"A3", clue:"Longest neck",        answer:"GIRAFFE"},
        {id:"A4", clue:"Trunk and tusks",     answer:"ELEPHANT"},
      ]},
    { id:"B", theme:"INSTRUMENTS",
      fields:[
        {id:"B1", clue:"6 strings",           answer:"GUITAR"},
        {id:"B2", clue:"Black and white keys",answer:"PIANO"},
        {id:"B3", clue:"You hit it",          answer:"DRUM"},
        {id:"B4", clue:"Brass wind",          answer:"TRUMPET"},
      ]},
    { id:"C", theme:"SPORTS",
      fields:[
        {id:"C1", clue:"Court and net",       answer:"TENNIS"},
        {id:"C2", clue:"Skates and ice",      answer:"HOCKEY"},
        {id:"C3", clue:"Pool and cap",        answer:"SWIMMING"},
        {id:"C4", clue:"The octagon",         answer:"MMA"},
      ]},
    { id:"D", theme:"FOOD",
      fields:[
        {id:"D1", clue:"Italian pie",         answer:"PIZZA"},
        {id:"D2", clue:"Japanese roll",       answer:"SUSHI"},
        {id:"D3", clue:"Mexican wrap",        answer:"BURRITO"},
        {id:"D4", clue:"French bread",        answer:"BAGUETTE"},
      ]},
  ],
  final:{ answer:"FREEDOM", hint:"Project Freedom" },
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function norm(s){ return s.trim().toUpperCase().replace(/[^A-Z0-9]/g,""); }
function match(a,b){ return norm(a)===norm(b); }
function genGameId(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }

/* ═══════════════════════════════════════════════════════════
   SKULL ICON
═══════════════════════════════════════════════════════════ */
const SkullIcon = ({size=28})=>(
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="28" r="20" fill="#fff" opacity=".9"/>
    <rect x="22" y="42" width="8" height="10" rx="2" fill="#fff" opacity=".9"/>
    <rect x="34" y="42" width="8" height="10" rx="2" fill="#fff" opacity=".9"/>
    <ellipse cx="24" cy="26" rx="5" ry="6" fill="#111"/>
    <ellipse cx="40" cy="26" rx="5" ry="6" fill="#111"/>
    <path d="M27 36 L32 33 L37 36" stroke="#111" strokeWidth="2" fill="none"/>
    <line x1="32" y1="10" x2="32" y2="4" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"/>
    <line x1="32" y1="4"  x2="38" y2="10" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   TIMER BAR
═══════════════════════════════════════════════════════════ */
function TimerBar({secs, max, warn=10}){
  const pct=(secs/max)*100;
  const hot=secs<=warn;
  return(
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{flex:1,height:5,background:"#1a1a1a",borderRadius:3,overflow:"hidden",border:"1px solid #222"}}>
        <div style={{width:`${pct}%`,height:"100%",borderRadius:3,background:hot?"#ef4444":"#22c55e",boxShadow:`0 0 6px ${hot?"#ef444488":"#22c55e88"}`,transition:"width 1s linear, background .3s"}}/>
      </div>
      <span style={{fontFamily:"monospace",fontSize:12,minWidth:24,color:hot?"#ef4444":"#777",textShadow:hot?"0 0 8px #ef4444":"none"}}>{secs}s</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FIELD CELL
═══════════════════════════════════════════════════════════ */
function FieldCell({field, revealed, active, canClick, canGuess, onReveal, onGuess}){
  const [val,setVal]=useState("");
  const [wrong,setWrong]=useState(false);
  const inp=useRef();

  useEffect(()=>{if(active&&canGuess&&inp.current) inp.current.focus();},[active,canGuess]);

  const submit=()=>{
    if(!val.trim()) return;
    const ok=onGuess(field.id,val);
    if(!ok){setWrong(true);setTimeout(()=>setWrong(false),500);}
    setVal("");
  };

  if(revealed) return(
    <div style={{...cellBase,background:"#111",border:"1px solid #8b5cf633",animation:"revealAnim .35s ease"}}>
      <span style={{fontSize:9,color:"#555",letterSpacing:1}}>{field.id}</span>
      <span style={{fontSize:13,fontWeight:700,color:"#a78bfa",marginTop:2,letterSpacing:1}}>{field.answer}</span>
      <span style={{fontSize:9,color:"#444",marginTop:1,textAlign:"center",lineHeight:1.3}}>{field.clue}</span>
    </div>
  );

  if(active&&canGuess) return(
    <div style={{...cellBase,background:"#0c0c18",border:"2px solid #8b5cf6",boxShadow:"0 0 16px #8b5cf644",animation:wrong?"shake .4s ease":"none"}}>
      <span style={{fontSize:9,color:"#a78bfa",marginBottom:5,letterSpacing:1}}>{field.clue}</span>
      <div style={{display:"flex",gap:4,width:"100%"}}>
        <input ref={inp} value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&submit()}
          placeholder="your answer..."
          style={{flex:1,background:"#0a0a0a",border:"1px solid #8b5cf655",borderRadius:5,padding:"4px 7px",color:"#fff",fontSize:11,outline:"none",fontFamily:"inherit",minWidth:0}}
        />
        <button onClick={submit} style={{background:"#8b5cf6",border:"none",borderRadius:5,padding:"4px 8px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:11}}>✓</button>
      </div>
    </div>
  );

  if(active&&!canGuess) return(
    <div style={{...cellBase,background:"#0c0c18",border:"2px solid #8b5cf655"}}>
      <span style={{fontSize:9,color:"#555"}}>Opponent playing...</span>
      <span style={{fontSize:18,color:"#333",marginTop:2}}>⏳</span>
    </div>
  );

  return(
    <div
      onClick={canClick?()=>onReveal(field.id):undefined}
      style={{...cellBase,background:canClick?"#0e0e14":"#080808",border:`1px solid ${canClick?"#8b5cf644":"#1a1a1a"}`,cursor:canClick?"pointer":"default",transition:"border-color .2s"}}
      onMouseEnter={e=>{if(canClick) e.currentTarget.style.borderColor="#8b5cf6aa";}}
      onMouseLeave={e=>{if(canClick) e.currentTarget.style.borderColor="#8b5cf644";}}
    >
      <span style={{fontSize:11,color:canClick?"#555":"#222",letterSpacing:1}}>{field.id}</span>
      <span style={{fontSize:20,color:canClick?"#333":"#1a1a1a",marginTop:2}}>?</span>
    </div>
  );
}
const cellBase={display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:7,padding:"6px 5px",minHeight:72,textAlign:"center",userSelect:"none"};

/* ═══════════════════════════════════════════════════════════
   GUESS INPUT
═══════════════════════════════════════════════════════════ */
function GuessInput({label, solved, solvedText, disabled, onGuess, accent="#8b5cf6"}){
  const [val,setVal]=useState("");
  const [wrong,setWrong]=useState(false);
  if(solved) return(
    <div style={{...gBase,background:accent+"18",border:`1px solid ${accent}55`,justifyContent:"center"}}>
      <span style={{color:accent,fontWeight:700,fontSize:11,letterSpacing:1}}>✓ {solvedText}</span>
    </div>
  );
  const sub=()=>{
    if(!val.trim()||disabled) return;
    const ok=onGuess(val);
    if(!ok){setWrong(true);setTimeout(()=>setWrong(false),500);}
    else setVal("");
  };
  return(
    <div style={{...gBase,animation:wrong?"shake .4s ease":"none",opacity:disabled?.35:1}}>
      <span style={{fontSize:9,color:"#555",whiteSpace:"nowrap",marginRight:4}}>{label}</span>
      <input value={val} onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&sub()}
        disabled={disabled}
        placeholder="guess..."
        style={{flex:1,background:"#080808",border:`1px solid ${accent}33`,borderRadius:5,padding:"4px 7px",color:"#fff",fontSize:10,outline:"none",fontFamily:"inherit",minWidth:0}}
      />
      <button onClick={sub} disabled={disabled} style={{background:disabled?"#1a1a1a":accent,border:"none",borderRadius:5,padding:"4px 8px",color:disabled?"#333":"#fff",fontWeight:700,cursor:disabled?"default":"pointer",fontSize:10}}>OK</button>
    </div>
  );
}
const gBase={display:"flex",alignItems:"center",gap:5,background:"#080808",border:"1px solid #1a1a1a",borderRadius:6,padding:"5px 8px",width:"100%",boxSizing:"border-box"};

/* ═══════════════════════════════════════════════════════════
   HEADER / FOOTER
═══════════════════════════════════════════════════════════ */
function Header(){
  return(
    <div style={{width:"100%",background:"#050505",borderBottom:"1px solid #111",padding:"8px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",boxSizing:"border-box",flexShrink:0}}>
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
    <div style={{width:"100%",background:"#050505",borderTop:"1px solid #0e0e0e",padding:"7px 14px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxSizing:"border-box",flexShrink:0}}>
      <span style={{fontSize:9,color:"#2a2a2a",letterSpacing:2}}>POWERED BY</span>
      <span style={{fontSize:12,fontWeight:900,letterSpacing:2}}>
        <span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"#444"}}>.FUN</span>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOADING SCREEN
═══════════════════════════════════════════════════════════ */
function LoadingScreen({message}){
  return(
    <div style={S.root}>
      <style>{CSS}</style>
      <Header/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
        <div style={{width:48,height:48,border:"3px solid #8b5cf622",borderTop:"3px solid #8b5cf6",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{color:"#555",fontSize:13,letterSpacing:2}}>{message}</div>
      </div>
      <Footer/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN GAME COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AssociationsGame(){
  const [uid,setUid]=useState(null);
  const [screen,setScreen]=useState("lobby");
  const [playerName,setPlayerName]=useState("");
  const [wager,setWager]=useState(100);
  const [gameId,setGameId]=useState(null);
  const [myRole,setMyRole]=useState(null);
  const [loadingMsg,setLoadingMsg]=useState("");
  const [gameState,setGameState]=useState(null);
  const [turnTimer,setTurnTimer]=useState(TURN_TIME);
  const [finalTimer,setFinalTimer]=useState(FINAL_TIME);
  const [idleTimer,setIdleTimer]=useState(IDLE_TIME);
  const [activeField,setActiveField]=useState(null);
  const [usedClick,setUsedClick]=useState(false);
  const [log,setLog]=useState([]);

  const turnRef=useRef(); const finalRef=useRef(); const idleRef=useRef();
  const lastActivityRef=useRef(Date.now());
  const gameRef=useRef(null);

  const addLog=msg=>setLog(p=>[msg,...p].slice(0,8));

  /* ── Auth ── */
  useEffect(()=>{
    signInAnonymously(auth).then(r=>setUid(r.user.uid)).catch(console.error);
  },[]);

  /* ── Listen to game ── */
  useEffect(()=>{
    if(!gameId) return;
    gameRef.current=ref(db,`games/${gameId}`);
    const unsub=onValue(gameRef.current,snap=>{
      const data=snap.val();
      if(!data) return;
      setGameState(data);
      setActiveField(data[`activeField_${myRole}`]||null);
      setUsedClick(data[`usedClick_${myRole}`]||false);
      if(data.status==="finished") setScreen("result");
    });
    return()=>unsub();
  },[gameId,myRole]);

  /* ── Turn timer ── */
  useEffect(()=>{
    if(screen!=="game"||!gameState||gameState.finalPhase||gameState.status==="finished") return;
    clearInterval(turnRef.current);
    setTurnTimer(TURN_TIME);
    turnRef.current=setInterval(()=>{
      setTurnTimer(t=>{
        if(t<=1){
          clearInterval(turnRef.current);
          if(gameState.currentTurn===myRole) handlePassTurn();
          return TURN_TIME;
        }
        return t-1;
      });
    },1000);
    return()=>clearInterval(turnRef.current);
  },[gameState?.currentTurn,screen,gameState?.finalPhase]);

  /* ── Final timer ── */
  useEffect(()=>{
    if(!gameState?.finalPhase||gameState?.status==="finished") return;
    clearInterval(finalRef.current);
    setFinalTimer(FINAL_TIME);
    finalRef.current=setInterval(()=>{
      setFinalTimer(t=>{
        if(t<=1){
          clearInterval(finalRef.current);
          const s=gameState.scores||{p1:0,p2:0};
          const w=s.p1>=s.p2?"p1":"p2";
          endGame(w,"Time's up — winner by points!");
          return 0;
        }
        return t-1;
      });
    },1000);
    return()=>clearInterval(finalRef.current);
  },[gameState?.finalPhase,gameState?.status]);

  /* ── Idle timer ── */
  useEffect(()=>{
    if(screen!=="game"||gameState?.status==="finished") return;
    clearInterval(idleRef.current);
    idleRef.current=setInterval(()=>{
      const rem=IDLE_TIME-Math.floor((Date.now()-lastActivityRef.current)/1000);
      setIdleTimer(rem);
      if(rem<=0){
        clearInterval(idleRef.current);
        const opp=myRole==="p1"?"p2":"p1";
        endGame(opp,"Idle for 60s — opponent wins automatically!");
      }
    },1000);
    return()=>clearInterval(idleRef.current);
  },[screen,myRole,gameState?.status]);

  /* ── Detect all fields open ── */
  useEffect(()=>{
    if(!gameState||gameState.finalPhase||gameState.status==="finished") return;
    const board=gameState.board;
    if(!board) return;
    const total=board.columns.reduce((s,c)=>s+c.fields.length,0);
    const revCount=Object.keys(gameState.revealed||{}).length;
    if(revCount>=total && gameState.currentTurn===myRole){
      update(gameRef.current,{finalPhase:true});
      addLog("🎯 All fields open! 60 seconds for the final answer!");
    }
  },[gameState]);

  function touch(){ lastActivityRef.current=Date.now(); setIdleTimer(IDLE_TIME); }

  /* ════════════════════════════════════════
     MATCHMAKING
  ════════════════════════════════════════ */
  async function findGame(){
    if(!playerName.trim()||!uid) return;
    setScreen("loading");
    setLoadingMsg("Generating questions (AI)...");
    const board=await generateBoardFromAI();
    setLoadingMsg("Looking for opponent...");
    const waitingSnap=await get(ref(db,"matchmaking"));
    const waiting=waitingSnap.val()||{};
    let foundGame=null;
    for(const [gid,entry] of Object.entries(waiting)){
      if(entry.wager===wager&&entry.status==="waiting"&&entry.p1!==uid){
        foundGame={gid,entry}; break;
      }
    }
    if(foundGame){
      const {gid}=foundGame;
      const gRef=ref(db,`games/${gid}`);
      await update(gRef,{p2:uid,p2name:playerName,status:"active",currentTurn:"p1",lastActivity:Date.now()});
      await set(ref(db,`matchmaking/${gid}`),null);
      setGameId(gid); setMyRole("p2"); setScreen("game");
      addLog("Opponent found! You are Player 2. Player 1 goes first.");
    } else {
      const gid=genGameId();
      const gRef=ref(db,`games/${gid}`);
      await set(gRef,{
        p1:uid, p1name:playerName, p2:null, p2name:null,
        status:"waiting", wager, board,
        scores:{p1:0,p2:0}, revealed:{}, colSolved:{A:false,B:false,C:false,D:false},
        finalSolved:false, finalPhase:false, currentTurn:"p1",
        activeField_p1:null, activeField_p2:null,
        usedClick_p1:false, usedClick_p2:false,
        lastActivity:Date.now(), winner:null
      });
      await set(ref(db,`matchmaking/${gid}`),{p1:uid,wager,status:"waiting"});
      setGameId(gid); setMyRole("p1"); setScreen("waiting");
    }
  }

  /* ── Wait for P2 ── */
  useEffect(()=>{
    if(screen!=="waiting"||!gameId) return;
    const gRef=ref(db,`games/${gameId}`);
    const unsub=onValue(gRef,snap=>{
      const d=snap.val();
      if(d?.status==="active"){
        setGameState(d); setScreen("game");
        addLog("Opponent joined! Your turn! (You are P1)");
      }
    });
    return()=>unsub();
  },[screen,gameId]);

  /* ════════════════════════════════════════
     GAME ACTIONS
  ════════════════════════════════════════ */
  async function handleReveal(fieldId){
    if(!isMy||usedClick||activeField||gameState?.finalPhase) return;
    touch();
    await update(gameRef.current,{[`activeField_${myRole}`]:fieldId,[`usedClick_${myRole}`]:true,lastActivity:Date.now()});
    addLog(`Field ${fieldId} opened — enter your answer!`);
  }

  async function handleFieldGuess(fieldId,val){
    touch();
    const board=gameState.board;
    const col=board.columns.find(c=>c.fields.some(f=>f.id===fieldId));
    const field=col?.fields.find(f=>f.id===fieldId);
    if(!field) return false;
    if(match(val,field.answer)){
      const newScore=(gameState.scores[myRole]||0)+10;
      await update(gameRef.current,{
        [`revealed/${fieldId}`]:true,
        [`scores/${myRole}`]:newScore,
        [`activeField_${myRole}`]:null,
        lastActivity:Date.now()
      });
      setTimeout(()=>handlePassTurn(),600);
      addLog(`✅ Correct! "${field.answer}" +10pts`);
      return true;
    }
    addLog(`❌ Wrong answer for ${fieldId}`);
    return false;
  }

  async function handleColGuess(colId,val){
    touch();
    const col=gameState.board.columns.find(c=>c.id===colId);
    if(!col||gameState.colSolved?.[colId]) return false;
    if(match(val,col.theme)){
      const newScore=(gameState.scores[myRole]||0)+20;
      await update(gameRef.current,{[`colSolved/${colId}`]:myRole,[`scores/${myRole}`]:newScore,lastActivity:Date.now()});
      addLog(`✅ Column ${colId} theme correct! +20pts`);
      return true;
    }
    addLog(`❌ Wrong theme for column ${colId}`);
    return false;
  }

  async function handleFinalGuess(val){
    touch();
    if(match(val,gameState.board.final.answer)){
      const newScore=(gameState.scores[myRole]||0)+30;
      await update(gameRef.current,{finalSolved:myRole,[`scores/${myRole}`]:newScore,lastActivity:Date.now()});
      endGame(myRole,"Final answer correct! +30pts");
      return true;
    }
    addLog("❌ Wrong final answer!");
    return false;
  }

  async function handlePassTurn(){
    const next=myRole==="p1"?"p2":"p1";
    await update(gameRef.current,{currentTurn:next,[`activeField_${myRole}`]:null,[`usedClick_${myRole}`]:false,lastActivity:Date.now()});
  }

  async function endGame(winner,reason){
    if(!gameRef.current) return;
    await update(gameRef.current,{status:"finished",winner,winReason:reason,finishedAt:Date.now()});
    updateLeaderboard(winner);
  }

  async function updateLeaderboard(winner){
    if(!gameState) return;
    const scores=gameState.scores||{p1:0,p2:0};
    for(const role of ["p1","p2"]){
      const uid_role=gameState[role];
      if(!uid_role) continue;
      const lbRef=ref(db,`leaderboard/${uid_role}`);
      const snap=await get(lbRef);
      const curr=snap.val()||{wins:0,losses:0,points:0,tokensWon:0};
      const won=winner===role;
      await set(lbRef,{
        name:role==="p1"?gameState.p1name:gameState.p2name,
        wins:(curr.wins||0)+(won?1:0),
        losses:(curr.losses||0)+(won?0:1),
        points:(curr.points||0)+(scores[role]||0),
        tokensWon:(curr.tokensWon||0)+(won?wager*2:0),
      });
    }
  }

  /* ════════════════════════════════════════
     DERIVED STATE
  ════════════════════════════════════════ */
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
  const canClickField=isMy&&!usedClick&&!activeField&&!finalPhase&&!winner&&gameState?.status==="active";
  const canGuessField=isMy&&!!activeField&&!finalPhase;
  const canGuessAnytime=isMy&&(usedClick||finalPhase)&&!winner&&gameState?.status==="active";

  /* ════════════════════════════════════════
     SCREENS
  ════════════════════════════════════════ */
  if(screen==="loading") return <LoadingScreen message={loadingMsg}/>;

  /* ── WAITING ── */
  if(screen==="waiting") return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:16}}>
        <div style={{width:56,height:56,border:"3px solid #8b5cf622",borderTop:"3px solid #8b5cf6",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{color:"#8b5cf6",fontSize:14,fontWeight:700,letterSpacing:3}}>WAITING FOR OPPONENT</div>
        <div style={{color:"#444",fontSize:11}}>Wager: <b style={{color:"#a78bfa"}}>{wager}</b> FREEDOM tokens</div>
        <div style={{fontSize:10,color:"#333",fontFamily:"monospace"}}>Game ID: {gameId}</div>
        <button onClick={()=>{set(ref(db,`games/${gameId}`),null);set(ref(db,`matchmaking/${gameId}`),null);setScreen("lobby");setGameId(null);setMyRole(null);}}
          style={{...S.btn,maxWidth:200,padding:"8px 0",fontSize:11}}>CANCEL</button>
      </div>
    <Footer/></div>
  );

  /* ── LOBBY ── */
  if(screen==="lobby") return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,overflowY:"auto",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px 12px"}}>
        <div style={S.card}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontFamily:"'Black Ops One',cursive",fontSize:26,color:"#a78bfa",letterSpacing:5,textShadow:"0 0 20px #8b5cf666"}}>ASSOCIATIONS</div>
            <div style={{fontSize:10,color:"#444",letterSpacing:3,marginTop:2}}>WORD ASSOCIATION BATTLE</div>
          </div>
          <input value={playerName} onChange={e=>setPlayerName(e.target.value)}
            placeholder="Your name / username" style={S.input} maxLength={16}/>
          <div style={{marginTop:14}}>
            <div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:6}}>WAGER — FREEDOM TOKENS</div>
            <div style={{display:"flex",gap:6}}>
              {WAGERS.map(w=>(
                <button key={w} onClick={()=>setWager(w)} style={{flex:1,padding:"9px 0",borderRadius:7,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s",background:wager===w?"#8b5cf6":"#0e0e0e",color:wager===w?"#fff":"#8b5cf6",border:"1px solid #8b5cf6",boxShadow:wager===w?"0 0 14px #8b5cf633":"none"}}>{w}</button>
              ))}
            </div>
          </div>
          <div style={{fontSize:9,color:"#222",fontFamily:"monospace",textAlign:"center",marginTop:8}}>Escrow: {ESCROW.slice(0,10)}…{ESCROW.slice(-6)}</div>
          <button onClick={findGame} disabled={!playerName.trim()||!uid}
            style={{...S.btn,marginTop:16,background:playerName.trim()?"#8b5cf6":"#333",color:playerName.trim()?"#fff":"#555",boxShadow:playerName.trim()?"0 0 20px #8b5cf644":"none"}}>
            {uid?"FIND OPPONENT":"Connecting..."}
          </button>
          <div style={{marginTop:20,padding:14,background:"#060606",borderRadius:9,border:"1px solid #141414"}}>
            <div style={{color:"#8b5cf6",fontSize:10,fontWeight:700,letterSpacing:2,marginBottom:8}}>GAME RULES</div>
            {[
              ["30s/turn","Each player has 30 seconds per turn"],
              ["1 click","On your turn, click ONE field — the clue reveals instantly"],
              ["Guess","You can guess: the field answer, a column theme, or the final answer"],
              ["Final","When all fields are open — 60 seconds for the final answer"],
              ["Idle","60 seconds without activity = automatic loss"],
              ["Points","Field +10 · Column theme +20 · Final answer +30"],
            ].map(([t,d],i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:5}}>
                <span style={{fontSize:9,color:"#8b5cf6",fontWeight:700,whiteSpace:"nowrap",minWidth:60}}>{t}</span>
                <span style={{fontSize:10,color:"#555",lineHeight:1.4}}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    <Footer/></div>
  );

  /* ── RESULT ── */
  if(screen==="result"||winner) return(
    <div style={S.root}><style>{CSS}</style><Header/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{...S.card,textAlign:"center",maxWidth:340}}>
          <div style={{fontSize:56,lineHeight:1}}>{winner===myRole?"🏆":"💀"}</div>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:22,letterSpacing:3,marginTop:8,color:winner===myRole?"#22c55e":"#ef4444",textShadow:`0 0 20px ${winner===myRole?"#22c55e88":"#ef444488"}`}}>
            {winner===myRole?"YOU WIN!":"YOU LOSE"}
          </div>
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
          <button onClick={()=>{setScreen("lobby");setGameId(null);setMyRole(null);setGameState(null);setActiveField(null);setUsedClick(false);setLog([]);}}
            style={{...S.btn,background:"#8b5cf6",color:"#fff"}}>NEW GAME</button>
        </div>
      </div>
    <Footer/></div>
  );

  /* ── GAME ── */
  if(!board) return <LoadingScreen message="Loading game..."/>;

  return(
    <div style={S.root}><style>{CSS}</style><Header/>

      {/* STATUS BAR */}
      <div style={S.statusBar}>
        <div style={{display:"flex",gap:6,alignItems:"center",flex:1}}>
          {["p1","p2"].map(r=>(
            <div key={r} style={{padding:"3px 12px",borderRadius:16,background:gameState?.currentTurn===r?"#8b5cf618":"#0e0e0e",border:`1px solid ${gameState?.currentTurn===r?"#8b5cf6":"#222"}`,fontSize:11,color:r===myRole?"#a78bfa":"#666",fontWeight:gameState?.currentTurn===r?700:400,whiteSpace:"nowrap"}}>
              {r===myRole?myName:oppName} <b style={{color:gameState?.currentTurn===r?"#fff":"inherit"}}>{scores[r]||0}</b>
            </div>
          ))}
        </div>
        <div style={{flex:1,maxWidth:140}}>
          {finalPhase?<TimerBar secs={finalTimer} max={FINAL_TIME} warn={15}/>:<TimerBar secs={turnTimer} max={TURN_TIME} warn={8}/>}
        </div>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1,whiteSpace:"nowrap",color:finalPhase?"#f59e0b":isMy?"#22c55e":"#ef4444"}}>
          {finalPhase?"🎯 FINAL":isMy?"⚡ YOUR TURN":"⏳ WAIT"}
        </div>
        {idleTimer<20&&<div style={{fontSize:9,color:"#ef4444",animation:"blink 1s infinite",whiteSpace:"nowrap"}}>IDLE {idleTimer}s</div>}
        {isMy&&!finalPhase&&!winner&&(
          <button onClick={()=>{touch();handlePassTurn();addLog("Turn passed.");}} style={{padding:"3px 10px",borderRadius:5,background:"#111",color:"#444",border:"1px solid #2a2a2a",fontFamily:"inherit",fontSize:9,cursor:"pointer"}}>PASS</button>
        )}
      </div>

      {/* HINT */}
      <div style={{fontSize:10,textAlign:"center",padding:"4px 0",borderBottom:"1px solid #0e0e0e",color:isMy&&canClickField?"#8b5cf6":isMy&&activeField?"#a78bfa":"#333"}}>
        {finalPhase?"🎯 Guess the column theme or the final answer!"
          :isMy
            ?canClickField?"👆 Click a field to reveal it"
              :activeField?`Field ${activeField} open — enter answer, theme or final`
              :"Wait for your next turn..."
          :"Waiting for opponent..."}
      </div>

      {/* BOARD */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 6px"}}>
        <div style={S.grid}>

          {/* Column headers */}
          {board.columns.map((col,ci)=>(
            <div key={`h${col.id}`} style={{gridColumn:ci+1,gridRow:1,textAlign:"center",paddingBottom:6,borderBottom:"2px solid #8b5cf633"}}>
              <span style={{fontFamily:"'Black Ops One',cursive",fontSize:20,color:"#8b5cf6",letterSpacing:3,textShadow:"0 0 10px #8b5cf666"}}>{col.id}</span>
            </div>
          ))}
          <div style={{gridColumn:5,gridRow:1,textAlign:"center",paddingBottom:6,borderBottom:"2px solid #2a2a2a"}}>
            <span style={{fontSize:9,color:"#444",letterSpacing:2}}>FINAL</span>
          </div>

          {/* Field cells */}
          {board.columns.map((col,ci)=>
            col.fields.map((field,fi)=>(
              <div key={field.id} style={{gridColumn:ci+1,gridRow:fi+2}}>
                <FieldCell field={field} revealed={!!revealed[field.id]}
                  active={activeField===field.id||gameState?.[`activeField_${oppRole}`]===field.id}
                  canClick={canClickField} canGuess={canGuessField&&activeField===field.id}
                  onReveal={handleReveal} onGuess={handleFieldGuess}/>
              </div>
            ))
          )}

          {/* Final cell */}
          <div style={{gridColumn:5,gridRow:"2 / 6",display:"flex",flexDirection:"column",alignItems:"stretch",justifyContent:"center",gap:8,padding:"0 4px"}}>
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:finalPhase?"#a78bfa0c":"#050505",border:`2px solid ${finalPhase?"#a78bfa44":"#1a1a1a"}`,borderRadius:10,padding:10,textAlign:"center",animation:finalPhase?"glowPulse 2s infinite":"none",minHeight:80}}>
              <div style={{fontSize:9,color:"#444",letterSpacing:1,marginBottom:4}}>FINAL ANSWER</div>
              {finalSolved?<div style={{fontSize:14,fontWeight:900,color:"#22c55e",letterSpacing:2}}>{board.final.answer}</div>:<div style={{fontSize:26,color:"#2a2a2a"}}>?</div>}
              <div style={{fontSize:9,color:"#333",marginTop:4}}>{board.final.hint}</div>
            </div>
          </div>

          {/* Column theme inputs */}
          {board.columns.map((col,ci)=>(
            <div key={`t${col.id}`} style={{gridColumn:ci+1,gridRow:6}}>
              <GuessInput label={`Theme ${col.id}`} solved={!!colSolved[col.id]} solvedText={col.theme}
                disabled={!canGuessAnytime} onGuess={val=>handleColGuess(col.id,val)} accent="#8b5cf6"/>
            </div>
          ))}

          {/* Final guess */}
          <div style={{gridColumn:5,gridRow:6}}>
            <GuessInput label="Final" solved={!!finalSolved} solvedText={board.final.answer}
              disabled={!canGuessAnytime} onGuess={handleFinalGuess} accent="#a78bfa"/>
          </div>

        </div>

        {/* Log */}
        {log.length>0&&(
          <div style={{marginTop:8,padding:"6px 10px",background:"#060606",borderRadius:7,border:"1px solid #111"}}>
            {log.map((l,i)=>(
              <div key={i} style={{fontSize:10,color:i===0?"#bbb":"#3a3a3a",padding:"2px 0",borderBottom:i<log.length-1?"1px solid #0e0e0e":"none"}}>{l}</div>
            ))}
          </div>
        )}
      </div>

      <Footer/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════ */
const S={
  root:{height:"100vh",display:"flex",flexDirection:"column",background:"#030303",fontFamily:"'Rajdhani','Oswald',sans-serif",color:"#fff",overflow:"hidden"},
  card:{width:"100%",maxWidth:520,background:"#090909",border:"1px solid #141414",borderRadius:12,padding:"20px 16px",boxSizing:"border-box"},
  input:{width:"100%",background:"#0e0e0e",border:"1px solid #222",borderRadius:7,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
  btn:{width:"100%",padding:"11px 0",background:"#0e0e0e",color:"#777",border:"1px solid #2a2a2a",borderRadius:7,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:2,transition:"all .2s"},
  statusBar:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",padding:"6px 10px",background:"#080808",borderBottom:"1px solid #0e0e0e",flexShrink:0},
  grid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 120px",gridTemplateRows:"36px repeat(4,1fr) auto",gap:5,width:"100%",maxWidth:820,margin:"0 auto"}
};

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;600;700&display=swap');
  @keyframes revealAnim{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 20px #a78bfa22}50%{box-shadow:0 0 40px #a78bfa55}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
  @keyframes spin{to{transform:rotate(360deg)}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#080808}::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
`;
