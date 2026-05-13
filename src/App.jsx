/* eslint-disable */
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";

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
try { const a = initializeApp(firebaseConfig); db = getDatabase(a); } catch(e) { console.error(e); }

function getUserId() {
  try {
    let id = localStorage.getItem("pgf_uid");
    if (!id) { id = "u_" + Math.random().toString(36).slice(2,12); localStorage.setItem("pgf_uid", id); }
    return id;
  } catch(e) { return "u_" + Math.random().toString(36).slice(2,12); }
}

const ESCROW = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS = [100, 500, 1000];
const TURN_SEC = 30;
const IDLE_SEC = 60;
const P1C = "#e53935";
const P2C = "#1e88e5";

/* ══════════════════════════════════════════════
   8 UNIQUE BOARDS
══════════════════════════════════════════════ */
const BOARDS = [
  { id:0, columns:[
    {id:"A",theme:"ANIMALS",fields:[{id:"A1",clue:"King of jungle",answer:"LION"},{id:"A2",clue:"Black & white",answer:"ZEBRA"},{id:"A3",clue:"Long neck",answer:"GIRAFFE"},{id:"A4",clue:"Trunk & tusks",answer:"ELEPHANT"}]},
    {id:"B",theme:"INSTRUMENTS",fields:[{id:"B1",clue:"6 strings",answer:"GUITAR"},{id:"B2",clue:"88 keys",answer:"PIANO"},{id:"B3",clue:"You hit it",answer:"DRUM"},{id:"B4",clue:"Brass & wind",answer:"TRUMPET"}]},
    {id:"C",theme:"SPORTS",fields:[{id:"C1",clue:"Court & net",answer:"TENNIS"},{id:"C2",clue:"Ice & puck",answer:"HOCKEY"},{id:"C3",clue:"Pool & cap",answer:"SWIMMING"},{id:"C4",clue:"The octagon",answer:"MMA"}]},
    {id:"D",theme:"FOOD",fields:[{id:"D1",clue:"Italian pie",answer:"PIZZA"},{id:"D2",clue:"Japanese roll",answer:"SUSHI"},{id:"D3",clue:"Mexican wrap",answer:"BURRITO"},{id:"D4",clue:"French bread",answer:"BAGUETTE"}]},
  ], final:{answer:"HOBBY",hint:"What people do for fun"} },

  { id:1, columns:[
    {id:"A",theme:"PLANETS",fields:[{id:"A1",clue:"Red planet",answer:"MARS"},{id:"A2",clue:"Ringed giant",answer:"SATURN"},{id:"A3",clue:"Morning star",answer:"VENUS"},{id:"A4",clue:"Blue giant",answer:"NEPTUNE"}]},
    {id:"B",theme:"CAPITALS",fields:[{id:"B1",clue:"Eiffel Tower",answer:"PARIS"},{id:"B2",clue:"Rising sun",answer:"TOKYO"},{id:"B3",clue:"Thames River",answer:"LONDON"},{id:"B4",clue:"Vatican next door",answer:"ROME"}]},
    {id:"C",theme:"SUPERHEROES",fields:[{id:"C1",clue:"Web slinger",answer:"SPIDERMAN"},{id:"C2",clue:"Dark knight",answer:"BATMAN"},{id:"C3",clue:"Iron suit",answer:"IRONMAN"},{id:"C4",clue:"Shield & serum",answer:"CAPTAIN"}]},
    {id:"D",theme:"OCEANS",fields:[{id:"D1",clue:"World's biggest",answer:"PACIFIC"},{id:"D2",clue:"Titanic sank here",answer:"ATLANTIC"},{id:"D3",clue:"Africa & Asia",answer:"INDIAN"},{id:"D4",clue:"North polar sea",answer:"ARCTIC"}]},
  ], final:{answer:"WORLD",hint:"The big picture"} },

  { id:2, columns:[
    {id:"A",theme:"CARS",fields:[{id:"A1",clue:"Italian sports",answer:"FERRARI"},{id:"A2",clue:"German luxury",answer:"BMW"},{id:"A3",clue:"Electric pioneer",answer:"TESLA"},{id:"A4",clue:"Japanese reliable",answer:"TOYOTA"}]},
    {id:"B",theme:"FRUITS",fields:[{id:"B1",clue:"Red & round",answer:"APPLE"},{id:"B2",clue:"Yellow & long",answer:"BANANA"},{id:"B3",clue:"Tropical with crown",answer:"PINEAPPLE"},{id:"B4",clue:"Small & red",answer:"STRAWBERRY"}]},
    {id:"C",theme:"MOUNTAINS",fields:[{id:"C1",clue:"World's highest",answer:"EVEREST"},{id:"C2",clue:"Swiss Alps peak",answer:"MATTERHORN"},{id:"C3",clue:"Africa's highest",answer:"KILIMANJARO"},{id:"C4",clue:"Japan's peak",answer:"FUJI"}]},
    {id:"D",theme:"DANCES",fields:[{id:"D1",clue:"Argentine passion",answer:"TANGO"},{id:"D2",clue:"Cuban rhythm",answer:"SALSA"},{id:"D3",clue:"Spanish flamenco",answer:"FLAMENCO"},{id:"D4",clue:"Hawaiian hip",answer:"HULA"}]},
  ], final:{answer:"CULTURE",hint:"Expressions of civilization"} },

  { id:3, columns:[
    {id:"A",theme:"COLORS",fields:[{id:"A1",clue:"Sky color",answer:"BLUE"},{id:"A2",clue:"Grass color",answer:"GREEN"},{id:"A3",clue:"Fire color",answer:"RED"},{id:"A4",clue:"Night color",answer:"BLACK"}]},
    {id:"B",theme:"COUNTRIES",fields:[{id:"B1",clue:"Eiffel Tower",answer:"FRANCE"},{id:"B2",clue:"Great Wall",answer:"CHINA"},{id:"B3",clue:"Machu Picchu",answer:"PERU"},{id:"B4",clue:"Pyramids & Sphinx",answer:"EGYPT"}]},
    {id:"C",theme:"ELEMENTS",fields:[{id:"C1",clue:"Periodic table 1",answer:"HYDROGEN"},{id:"C2",clue:"Bling bling metal",answer:"GOLD"},{id:"C3",clue:"We breathe it",answer:"OXYGEN"},{id:"C4",clue:"Diamond & pencil",answer:"CARBON"}]},
    {id:"D",theme:"BOARD GAMES",fields:[{id:"D1",clue:"32 pieces",answer:"CHESS"},{id:"D2",clue:"Roll & buy",answer:"MONOPOLY"},{id:"D3",clue:"Falling blocks",answer:"TETRIS"},{id:"D4",clue:"52 cards",answer:"POKER"}]},
  ], final:{answer:"CLASSIC",hint:"Stands the test of time"} },

  { id:4, columns:[
    {id:"A",theme:"BIRDS",fields:[{id:"A1",clue:"Eagle cousin",answer:"HAWK"},{id:"A2",clue:"Wise night bird",answer:"OWL"},{id:"A3",clue:"Tropical colors",answer:"PARROT"},{id:"A4",clue:"Fast runner",answer:"OSTRICH"}]},
    {id:"B",theme:"RIVERS",fields:[{id:"B1",clue:"Longest in world",answer:"NILE"},{id:"B2",clue:"Amazon jungle",answer:"AMAZON"},{id:"B3",clue:"Through Paris",answer:"SEINE"},{id:"B4",clue:"China's sorrow",answer:"YANGTZE"}]},
    {id:"C",theme:"MOVIES",fields:[{id:"C1",clue:"Simba & Mufasa",answer:"LIONKING"},{id:"C2",clue:"Epic space saga",answer:"STARWARS"},{id:"C3",clue:"Ring quest saga",answer:"LOTR"},{id:"C4",clue:"Blue alien world",answer:"AVATAR"}]},
    {id:"D",theme:"LANGUAGES",fields:[{id:"D1",clue:"Most spoken",answer:"MANDARIN"},{id:"D2",clue:"Shakespeare spoke",answer:"ENGLISH"},{id:"D3",clue:"Cervantes wrote",answer:"SPANISH"},{id:"D4",clue:"Amour language",answer:"FRENCH"}]},
  ], final:{answer:"JOURNEY",hint:"A trip through life"} },

  { id:5, columns:[
    {id:"A",theme:"SCIENTISTS",fields:[{id:"A1",clue:"Gravity apple",answer:"NEWTON"},{id:"A2",clue:"Relativity genius",answer:"EINSTEIN"},{id:"A3",clue:"Evolution theory",answer:"DARWIN"},{id:"A4",clue:"Radium discovery",answer:"CURIE"}]},
    {id:"B",theme:"DESSERTS",fields:[{id:"B1",clue:"Italian ice cream",answer:"GELATO"},{id:"B2",clue:"French pastry",answer:"ECLAIR"},{id:"B3",clue:"Chocolate lava",answer:"BROWNIE"},{id:"B4",clue:"Layered cream cake",answer:"TIRAMISU"}]},
    {id:"C",theme:"SPORTS TEAMS",fields:[{id:"C1",clue:"NY pinstripes",answer:"YANKEES"},{id:"C2",clue:"Chicago bulls",answer:"BULLS"},{id:"C3",clue:"Manchester red",answer:"UNITED"},{id:"C4",clue:"LA purple & gold",answer:"LAKERS"}]},
    {id:"D",theme:"GEMS",fields:[{id:"D1",clue:"Hardest gem",answer:"DIAMOND"},{id:"D2",clue:"Red ring gem",answer:"RUBY"},{id:"D3",clue:"Blue ring gem",answer:"SAPPHIRE"},{id:"D4",clue:"Green gem",answer:"EMERALD"}]},
  ], final:{answer:"LEGEND",hint:"Something timeless & famous"} },

  { id:6, columns:[
    {id:"A",theme:"COMPOSERS",fields:[{id:"A1",clue:"Fifth symphony",answer:"BEETHOVEN"},{id:"A2",clue:"Four seasons",answer:"VIVALDI"},{id:"A3",clue:"Magic flute",answer:"MOZART"},{id:"A4",clue:"G string air",answer:"BACH"}]},
    {id:"B",theme:"TECH GIANTS",fields:[{id:"B1",clue:"Bitten apple",answer:"APPLE"},{id:"B2",clue:"Search giant",answer:"GOOGLE"},{id:"B3",clue:"Social network",answer:"FACEBOOK"},{id:"B4",clue:"Everything store",answer:"AMAZON"}]},
    {id:"C",theme:"PHILOSOPHERS",fields:[{id:"C1",clue:"I think therefore",answer:"DESCARTES"},{id:"C2",clue:"Cave allegory",answer:"PLATO"},{id:"C3",clue:"Golden mean",answer:"ARISTOTLE"},{id:"C4",clue:"Thus spoke",answer:"NIETZSCHE"}]},
    {id:"D",theme:"WEATHER",fields:[{id:"D1",clue:"Twister & funnel",answer:"TORNADO"},{id:"D2",clue:"Lightning & rain",answer:"STORM"},{id:"D3",clue:"Eye of storm",answer:"HURRICANE"},{id:"D4",clue:"Cold white blanket",answer:"BLIZZARD"}]},
  ], final:{answer:"POWER",hint:"Force that shapes everything"} },

  { id:7, columns:[
    {id:"A",theme:"COCKTAILS",fields:[{id:"A1",clue:"James Bond's drink",answer:"MARTINI"},{id:"A2",clue:"Rum & mint",answer:"MOJITO"},{id:"A3",clue:"Tequila & lime",answer:"MARGARITA"},{id:"A4",clue:"Pina & colada",answer:"PINACOLADA"}]},
    {id:"B",theme:"ARTISTS",fields:[{id:"B1",clue:"Mona Lisa painter",answer:"DAVINCI"},{id:"B2",clue:"Sunflowers painter",answer:"VANGOGH"},{id:"B3",clue:"Cubism pioneer",answer:"PICASSO"},{id:"B4",clue:"Sistine chapel",answer:"MICHELANGELO"}]},
    {id:"C",theme:"CURRENCIES",fields:[{id:"C1",clue:"USA money",answer:"DOLLAR"},{id:"C2",clue:"Europe money",answer:"EURO"},{id:"C3",clue:"Japan money",answer:"YEN"},{id:"C4",clue:"UK money",answer:"POUND"}]},
    {id:"D",theme:"SHARKS",fields:[{id:"D1",clue:"Great & white",answer:"GREATWHITE"},{id:"D2",clue:"Hammer shaped",answer:"HAMMERHEAD"},{id:"D3",clue:"Bull & reef",answer:"BULL"},{id:"D4",clue:"Filter feeder",answer:"WHALE"}]},
  ], final:{answer:"TREASURE",hint:"Something valuable & sought"} },
];

// Truly random board selection using timestamp + random
function getRandomBoard() {
  const seed = Math.floor(Date.now() * Math.random() * 137) % BOARDS.length;
  const board = BOARDS[seed];
  return JSON.parse(JSON.stringify(board)); // deep clone
}

function nrm(s) { return s.trim().toUpperCase().replace(/[^A-Z0-9]/g,""); }
function hit(a,b) { return nrm(a)===nrm(b); }
function genId() { return Math.random().toString(36).slice(2,8).toUpperCase(); }

async function connectPhantom() {
  try {
    if (!window.solana?.isPhantom) { window.open("https://phantom.app/","_blank"); return null; }
    const r = await window.solana.connect(); return r.publicKey.toString();
  } catch(e) { return null; }
}
async function signWager(amount) {
  try {
    if (!window.solana?.isPhantom) return { ok:false, err:"No Phantom" };
    await window.solana.signMessage(new TextEncoder().encode(`Wager ${amount} FREEDOM to ${ESCROW}`),"utf8");
    return { ok:true, id:"SIG_"+Date.now() };
  } catch(e) { return { ok:false, err:e.message }; }
}

/* ══════════════════════════════════════════════
   FIELD CELL — 4:1 ratio using paddingBottom trick
══════════════════════════════════════════════ */
function Field({ field, state, solvedBy, canOpen, onOpen }) {
  const bg =
    state === "solved" ? (solvedBy==="p1" ? P1C : P2C) :
    state === "clue"   ? "#c47d0e" :
    canOpen            ? "#5a7595" : "#3d5068";

  const shadow =
    state === "solved" ? "0 4px 0 rgba(0,0,0,.4)" :
    canOpen            ? "0 3px 0 rgba(0,0,0,.35)" : "none";

  const outer = {
    position:"relative", width:"100%", paddingBottom:"25%", // 4:1 ratio
    borderRadius:8, overflow:"hidden", userSelect:"none",
    background:bg, boxShadow:shadow,
    cursor: canOpen && state==="hidden" ? "pointer" : "default",
    transition:"all .15s",
  };
  const inner = {
    position:"absolute", inset:0,
    display:"flex", alignItems:"center", justifyContent:"center",
    flexDirection:"column", gap:2, padding:"4px 6px",
  };

  if (state==="solved") return (
    <div style={outer}>
      <div style={inner}>
        <div style={{fontSize:"clamp(10px,1.1vw,14px)",fontWeight:900,color:"#fff",textAlign:"center",letterSpacing:.5}}>{field.answer}</div>
        <div style={{fontSize:"clamp(8px,.85vw,10px)",color:"rgba(255,255,255,.75)",textAlign:"center"}}>{field.clue}</div>
      </div>
    </div>
  );
  if (state==="clue") return (
    <div style={{...outer,border:"2px solid rgba(255,255,255,.7)"}}>
      <div style={inner}>
        <div style={{fontSize:"clamp(7px,.7vw,9px)",color:"rgba(255,255,255,.85)",letterSpacing:1,fontWeight:700}}>CLUE</div>
        <div style={{fontSize:"clamp(9px,1vw,13px)",color:"#fff",textAlign:"center",fontWeight:700,lineHeight:1.2}}>{field.clue}</div>
      </div>
    </div>
  );
  return (
    <div onClick={canOpen?()=>onOpen(field.id):undefined} style={outer}
      onMouseEnter={e=>{ if(canOpen){e.currentTarget.style.background="#6a88a8";e.currentTarget.style.boxShadow="0 4px 0 rgba(0,0,0,.4)";} }}
      onMouseLeave={e=>{ if(canOpen){e.currentTarget.style.background="#5a7595";e.currentTarget.style.boxShadow="0 3px 0 rgba(0,0,0,.35)";} }}>
      <div style={inner}>
        <span style={{fontSize:"clamp(12px,1.2vw,18px)",fontWeight:900,color:canOpen?"#c8d8e8":"#3a4a5a",letterSpacing:1}}>{field.id}</span>
      </div>
    </div>
  );
}

/* ── THEME INPUT ── */
function ThemeInput({ colId, solved, solvedBy, theme, disabled, onGuess, height }) {
  const [editing,setEditing]=useState(false);
  const [v,setV]=useState(""); const [err,setErr]=useState(false);
  const sc = solvedBy==="p1"?P1C:P2C;
  const h = height || 48;

  if (solved) return (
    <div style={{width:"100%",height:h,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:sc,boxShadow:"0 3px 0 rgba(0,0,0,.35)"}}>
      <span style={{fontSize:"clamp(10px,1vw,13px)",fontWeight:900,color:"#fff",textAlign:"center",padding:"0 6px"}}>✓ {theme}</span>
    </div>
  );
  const sub=()=>{ if(!v.trim()) return; if(!onGuess(v)){setErr(true);setTimeout(()=>setErr(false),600);}else{setV("");setEditing(false);} };
  if (!disabled&&editing) return (
    <div style={{width:"100%",height:h,borderRadius:8,display:"flex",alignItems:"center",gap:4,padding:"0 6px",background:"#fff",animation:err?"shake .4s":"none",boxSizing:"border-box"}}>
      <input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sub();if(e.key==="Escape")setEditing(false);}}
        placeholder={`Col ${colId}...`} autoFocus
        style={{flex:1,background:"transparent",border:"none",fontSize:12,fontWeight:700,outline:"none",fontFamily:"inherit",color:"#1a2a4a",minWidth:0}}/>
      <button onClick={sub} style={{background:"#3d5068",border:"none",borderRadius:6,padding:"4px 8px",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:10,flexShrink:0}}>OK</button>
      <button onClick={()=>setEditing(false)} style={{background:"#ddd",border:"none",borderRadius:6,padding:"4px 6px",color:"#666",fontWeight:700,cursor:"pointer",fontSize:10}}>✕</button>
    </div>
  );
  return (
    <div onClick={disabled?undefined:()=>setEditing(true)}
      style={{width:"100%",height:h,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:disabled?"#2a3a55":"rgba(255,255,255,.15)",border:`2px dashed ${disabled?"#3a4a6b":"#8ab0d0"}`,cursor:disabled?"default":"pointer",transition:"all .15s"}}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.background="rgba(255,255,255,.25)"; }}
      onMouseLeave={e=>{ if(!disabled) e.currentTarget.style.background="rgba(255,255,255,.15)"; }}>
      <span style={{fontSize:20,color:disabled?"#3a4a6b":"#a0c4e0",fontWeight:900}}>?</span>
    </div>
  );
}

/* ── FINAL INPUT ── */
function FinalInput({ solved, solvedBy, answer, disabled, onGuess, height }) {
  const [editing,setEditing]=useState(false);
  const [v,setV]=useState(""); const [err,setErr]=useState(false);
  const sc = solvedBy==="p1"?P1C:P2C;
  const h = height || 56;

  if (solved) return (
    <div style={{width:"100%",height:h,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:sc,boxShadow:"0 4px 0 rgba(0,0,0,.4)"}}>
      <span style={{fontSize:16,fontWeight:900,color:"#fff",letterSpacing:1}}>✓ {answer}</span>
    </div>
  );
  const sub=()=>{ if(!v.trim()) return; if(!onGuess(v)){setErr(true);setTimeout(()=>setErr(false),600);}else{setV("");setEditing(false);} };
  if (!disabled&&editing) return (
    <div style={{width:"100%",height:h,borderRadius:10,display:"flex",alignItems:"center",gap:8,padding:"0 12px",background:"#fff",animation:err?"shake .4s":"none",boxSizing:"border-box"}}>
      <input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sub();if(e.key==="Escape")setEditing(false);}}
        placeholder="Final answer..." autoFocus
        style={{flex:1,background:"transparent",border:"none",fontSize:15,fontWeight:700,outline:"none",fontFamily:"inherit",color:"#1a2a4a",textAlign:"center"}}/>
      <button onClick={sub} style={{background:"#f59e0b",border:"none",borderRadius:8,padding:"8px 16px",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:13,flexShrink:0}}>OK</button>
    </div>
  );
  return (
    <div onClick={disabled?undefined:()=>setEditing(true)}
      style={{width:"100%",height:h,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:disabled?"#2a3a55":"rgba(255,255,255,.15)",border:`3px dashed ${disabled?"#3a4a6b":"#f59e0b"}`,cursor:disabled?"default":"pointer",transition:"all .15s"}}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.background="rgba(255,255,255,.25)"; }}
      onMouseLeave={e=>{ if(!disabled) e.currentTarget.style.background="rgba(255,255,255,.15)"; }}>
      <span style={{fontSize:26,color:disabled?"#3a4a6b":"#f59e0b",fontWeight:900}}>?</span>
    </div>
  );
}

/* ── MOBILE FIELD (fixed height, simpler) ── */
function MobileField({ field, state, solvedBy, canOpen, onOpen }) {
  const bg =
    state === "solved" ? (solvedBy==="p1" ? P1C : P2C) :
    state === "clue"   ? "#c47d0e" :
    canOpen            ? "#5a7595" : "#3d5068";
  const base = {width:"100%",height:54,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:2,padding:"0 8px",boxSizing:"border-box",userSelect:"none",border:"none",fontFamily:"inherit",transition:"all .15s",cursor:canOpen&&state==="hidden"?"pointer":"default",background:bg,boxShadow:state==="solved"?"0 3px 0 rgba(0,0,0,.35)":canOpen?"0 2px 0 rgba(0,0,0,.3)":"none"};
  if (state==="solved") return <div style={base}><div style={{fontSize:13,fontWeight:900,color:"#fff",letterSpacing:.5,textAlign:"center"}}>{field.answer}</div><div style={{fontSize:9,color:"rgba(255,255,255,.75)",textAlign:"center"}}>{field.clue}</div></div>;
  if (state==="clue") return <div style={{...base,border:"2px solid rgba(255,255,255,.6)"}}><div style={{fontSize:8,color:"rgba(255,255,255,.8)"}}>CLUE</div><div style={{fontSize:12,color:"#fff",textAlign:"center",fontWeight:700}}>{field.clue}</div></div>;
  return <div onClick={canOpen?()=>onOpen(field.id):undefined} style={base} onMouseEnter={e=>{if(canOpen)e.currentTarget.style.background="#6a88a8";}} onMouseLeave={e=>{if(canOpen)e.currentTarget.style.background="#5a7595";}}><div style={{fontSize:15,fontWeight:900,color:canOpen?"#c8d8e8":"#3a4a5a",letterSpacing:1}}>{field.id}</div></div>;
}

function Spin({msg}) {
  return <div style={ROOT}><style>{CSS}</style><div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
    <div style={{width:52,height:52,border:"4px solid rgba(255,255,255,.1)",borderTop:"4px solid #f59e0b",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <div style={{color:"rgba(255,255,255,.6)",fontSize:13,letterSpacing:2}}>{msg}</div>
  </div></div>;
}

export default function App() {
  const [uid]=useState(()=>getUserId());
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
  const [didOpen,setDidOpen]=useState(false);
  const [log,setLog]=useState([]);
  const [isDesktop,setIsDesktop]=useState(window.innerWidth>=768);

  const tRef=useRef(); const iRef=useRef();
  const lastAct=useRef(Date.now());
  const rRef=useRef(null);

  const L=m=>setLog(p=>[m,...p].slice(0,4));
  const touch=()=>{ lastAct.current=Date.now(); setItimer(IDLE_SEC); };

  useEffect(()=>{
    const check=()=>setIsDesktop(window.innerWidth>=768);
    window.addEventListener("resize",check);
    return()=>window.removeEventListener("resize",check);
  },[]);

  useEffect(()=>{
    try { if(window.solana?.isPhantom&&window.solana.publicKey) setWallet(window.solana.publicKey.toString()); } catch(e){}
  },[]);

  useEffect(()=>{
    if(!roomId||!db) return;
    try {
      rRef.current=ref(db,`games/${roomId}`);
      const unsub=onValue(rRef.current,snap=>{
        const d=snap.val(); if(!d) return;
        setGs(d);
        if(d.status==="finished") setScr("result");
        if(d.status==="active"&&d.p1&&d.p2&&!started){ setStarted(true); lastAct.current=Date.now(); }
      });
      return()=>unsub();
    } catch(e){ console.error(e); }
  },[roomId,started]);

  useEffect(()=>{
    if(scr!=="game"||!started||!gs) return;
    if(gs.status==="finished"||gs.finalPhase||gs.currentTurn!==myRole) return;
    clearInterval(tRef.current); setTtimer(TURN_SEC);
    tRef.current=setInterval(()=>{
      setTtimer(t=>{ if(t<=1){clearInterval(tRef.current);autoReveal();return TURN_SEC;} return t-1; });
    },1000);
    return()=>clearInterval(tRef.current);
  },[gs?.currentTurn,gs?.finalPhase,scr,started]);

  useEffect(()=>{
    if(!gs?.finalPhase||gs?.status==="finished"||!started) return;
    clearInterval(iRef.current);
    iRef.current=setInterval(()=>{
      const rem=IDLE_SEC-Math.floor((Date.now()-lastAct.current)/1000);
      setItimer(Math.max(0,rem));
      if(rem<=0){
        clearInterval(iRef.current);
        const p1=gs.scores?.p1||0, p2=gs.scores?.p2||0;
        doEnd(p1>=p2?"p1":"p2",`Time's up! ${p1>=p2?myRole==="p1"?myNm:opNm:myRole==="p2"?myNm:opNm} wins by points!`);
      }
    },1000);
    return()=>clearInterval(iRef.current);
  },[gs?.finalPhase,gs?.status,started]);

  useEffect(()=>{
    if(!gs||gs.finalPhase||gs.status==="finished"||!gs.board) return;
    const total=gs.board.columns.reduce((s,c)=>s+c.fields.length,0);
    if(Object.keys(gs.revealed||{}).length>=total){ update(rRef.current,{finalPhase:true}); L("🎯 All fields open!"); }
  },[gs?.revealed]);

  useEffect(()=>{
    if(scr!=="waiting"||!roomId||!db) return;
    try {
      const unsub=onValue(ref(db,`games/${roomId}`),snap=>{
        const d=snap.val();
        if(d?.status==="active"&&d.p1&&d.p2){ setGs(d);setStarted(true);lastAct.current=Date.now();setScr("game");L("Opponent joined! Your turn!"); }
      });
      return()=>unsub();
    } catch(e){ console.error(e); }
  },[scr,roomId]);

  async function doWallet(){ setWload(true); const a=await connectPhantom(); if(a) setWallet(a); setWload(false); }

  async function doCreate(){
    if(!nm.trim()||!uid) return;
    if(!wallet){alert("Connect Phantom wallet first!");return;}
    setScr("loading"); setLdmsg("Preparing new board...");
    const board=getRandomBoard();
    await new Promise(r=>setTimeout(r,600));
    setLdmsg("Confirming wager...");
    const tx=await signWager(wager);
    if(!tx.ok){alert("Wager failed: "+tx.err);setScr("lobby");return;}
    const id=genId();
    try {
      await set(ref(db,`games/${id}`),{
        p1:uid,p1name:nm,p1wallet:wallet,p2:null,p2name:null,p2wallet:null,
        status:"waiting",wager,board,scores:{p1:0,p2:0},revealed:{},
        colSolved:{A:null,B:null,C:null,D:null},
        finalSolved:null,finalPhase:false,currentTurn:"p1",
        lastActivity:Date.now(),winner:null,p1tx:tx.id,boardId:board.id
      });
      setRoomId(id);setMyRole("p1");setStarted(false);setScr("waiting");
    } catch(e){alert("Firebase error: "+e.message);setScr("lobby");}
  }

  async function doJoin(){
    const id=jin.trim().toUpperCase();
    if(!nm.trim()||!uid||id.length<6) return;
    if(!wallet){alert("Connect Phantom wallet first!");return;}
    setJerr(""); setScr("loading"); setLdmsg("Looking for room "+id+"...");
    try {
      const snap=await get(ref(db,`games/${id}`));
      if(!snap.exists()){setJerr("Room "+id+" not found!");setScr("lobby");return;}
      const d=snap.val();
      if(d.status!=="waiting"){setJerr("Room already started!");setScr("lobby");return;}
      if(d.p1===uid){setJerr("Can't join your own room!");setScr("lobby");return;}
      const tx=await signWager(d.wager);
      if(!tx.ok){alert("Wager failed: "+tx.err);setScr("lobby");return;}
      await update(ref(db,`games/${id}`),{p2:uid,p2name:nm,p2wallet:wallet,status:"active",currentTurn:"p1",lastActivity:Date.now(),p2tx:tx.id});
      setWager(d.wager);setRoomId(id);setMyRole("p2");setStarted(true);lastAct.current=Date.now();
      setScr("game");L("Joined! P2. P1 goes first.");
    } catch(e){setJerr("Error: "+e.message);setScr("lobby");}
  }

  async function doOpen(fid){
    if(!isMy||didOpen||gs?.finalPhase||!started) return;
    touch();setDidOpen(true);
    await update(rRef.current,{[`revealed/${fid}`]:"clue",lastActivity:Date.now()});
    L("Field "+fid+" opened!");
  }

  async function autoReveal(){
    if(!gs?.board||!rRef.current) return;
    const all=gs.board.columns.flatMap(c=>c.fields);
    const hidden=all.filter(f=>!gs.revealed?.[f.id]);
    if(!hidden.length){await update(rRef.current,{finalPhase:true});return;}
    const pick=hidden[Math.floor(Math.random()*hidden.length)];
    await update(rRef.current,{[`revealed/${pick.id}`]:"clue",lastActivity:Date.now()});
    L("⏱ "+pick.id+" auto-revealed.");await doPass();
  }

  async function doGuessCol(cid,val){
    touch();
    const col=gs.board.columns.find(c=>c.id===cid);
    if(!col||gs.colSolved?.[cid]) return false;
    if(hit(val,col.theme)){
      const upd={};
      col.fields.forEach(f=>{ upd[`revealed/${f.id}`]="solved_"+myRole; });
      upd[`colSolved/${cid}`]=myRole;
      upd[`scores/${myRole}`]=(gs.scores?.[myRole]||0)+20;
      upd.lastActivity=Date.now();
      await update(rRef.current,upd);
      L("✅ Column "+cid+': "'+col.theme+'" +20pts!');
      return true;
    }
    L("❌ Wrong. Opponent's turn!");
    await doPass();return false;
  }

  async function doGuessFinal(val){
    touch();
    if(hit(val,gs.board.final.answer)){
      await update(rRef.current,{finalSolved:myRole,[`scores/${myRole}`]:(gs.scores?.[myRole]||0)+30,lastActivity:Date.now()});
      doEnd(myRole,"Final answer correct! +30pts 🎉");return true;
    }
    L("❌ Wrong final. Opponent's turn!");await doPass();return false;
  }

  async function doPass(){ clearInterval(tRef.current);setDidOpen(false);await update(rRef.current,{currentTurn:myRole==="p1"?"p2":"p1",lastActivity:Date.now()}); }

  async function doEnd(w,reason){
    clearInterval(tRef.current);clearInterval(iRef.current);
    if(!rRef.current) return;
    await update(rRef.current,{status:"finished",winner:w,winReason:reason,finishedAt:Date.now()});
    if(!gs) return;
    const sc=gs.scores||{p1:0,p2:0};
    for(const r of["p1","p2"]){
      const u=gs[r];if(!u) continue;
      const lb=ref(db,`leaderboard/${u}`);const sn=await get(lb);const cv=sn.val()||{wins:0,losses:0,points:0,tokensWon:0};
      await set(lb,{name:r==="p1"?gs.p1name:gs.p2name,wins:(cv.wins||0)+(w===r?1:0),losses:(cv.losses||0)+(w===r?0:1),points:(cv.points||0)+(sc[r]||0),tokensWon:(cv.tokensWon||0)+(w===r?wager*2:0)});
    }
  }

  function doReset(){ setScr("lobby");setRoomId(null);setMyRole(null);setGs(null);setDidOpen(false);setLog([]);setJin("");setJerr("");setStarted(false); }

  const board=gs?.board||null;
  const isMy=gs?.currentTurn===myRole;
  const scores=gs?.scores||{p1:0,p2:0};
  const revealed=gs?.revealed||{};
  const colSolved=gs?.colSolved||{};
  const finalSolved=gs?.finalSolved||null;
  const finalPhase=gs?.finalPhase||false;
  const winner=gs?.winner||null;
  const winReason=gs?.winReason||"";
  const myNm=myRole==="p1"?gs?.p1name||"P1":gs?.p2name||"P2";
  const opNm=myRole==="p1"?gs?.p2name||"P2":gs?.p1name||"P1";
  const myScore=myRole==="p1"?scores.p1:scores.p2;
  const opScore=myRole==="p1"?scores.p2:scores.p1;
  const canOpen=isMy&&!didOpen&&!finalPhase&&!winner&&gs?.status==="active"&&started;
  const canGuess=isMy&&(didOpen||finalPhase)&&!winner&&gs?.status==="active"&&started;
  const fst=fid=>{ const r=revealed[fid]; if(!r) return {state:"hidden",solvedBy:null}; if(r==="clue") return {state:"clue",solvedBy:null}; if(r==="solved_p1") return {state:"solved",solvedBy:"p1"}; if(r==="solved_p2") return {state:"solved",solvedBy:"p2"}; return {state:"clue",solvedBy:null}; };

  /* ── LOBBY ── */
  if(scr==="lobby") return(
    <div style={ROOT}><style>{CSS}</style>
      <div style={{background:"#0f1a30",padding:"12px 16px",borderBottom:"2px solid #f59e0b",textAlign:"center",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:2}}>
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><polygon points="32,2 54,16 54,40 32,54 10,40 10,16" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity=".6"/><circle cx="32" cy="26" r="16" fill="#fff" opacity=".93"/><rect x="24" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93"/><rect x="33" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93"/><ellipse cx="26" cy="24" rx="4.5" ry="5.5" fill="#111"/><ellipse cx="38" cy="24" rx="4.5" ry="5.5" fill="#111"/><ellipse cx="26" cy="23" rx="1.5" ry="2" fill="#8b5cf6" opacity=".9"/><ellipse cx="38" cy="23" rx="1.5" ry="2" fill="#22c55e" opacity=".9"/><path d="M28 34 L32 31 L36 34" stroke="#333" strokeWidth="1.5" fill="none"/></svg>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:22,color:"#22c55e",letterSpacing:4,textShadow:"0 0 16px #22c55e88"}}>FREEDOM</div>
        </div>
        <div style={{fontFamily:"'Black Ops One',cursive",fontSize:11,color:"#f59e0b",letterSpacing:4}}>ASSOCIATIONS</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        <div style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"10px",marginBottom:10,border:"1px solid rgba(255,255,255,.1)"}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:2,marginBottom:6}}>PHANTOM WALLET</div>
          {wallet?(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 8px #22c55e"}}/>
              <span style={{fontSize:11,color:"#22c55e",fontFamily:"monospace"}}>{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
              <span style={{fontSize:9,color:"rgba(255,255,255,.3)",marginLeft:"auto"}}>✓ Connected</span>
            </div>
          ):(
            <button onClick={doWallet} disabled={wload} style={{width:"100%",padding:"10px 0",background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1}}>
              {wload?"CONNECTING...":"🔗 CONNECT PHANTOM WALLET"}
            </button>
          )}
        </div>
        <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="Your name / username" maxLength={16} style={{width:"100%",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:12,padding:"11px 14px",color:"#fff",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:2,marginBottom:6}}>WAGER — FREEDOM TOKENS</div>
          <div style={{display:"flex",gap:8}}>
            {WAGERS.map(w=><button key={w} onClick={()=>setWager(w)} style={{flex:1,padding:"10px 0",borderRadius:10,fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",background:wager===w?"#f59e0b":"rgba(255,255,255,.1)",color:wager===w?"#fff":"rgba(255,255,255,.7)",border:`2px solid ${wager===w?"#f59e0b":"rgba(255,255,255,.2)"}`}}>{w}</button>)}
          </div>
        </div>
        <div style={{display:"flex",borderRadius:12,overflow:"hidden",border:"1px solid rgba(255,255,255,.15)",marginBottom:10}}>
          {[["create","🎮 CREATE"],["join","🚪 JOIN"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setJerr("");}} style={{flex:1,padding:"11px 0",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",background:mode===m?"#f59e0b":"transparent",color:mode===m?"#fff":"rgba(255,255,255,.5)",border:"none",letterSpacing:1}}>{l}</button>
          ))}
        </div>
        {mode==="create"&&<button onClick={doCreate} disabled={!nm.trim()||!wallet} style={{width:"100%",padding:"14px 0",background:nm.trim()&&wallet?"linear-gradient(90deg,#f59e0b,#d97706)":"rgba(255,255,255,.1)",color:nm.trim()&&wallet?"#fff":"rgba(255,255,255,.3)",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:14,fontWeight:900,cursor:nm.trim()&&wallet?"pointer":"default",letterSpacing:2,boxShadow:nm.trim()&&wallet?"0 4px 0 rgba(0,0,0,.3)":"none"}}>🎮 CREATE ROOM</button>}
        {mode==="join"&&<div>
          <div style={{fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:2,marginBottom:6}}>ENTER ROOM ID</div>
          <input value={jin} onChange={e=>{setJin(e.target.value.toUpperCase());setJerr("");}} maxLength={6} placeholder="ABC123" style={{width:"100%",background:"rgba(255,255,255,.1)",border:`2px solid ${jin.length===6?"#22c55e":"rgba(255,255,255,.2)"}`,borderRadius:12,padding:"12px",color:"#22c55e",fontSize:24,outline:"none",fontFamily:"'Black Ops One',cursive",boxSizing:"border-box",textAlign:"center",letterSpacing:10,marginBottom:6}}/>
          {jerr&&<div style={{padding:"7px 10px",background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.4)",borderRadius:8,fontSize:11,color:"#ef4444",marginBottom:6}}>⚠ {jerr}</div>}
          <button onClick={doJoin} disabled={!nm.trim()||!wallet||jin.length<6} style={{width:"100%",padding:"14px 0",background:jin.length===6&&nm.trim()&&wallet?"linear-gradient(90deg,#22c55e,#16a34a)":"rgba(255,255,255,.1)",color:jin.length===6&&nm.trim()&&wallet?"#fff":"rgba(255,255,255,.3)",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:14,fontWeight:900,cursor:jin.length===6&&nm.trim()&&wallet?"pointer":"default",letterSpacing:2}}>🚪 JOIN ROOM</button>
        </div>}
        <div style={{marginTop:12,background:"rgba(255,255,255,.05)",borderRadius:12,padding:"10px",border:"1px solid rgba(255,255,255,.1)"}}>
          <div style={{color:"#f59e0b",fontSize:10,fontWeight:700,letterSpacing:2,marginBottom:6}}>RULES</div>
          {[["30s/turn","Open 1 field per turn. Timer starts when both join."],["Guessing","Correct = keep turn. Wrong = opponent's turn."],["Time up","30s expire = random field auto-reveals."],["Final","All fields open: 60s idle = winner by POINTS."],["Points","Column theme +20 · Final answer +30"]].map(([t,d],i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:4}}>
              <span style={{fontSize:9,color:"#f59e0b",fontWeight:700,whiteSpace:"nowrap",minWidth:55}}>{t}</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.5)",lineHeight:1.4}}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:12,paddingBottom:6}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:11,letterSpacing:2}}><span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"rgba(255,255,255,.3)"}}>.FUN</span></span></div>
      </div>
    </div>
  );

  if(scr==="loading") return <Spin msg={ldmsg}/>;

  if(scr==="waiting") return(
    <div style={ROOT}><style>{CSS}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:20}}>
        <div style={{width:56,height:56,border:"4px solid rgba(255,255,255,.1)",borderTop:"4px solid #22c55e",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{fontFamily:"'Black Ops One',cursive",fontSize:13,color:"#22c55e",letterSpacing:3}}>WAITING FOR OPPONENT</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>Wager: <b style={{color:"#f59e0b"}}>{wager}</b> FREEDOM tokens</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:8}}>SHARE ROOM ID:</div>
          <div style={{fontSize:42,fontFamily:"'Black Ops One',cursive",color:"#22c55e",letterSpacing:10,padding:"14px 28px",background:"rgba(34,197,94,.1)",border:"2px solid rgba(34,197,94,.4)",borderRadius:12}}>{roomId}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:8}}>Opponent → JOIN ROOM → enter this code</div>
        </div>
        <button onClick={()=>{try{set(ref(db,`games/${roomId}`),null);}catch(e){} setScr("lobby");setRoomId(null);setMyRole(null);setStarted(false);}} style={{padding:"10px 22px",background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer"}}>CANCEL</button>
      </div>
    </div>
  );

  if(scr==="result"||winner) return(
    <div style={ROOT}><style>{CSS}</style>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{width:"100%",maxWidth:380,background:"#0f1a30",borderRadius:20,padding:"24px 18px",textAlign:"center",border:"2px solid rgba(255,255,255,.1)"}}>
          <div style={{fontSize:56}}>{winner===myRole?"🏆":"💀"}</div>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:24,letterSpacing:3,marginTop:6,color:winner===myRole?"#22c55e":"#ef4444"}}>{winner===myRole?"YOU WIN!":"YOU LOSE"}</div>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:12,marginTop:5,marginBottom:18}}>{winReason}</div>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:18}}>
            {["p1","p2"].map(r=>(
              <div key={r} style={{flex:1,padding:"12px",borderRadius:12,background:r===winner?"rgba(34,197,94,.1)":"rgba(255,255,255,.05)",border:`2px solid ${r===winner?"#22c55e":"rgba(255,255,255,.1)"}`}}>
                <div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>{r===myRole?myNm:opNm}</div>
                <div style={{fontSize:30,fontWeight:900,color:r===winner?"#22c55e":"#fff"}}>{r==="p1"?scores.p1:scores.p2}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>pts</div>
              </div>
            ))}
          </div>
          {winner===myRole&&<div style={{color:"#f59e0b",fontSize:12,marginBottom:14}}>🎉 Winnings: <b>{wager*2}</b> FREEDOM tokens</div>}
          <button onClick={doReset} style={{width:"100%",padding:"13px",background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:13,fontWeight:900,cursor:"pointer",letterSpacing:2,boxShadow:"0 4px 0 rgba(0,0,0,.3)"}}>NEW GAME</button>
        </div>
      </div>
    </div>
  );

  if(!board) return <Spin msg="Loading..."/>;
  const [colA,colB,colC,colD]=board.columns;

  /* ── SHARED SCOREBOARD ── */
  const SB=(
    <div style={{background:"#0f1a30",padding:"7px 14px",borderBottom:"2px solid #f59e0b",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:P1C,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Black Ops One',cursive",fontSize:12,color:"#fff",flexShrink:0,boxShadow:"0 2px 0 rgba(0,0,0,.3)"}}>{myNm.slice(0,2).toUpperCase()}</div>
          <div><div style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{myNm}</div><div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{myScore}</div></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:60}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:"#0a1020",border:`3px solid ${!started?"#333":finalPhase?(itimer<10?"#ef4444":"#f59e0b"):isMy?"#22c55e":"#333"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:"'Black Ops One',cursive",fontSize:15,fontWeight:900,color:!started?"#333":finalPhase?"#f59e0b":isMy?"#22c55e":"#333"}}>
              {!started?"⏳":finalPhase&&isMy?itimer:!finalPhase&&isMy?ttimer:"·"}
            </span>
          </div>
          <div style={{fontSize:7,color:isMy&&started?"#22c55e":"rgba(255,255,255,.3)",letterSpacing:1,fontWeight:700}}>{!started?"WAIT":finalPhase?"FINAL":isMy?"YOUR TURN":"WAIT"}</div>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{opNm}</div><div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{opScore}</div></div>
          <div style={{width:36,height:36,borderRadius:"50%",background:P2C,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Black Ops One',cursive",fontSize:12,color:"#fff",flexShrink:0,boxShadow:"0 2px 0 rgba(0,0,0,.3)"}}>{opNm.slice(0,2).toUpperCase()}</div>
        </div>
      </div>
      <div style={{textAlign:"center",marginTop:4,fontSize:10,color:isMy&&started?"#f59e0b":"rgba(255,255,255,.3)",fontWeight:700}}>
        {!started?"⏳ Waiting...":finalPhase?(isMy?"🎯 TAP ? TO GUESS":"⏳ OPPONENT..."):isMy?(canOpen?"👆 TAP A FIELD":canGuess?"💡 TAP ? TO GUESS":"..."):"⏳ OPPONENT'S TURN"}
      </div>
    </div>
  );

  const PL=(
    <div style={{display:"flex",gap:8,alignItems:"flex-start",marginTop:6}}>
      {isMy&&!finalPhase&&didOpen&&started&&<button onClick={()=>{touch();doPass();L("Passed.");}} style={{padding:"8px 14px",background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>PASS</button>}
      {log.length>0&&<div style={{flex:1,padding:"5px 9px",background:"rgba(0,0,0,.3)",borderRadius:8}}>{log.map((l,i)=><div key={i} style={{fontSize:10,color:i===0?"rgba(255,255,255,.8)":"rgba(255,255,255,.3)",padding:"1px 0"}}>{l}</div>)}</div>}
    </div>
  );

  /* ══════════════════════════════════════════════
     DESKTOP — True X layout, 4:1 ratio fields
     
     Uses CSS Grid with named areas for perfect X:
     
     [lA] [A4 A3 A2 A1] [tA] [FIN] [tB] [B1 B2 B3 B4] [lB]
     [lC] [C4 C3 C2 C1] [tC] [   ] [tD] [D1 D2 D3 D4] [lD]
  ══════════════════════════════════════════════ */
  if(isDesktop){
    const GAP=10;
    const TH=56; // theme input height
    const FH=56; // final box height (per row)

    return(
      <div style={ROOT}><style>{CSS}</style>
      {SB}
      <div style={{flex:1,overflowY:"auto",padding:"16px 24px"}}>
        <div style={{maxWidth:1300,margin:"0 auto"}}>

          {/* ── ROW 1: A fields | Theme A | Final | Theme B | B fields ── */}
          <div style={{display:"grid", gridTemplateColumns:"24px 1fr 110px 110px 110px 1fr 24px", gap:GAP, alignItems:"center", marginBottom:GAP}}>
            {/* A label */}
            <div style={{textAlign:"center"}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:22,color:P1C,textShadow:`0 0 10px ${P1C}66`}}>A</span></div>
            {/* A4 A3 A2 A1 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {[...colA.fields].reverse().map(f=>{ const {state,solvedBy}=fst(f.id); return <Field key={f.id} field={f} state={state} solvedBy={solvedBy} canOpen={canOpen&&state==="hidden"} onOpen={doOpen}/>; })}
            </div>
            {/* Theme A */}
            <ThemeInput colId="A" solved={!!colSolved.A} solvedBy={colSolved.A} theme={colA.theme} disabled={!canGuess} onGuess={v=>doGuessCol("A",v)} height={TH}/>
            {/* FINAL BOX - spans both rows via CSS (we'll handle with rowSpan via absolute positioning) */}
            <div style={{height:TH*2+GAP,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:finalPhase?"rgba(245,158,11,.1)":"#060c18",border:`2px solid ${finalPhase?"#f59e0b88":"#1a2a4a"}`,borderRadius:12,textAlign:"center",animation:finalPhase?"glowPulse 2s infinite":"none",gridRow:"1/3"}}>
              <div style={{fontSize:8,color:"#555",letterSpacing:1,marginBottom:4}}>FINAL</div>
              {finalSolved?<div style={{fontSize:12,fontWeight:900,color:finalSolved==="p1"?P1C:P2C}}>{board.final.answer}</div>:<div style={{fontSize:22,color:"#1a2a3a",fontWeight:900,fontFamily:"'Black Ops One',cursive",lineHeight:1}}>???</div>}
              <div style={{fontSize:7,color:"#1a2a3a",marginTop:4}}>{board.final.hint}</div>
            </div>
            {/* Theme B */}
            <ThemeInput colId="B" solved={!!colSolved.B} solvedBy={colSolved.B} theme={colB.theme} disabled={!canGuess} onGuess={v=>doGuessCol("B",v)} height={TH}/>
            {/* B1 B2 B3 B4 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {colB.fields.map(f=>{ const {state,solvedBy}=fst(f.id); return <Field key={f.id} field={f} state={state} solvedBy={solvedBy} canOpen={canOpen&&state==="hidden"} onOpen={doOpen}/>; })}
            </div>
            {/* B label */}
            <div style={{textAlign:"center"}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:22,color:P2C,textShadow:`0 0 10px ${P2C}66`}}>B</span></div>
          </div>

          {/* ── ROW 2: C fields | Theme C | spacer | Theme D | D fields ── */}
          <div style={{display:"grid", gridTemplateColumns:"24px 1fr 110px 110px 110px 1fr 24px", gap:GAP, alignItems:"center", marginBottom:16}}>
            {/* C label */}
            <div style={{textAlign:"center"}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:22,color:P1C,textShadow:`0 0 10px ${P1C}66`}}>C</span></div>
            {/* C4 C3 C2 C1 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {[...colC.fields].reverse().map(f=>{ const {state,solvedBy}=fst(f.id); return <Field key={f.id} field={f} state={state} solvedBy={solvedBy} canOpen={canOpen&&state==="hidden"} onOpen={doOpen}/>; })}
            </div>
            {/* Theme C */}
            <ThemeInput colId="C" solved={!!colSolved.C} solvedBy={colSolved.C} theme={colC.theme} disabled={!canGuess} onGuess={v=>doGuessCol("C",v)} height={TH}/>
            {/* Spacer (under final box) */}
            <div/>
            {/* Theme D */}
            <ThemeInput colId="D" solved={!!colSolved.D} solvedBy={colSolved.D} theme={colD.theme} disabled={!canGuess} onGuess={v=>doGuessCol("D",v)} height={TH}/>
            {/* D1 D2 D3 D4 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {colD.fields.map(f=>{ const {state,solvedBy}=fst(f.id); return <Field key={f.id} field={f} state={state} solvedBy={solvedBy} canOpen={canOpen&&state==="hidden"} onOpen={doOpen}/>; })}
            </div>
            {/* D label */}
            <div style={{textAlign:"center"}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:22,color:P2C,textShadow:`0 0 10px ${P2C}66`}}>D</span></div>
          </div>

          {/* FINAL INPUT */}
          <div style={{maxWidth:500,margin:"0 auto 12px"}}>
            <FinalInput solved={!!finalSolved} solvedBy={finalSolved} answer={board.final.answer} disabled={!canGuess} onGuess={doGuessFinal} height={56}/>
          </div>

          {PL}
          <div style={{textAlign:"center",padding:"8px 0 2px"}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:10,letterSpacing:2}}><span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"rgba(255,255,255,.3)"}}>.FUN</span></span></div>
        </div>
      </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     MOBILE — vertical layout (unchanged)
  ══════════════════════════════════════════════ */
  return(
    <div style={ROOT}><style>{CSS}</style>
    {SB}
    <div style={{flex:1,overflowY:"auto",padding:"7px 10px"}}>
      <div style={{maxWidth:500,margin:"0 auto",display:"flex",flexDirection:"column",gap:5}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <div style={{textAlign:"center",paddingBottom:2,borderBottom:`3px solid ${P1C}`}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:P1C,letterSpacing:3}}>A</span></div>
          <div style={{textAlign:"center",paddingBottom:2,borderBottom:`3px solid ${P2C}`}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:P2C,letterSpacing:3}}>B</span></div>
        </div>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[colA.fields[i],colB.fields[i]].map(f=>{ const {state,solvedBy}=fst(f.id); return <MobileField key={f.id} field={f} state={state} solvedBy={solvedBy} canOpen={canOpen&&state==="hidden"} onOpen={doOpen}/>; })}
          </div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <ThemeInput colId="A" solved={!!colSolved.A} solvedBy={colSolved.A} theme={colA.theme} disabled={!canGuess} onGuess={v=>doGuessCol("A",v)}/>
          <ThemeInput colId="B" solved={!!colSolved.B} solvedBy={colSolved.B} theme={colB.theme} disabled={!canGuess} onGuess={v=>doGuessCol("B",v)}/>
        </div>
        <FinalInput solved={!!finalSolved} solvedBy={finalSolved} answer={board.final.answer} disabled={!canGuess} onGuess={doGuessFinal}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <ThemeInput colId="C" solved={!!colSolved.C} solvedBy={colSolved.C} theme={colC.theme} disabled={!canGuess} onGuess={v=>doGuessCol("C",v)}/>
          <ThemeInput colId="D" solved={!!colSolved.D} solvedBy={colSolved.D} theme={colD.theme} disabled={!canGuess} onGuess={v=>doGuessCol("D",v)}/>
        </div>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[colC.fields[i],colD.fields[i]].map(f=>{ const {state,solvedBy}=fst(f.id); return <MobileField key={f.id} field={f} state={state} solvedBy={solvedBy} canOpen={canOpen&&state==="hidden"} onOpen={doOpen}/>; })}
          </div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <div style={{textAlign:"center",paddingTop:2,borderTop:`3px solid ${P1C}`}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:P1C,letterSpacing:3}}>C</span></div>
          <div style={{textAlign:"center",paddingTop:2,borderTop:`3px solid ${P2C}`}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:P2C,letterSpacing:3}}>D</span></div>
        </div>
        {PL}
        <div style={{textAlign:"center",padding:"6px 0 2px"}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:10,letterSpacing:2}}><span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"rgba(255,255,255,.3)"}}>.FUN</span></span></div>
      </div>
    </div>
    </div>
  );
}

const ROOT={height:"100vh",display:"flex",flexDirection:"column",background:"#1a2a4a",fontFamily:"'Rajdhani','Oswald',sans-serif",color:"#fff",overflow:"hidden"};
const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;600;700&display=swap');
  html,body{margin:0;padding:0;background:#1a2a4a;}
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  @keyframes pop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(245,158,11,.2)}50%{box-shadow:0 0 40px rgba(245,158,11,.5)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:rgba(0,0,0,.2)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:2px}
`;
