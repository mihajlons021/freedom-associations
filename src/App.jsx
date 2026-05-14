/* eslint-disable */
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";

const FB_CFG = {
  apiKey: "AIzaSyAKmKRj7Hhy4K6DsY_XDbqLb3oYOwZC5jw",
  authDomain: "project-freedom-a004e.firebaseapp.com",
  databaseURL: "https://project-freedom-a004e-default-rtdb.firebaseio.com",
  projectId: "project-freedom-a004e",
  storageBucket: "project-freedom-a004e.firebasestorage.app",
  messagingSenderId: "844172246267",
  appId: "1:844172246267:web:a31b8cd6affe8337f7845e",
};
let db;
try { db = getDatabase(initializeApp(FB_CFG)); } catch(e) {}

function uid() {
  try {
    let id = localStorage.getItem("_pgf");
    if (!id) { id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2); localStorage.setItem("_pgf", id); }
    return id;
  } catch { return "u" + Math.random().toString(36).slice(2,14); }
}

const ESCROW = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS = [100, 500, 1000];
const TSEC = 30, ISEC = 60;
const R = "#e53935", B = "#1e88e5"; // player colors

/* ══════ 12 FRESH BOARDS — no Animals, no Food, no King of Jungle ══════ */
const ALL = [
  { columns:[
    {id:"A",theme:"PLANETS",fields:[{id:"A1",clue:"Red planet",answer:"MARS"},{id:"A2",clue:"Ringed giant",answer:"SATURN"},{id:"A3",clue:"Morning star",answer:"VENUS"},{id:"A4",clue:"Blue ice giant",answer:"NEPTUNE"}]},
    {id:"B",theme:"CAPITALS",fields:[{id:"B1",clue:"Eiffel Tower city",answer:"PARIS"},{id:"B2",clue:"Rising sun capital",answer:"TOKYO"},{id:"B3",clue:"Thames River city",answer:"LONDON"},{id:"B4",clue:"Vatican neighbor",answer:"ROME"}]},
    {id:"C",theme:"SUPERHEROES",fields:[{id:"C1",clue:"Web slinger",answer:"SPIDERMAN"},{id:"C2",clue:"Dark knight",answer:"BATMAN"},{id:"C3",clue:"Iron suit billionaire",answer:"IRONMAN"},{id:"C4",clue:"Super soldier",answer:"CAPTAIN"}]},
    {id:"D",theme:"OCEANS",fields:[{id:"D1",clue:"World's biggest",answer:"PACIFIC"},{id:"D2",clue:"Titanic sank here",answer:"ATLANTIC"},{id:"D3",clue:"Between continents",answer:"INDIAN"},{id:"D4",clue:"North polar sea",answer:"ARCTIC"}]},
  ], final:{answer:"WORLD",hint:"The big picture"} },

  { columns:[
    {id:"A",theme:"CARS",fields:[{id:"A1",clue:"Italian sports",answer:"FERRARI"},{id:"A2",clue:"German luxury",answer:"BMW"},{id:"A3",clue:"Electric pioneer",answer:"TESLA"},{id:"A4",clue:"Japanese reliable",answer:"TOYOTA"}]},
    {id:"B",theme:"MOUNTAINS",fields:[{id:"B1",clue:"World's highest",answer:"EVEREST"},{id:"B2",clue:"Swiss Alps icon",answer:"MATTERHORN"},{id:"B3",clue:"Africa's roof",answer:"KILIMANJARO"},{id:"B4",clue:"Japan's peak",answer:"FUJI"}]},
    {id:"C",theme:"DANCES",fields:[{id:"C1",clue:"Argentine passion",answer:"TANGO"},{id:"C2",clue:"Cuban rhythm",answer:"SALSA"},{id:"C3",clue:"Spanish flamenco",answer:"FLAMENCO"},{id:"C4",clue:"Hawaiian hips",answer:"HULA"}]},
    {id:"D",theme:"RIVERS",fields:[{id:"D1",clue:"Rome's river",answer:"TIBER"},{id:"D2",clue:"Vienna's blue river",answer:"DANUBE"},{id:"D3",clue:"Moscow's river",answer:"VOLGA"},{id:"D4",clue:"Amazon jungle",answer:"AMAZON"}]},
  ], final:{answer:"JOURNEY",hint:"About movement"} },

  { columns:[
    {id:"A",theme:"GEMS",fields:[{id:"A1",clue:"Hardest gem",answer:"DIAMOND"},{id:"A2",clue:"Red passion gem",answer:"RUBY"},{id:"A3",clue:"Blue royal gem",answer:"SAPPHIRE"},{id:"A4",clue:"Green forest gem",answer:"EMERALD"}]},
    {id:"B",theme:"COMPOSERS",fields:[{id:"B1",clue:"Fifth symphony",answer:"BEETHOVEN"},{id:"B2",clue:"Four seasons",answer:"VIVALDI"},{id:"B3",clue:"Magic flute",answer:"MOZART"},{id:"B4",clue:"G string air",answer:"BACH"}]},
    {id:"C",theme:"SCIENTISTS",fields:[{id:"C1",clue:"Gravity & apple",answer:"NEWTON"},{id:"C2",clue:"Relativity",answer:"EINSTEIN"},{id:"C3",clue:"Evolution",answer:"DARWIN"},{id:"C4",clue:"Radium & polonium",answer:"CURIE"}]},
    {id:"D",theme:"PHILOSOPHERS",fields:[{id:"D1",clue:"I think therefore",answer:"DESCARTES"},{id:"D2",clue:"Cave allegory",answer:"PLATO"},{id:"D3",clue:"Golden mean",answer:"ARISTOTLE"},{id:"D4",clue:"Thus spoke Zarathustra",answer:"NIETZSCHE"}]},
  ], final:{answer:"GENIUS",hint:"Intelligence at its finest"} },

  { columns:[
    {id:"A",theme:"COCKTAILS",fields:[{id:"A1",clue:"James Bond's pick",answer:"MARTINI"},{id:"A2",clue:"Rum & mint leaves",answer:"MOJITO"},{id:"A3",clue:"Tequila & lime",answer:"MARGARITA"},{id:"A4",clue:"Coconut & pineapple",answer:"PINACOLADA"}]},
    {id:"B",theme:"ARTISTS",fields:[{id:"B1",clue:"Mona Lisa painter",answer:"DAVINCI"},{id:"B2",clue:"Sunflowers painter",answer:"VANGOGH"},{id:"B3",clue:"Cubism founder",answer:"PICASSO"},{id:"B4",clue:"Sistine chapel ceiling",answer:"MICHELANGELO"}]},
    {id:"C",theme:"CURRENCIES",fields:[{id:"C1",clue:"USA money",answer:"DOLLAR"},{id:"C2",clue:"European union",answer:"EURO"},{id:"C3",clue:"Japan money",answer:"YEN"},{id:"C4",clue:"British money",answer:"POUND"}]},
    {id:"D",theme:"WEATHER",fields:[{id:"D1",clue:"Funnel & twister",answer:"TORNADO"},{id:"D2",clue:"Lightning & thunder",answer:"STORM"},{id:"D3",clue:"Eye of the storm",answer:"HURRICANE"},{id:"D4",clue:"Blinding snow",answer:"BLIZZARD"}]},
  ], final:{answer:"PASSION",hint:"Strong feeling"} },

  { columns:[
    {id:"A",theme:"US STATES",fields:[{id:"A1",clue:"Golden Gate bridge",answer:"CALIFORNIA"},{id:"A2",clue:"Lone Star state",answer:"TEXAS"},{id:"A3",clue:"Empire state",answer:"NEWYORK"},{id:"A4",clue:"Sunshine state",answer:"FLORIDA"}]},
    {id:"B",theme:"DINOSAURS",fields:[{id:"B1",clue:"Tyrant lizard king",answer:"TREX"},{id:"B2",clue:"Three horned face",answer:"TRICERATOPS"},{id:"B3",clue:"Long neck plant eater",answer:"BRACHIOSAURUS"},{id:"B4",clue:"Clever pack hunter",answer:"RAPTOR"}]},
    {id:"C",theme:"FAMOUS SHIPS",fields:[{id:"C1",clue:"Iceberg disaster",answer:"TITANIC"},{id:"C2",clue:"Columbus flagship",answer:"SANTAMARIA"},{id:"C3",clue:"Star Trek ship",answer:"ENTERPRISE"},{id:"C4",clue:"Pirate legendary",answer:"BLACKPEARL"}]},
    {id:"D",theme:"TECH GIANTS",fields:[{id:"D1",clue:"Bitten apple logo",answer:"APPLE"},{id:"D2",clue:"Search giant",answer:"GOOGLE"},{id:"D3",clue:"Social network",answer:"FACEBOOK"},{id:"D4",clue:"Everything store",answer:"AMAZON"}]},
  ], final:{answer:"AMERICA",hint:"The new world"} },

  { columns:[
    {id:"A",theme:"MARTIAL ARTS",fields:[{id:"A1",clue:"Japanese throws",answer:"JUDO"},{id:"A2",clue:"Korean kicks",answer:"TAEKWONDO"},{id:"A3",clue:"Brazilian ground game",answer:"BJJ"},{id:"A4",clue:"Chinese strikes",answer:"KUNGFU"}]},
    {id:"B",theme:"PRECIOUS METALS",fields:[{id:"B1",clue:"Olympic first place",answer:"GOLD"},{id:"B2",clue:"Olympic second place",answer:"SILVER"},{id:"B3",clue:"Wedding ring metal",answer:"PLATINUM"},{id:"B4",clue:"Olympic third place",answer:"BRONZE"}]},
    {id:"C",theme:"CHEESES",fields:[{id:"C1",clue:"Italian hard pasta",answer:"PARMESAN"},{id:"C2",clue:"French soft white",answer:"BRIE"},{id:"C3",clue:"Blue veiny Italian",answer:"GORGONZOLA"},{id:"C4",clue:"Stretchy pizza top",answer:"MOZZARELLA"}]},
    {id:"D",theme:"DETECTIVES",fields:[{id:"D1",clue:"221B Baker Street",answer:"HOLMES"},{id:"D2",clue:"Belgian with mustache",answer:"POIROT"},{id:"D3",clue:"Little old lady",answer:"MARPLE"},{id:"D4",clue:"Trench coat detective",answer:"COLUMBO"}]},
  ], final:{answer:"MASTERY",hint:"Expert skill"} },

  { columns:[
    {id:"A",theme:"WINTER SPORTS",fields:[{id:"A1",clue:"Two planks downhill",answer:"SKIING"},{id:"A2",clue:"One board downhill",answer:"SNOWBOARD"},{id:"A3",clue:"Ice spinning",answer:"SKATING"},{id:"A4",clue:"Broom on ice",answer:"CURLING"}]},
    {id:"B",theme:"FAMOUS BATTLES",fields:[{id:"B1",clue:"Napoleon's defeat",answer:"WATERLOO"},{id:"B2",clue:"Sparta 300",answer:"THERMOPYLAE"},{id:"B3",clue:"D-Day beaches",answer:"NORMANDY"},{id:"B4",clue:"Trafalgar at sea",answer:"TRAFALGAR"}]},
    {id:"C",theme:"CARD GAMES",fields:[{id:"C1",clue:"21 target",answer:"BLACKJACK"},{id:"C2",clue:"Texas Hold",answer:"POKER"},{id:"C3",clue:"Draw four wild",answer:"UNO"},{id:"C4",clue:"Pairs classic",answer:"BRIDGE"}]},
    {id:"D",theme:"SEAS",fields:[{id:"D1",clue:"Mediterranean Adriatic",answer:"ADRIATIC"},{id:"D2",clue:"Hot red sea",answer:"REDSEA"},{id:"D3",clue:"Saltiest lake-sea",answer:"DEADSEA"},{id:"D4",clue:"Between Europe & UK",answer:"NORTHSEA"}]},
  ], final:{answer:"EUROPE",hint:"Old continent"} },

  { columns:[
    {id:"A",theme:"LANGUAGES",fields:[{id:"A1",clue:"Most speakers",answer:"MANDARIN"},{id:"A2",clue:"Shakespeare wrote",answer:"ENGLISH"},{id:"A3",clue:"Cervantes wrote",answer:"SPANISH"},{id:"A4",clue:"Language of love",answer:"FRENCH"}]},
    {id:"B",theme:"MOVIES",fields:[{id:"B1",clue:"Simba's story",answer:"LIONKING"},{id:"B2",clue:"Force & Jedi",answer:"STARWARS"},{id:"B3",clue:"One ring quest",answer:"LOTR"},{id:"B4",clue:"Blue alien planet",answer:"AVATAR"}]},
    {id:"C",theme:"SPORTS TEAMS",fields:[{id:"C1",clue:"New York pinstripes",answer:"YANKEES"},{id:"C2",clue:"Chicago red bulls",answer:"BULLS"},{id:"C3",clue:"Manchester red devils",answer:"UNITED"},{id:"C4",clue:"LA purple & gold",answer:"LAKERS"}]},
    {id:"D",theme:"DESSERTS",fields:[{id:"D1",clue:"Italian ice cream",answer:"GELATO"},{id:"D2",clue:"French choux pastry",answer:"ECLAIR"},{id:"D3",clue:"Chocolate fudge square",answer:"BROWNIE"},{id:"D4",clue:"Italian coffee cake",answer:"TIRAMISU"}]},
  ], final:{answer:"ENTERTAINMENT",hint:"Fun & pleasure"} },

  { columns:[
    {id:"A",theme:"INSECTS",fields:[{id:"A1",clue:"Makes honey",answer:"BEE"},{id:"A2",clue:"Red spots white",answer:"LADYBUG"},{id:"A3",clue:"Silk maker",answer:"SILKWORM"},{id:"A4",clue:"Night light flyer",answer:"MOTH"}]},
    {id:"B",theme:"SPICES",fields:[{id:"B1",clue:"Yellow warm powder",answer:"TURMERIC"},{id:"B2",clue:"Vampire repellent",answer:"GARLIC"},{id:"B3",clue:"Red festive spice",answer:"PAPRIKA"},{id:"B4",clue:"Sweet cinnamon roll",answer:"CINNAMON"}]},
    {id:"C",theme:"BOARD GAMES",fields:[{id:"C1",clue:"32 chess pieces",answer:"CHESS"},{id:"C2",clue:"Buy & rent",answer:"MONOPOLY"},{id:"C3",clue:"Stack & topple",answer:"JENGA"},{id:"C4",clue:"Word on board",answer:"SCRABBLE"}]},
    {id:"D",theme:"CHEERS",fields:[{id:"D1",clue:"German beer hall",answer:"PROSIT"},{id:"D2",clue:"Italian toast",answer:"SALUTE"},{id:"D3",clue:"French toast",answer:"SANTE"},{id:"D4",clue:"Russian vodka toast",answer:"NAZDOROVYE"}]},
  ], final:{answer:"CELEBRATION",hint:"Party time"} },

  { columns:[
    {id:"A",theme:"FASHION HOUSES",fields:[{id:"A1",clue:"French luxury CC",answer:"CHANEL"},{id:"A2",clue:"Italian LV bags",answer:"VUITTON"},{id:"A3",clue:"Italian Gucci",answer:"GUCCI"},{id:"A4",clue:"Italian Prada",answer:"PRADA"}]},
    {id:"B",theme:"GREEK GODS",fields:[{id:"B1",clue:"King of gods",answer:"ZEUS"},{id:"B2",clue:"Sea god trident",answer:"POSEIDON"},{id:"B3",clue:"Underworld god",answer:"HADES"},{id:"B4",clue:"War god",answer:"ARES"}]},
    {id:"C",theme:"CHEMICAL ELEMENTS",fields:[{id:"C1",clue:"Table number 1",answer:"HYDROGEN"},{id:"C2",clue:"Shiny metal jewelry",answer:"GOLD"},{id:"C3",clue:"We breathe it",answer:"OXYGEN"},{id:"C4",clue:"Diamond material",answer:"CARBON"}]},
    {id:"D",theme:"SPORTS",fields:[{id:"D1",clue:"Court & love score",answer:"TENNIS"},{id:"D2",clue:"Ice & puck",answer:"HOCKEY"},{id:"D3",clue:"Pool & laps",answer:"SWIMMING"},{id:"D4",clue:"Octagon fighter",answer:"MMA"}]},
  ], final:{answer:"OLYMPIC",hint:"International competition"} },

  { columns:[
    {id:"A",theme:"VOLCANOES",fields:[{id:"A1",clue:"Italy's fire mountain",answer:"ETNA"},{id:"A2",clue:"Pompeii destroyer",answer:"VESUVIUS"},{id:"A3",clue:"Hawaii's fire",answer:"KILAUEA"},{id:"A4",clue:"Iceland's eyjafjalla",answer:"EYJAFJALLA"}]},
    {id:"B",theme:"CLOUDS",fields:[{id:"B1",clue:"Fluffy cotton balls",answer:"CUMULUS"},{id:"B2",clue:"Thin high streaks",answer:"CIRRUS"},{id:"B3",clue:"Gray rain layer",answer:"STRATUS"},{id:"B4",clue:"Storm tower",answer:"CUMULONIMBUS"}]},
    {id:"C",theme:"MINERALS",fields:[{id:"C1",clue:"Pink quartz love",answer:"ROSEQUARTZ"},{id:"C2",clue:"Purple crystal",answer:"AMETHYST"},{id:"C3",clue:"Black obsidian blade",answer:"OBSIDIAN"},{id:"C4",clue:"Green malachite",answer:"MALACHITE"}]},
    {id:"D",theme:"ECONOMIC TERMS",fields:[{id:"D1",clue:"Rising prices",answer:"INFLATION"},{id:"D2",clue:"Market dip",answer:"RECESSION"},{id:"D3",clue:"Gross domestic product",answer:"GDP"},{id:"D4",clue:"Crypto coin",answer:"BITCOIN"}]},
  ], final:{answer:"EARTH",hint:"Our planet"} },

  { columns:[
    {id:"A",theme:"MEDIEVAL TERMS",fields:[{id:"A1",clue:"Armor wearer",answer:"KNIGHT"},{id:"A2",clue:"Fire breather",answer:"DRAGON"},{id:"A3",clue:"Magic man",answer:"WIZARD"},{id:"A4",clue:"Tall stone home",answer:"CASTLE"}]},
    {id:"B",theme:"SPACE MISSIONS",fields:[{id:"B1",clue:"Moon landing 1969",answer:"APOLLO"},{id:"B2",clue:"Space telescope",answer:"HUBBLE"},{id:"B3",clue:"Mars rover",answer:"CURIOSITY"},{id:"B4",clue:"First satellite",answer:"SPUTNIK"}]},
    {id:"C",theme:"PHOBIAS",fields:[{id:"C1",clue:"Fear of heights",answer:"ACROPHOBIA"},{id:"C2",clue:"Fear of spiders",answer:"ARACHNOPHOBIA"},{id:"C3",clue:"Fear of flying",answer:"AVIOPHOBIA"},{id:"C4",clue:"Fear of open spaces",answer:"AGORAPHOBIA"}]},
    {id:"D",theme:"CURRENCIES 2",fields:[{id:"D1",clue:"Swiss franc",answer:"FRANC"},{id:"D2",clue:"Brazilian real",answer:"REAL"},{id:"D3",clue:"Indian rupee",answer:"RUPEE"},{id:"D4",clue:"South Korea won",answer:"WON"}]},
  ], final:{answer:"MYSTERY",hint:"Unknown & hidden"} },
];

/* Pure random, never same board twice in a row */
let _lastIdx = -1;
function pickBoard() {
  const avail = ALL.map((_,i)=>i).filter(i=>i!==_lastIdx);
  _lastIdx = avail[Math.floor(Math.random()*avail.length)];
  return JSON.parse(JSON.stringify(ALL[_lastIdx]));
}

function nrm(s){return s.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");}
function match(a,b){return nrm(a)===nrm(b);}
function gid(){return Math.random().toString(36).slice(2,8).toUpperCase();}

async function phantom(){
  try{if(!window.solana?.isPhantom){window.open("https://phantom.app/","_blank");return null;}return(await window.solana.connect()).publicKey.toString();}catch{return null;}
}
async function signW(n){
  try{if(!window.solana?.isPhantom)return{ok:false,err:"No Phantom"};await window.solana.signMessage(new TextEncoder().encode("Wager "+n+" FREEDOM"),"utf8");return{ok:true,id:"SIG_"+Date.now()};}
  catch(e){return{ok:false,err:e.message};}
}

/* ── FIELD ── */
const FHID="#1e3a5a",FCLK="#2d5a8a",FCLUE="#c47d0e";
function Field({field,st,solvedBy,canOpen,onOpen,h}){
  const bg=st==="solved"?(solvedBy==="p1"?R:B):st==="clue"?FCLUE:canOpen?FCLK:FHID;
  const border=st==="clue"?"2px solid #f59e0b":st==="solved"?"none":canOpen?"1px solid #4a7aaa":"1px solid #1a2a3a";
  const s={width:"100%",height:h,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:2,padding:"4px 8px",boxSizing:"border-box",background:bg,border,boxShadow:canOpen&&st==="hidden"?"0 3px 8px rgba(0,0,0,.6)":st==="solved"?"0 3px 0 rgba(0,0,0,.4)":"none",cursor:canOpen&&st==="hidden"?"pointer":"default",transition:"all .15s",userSelect:"none"};
  if(st==="solved")return<div style={s}><div style={{fontSize:"clamp(10px,1.1vw,15px)",fontWeight:900,color:"#fff",textAlign:"center",letterSpacing:.5}}>{field.answer}</div><div style={{fontSize:"clamp(7px,.8vw,10px)",color:"rgba(255,255,255,.7)",textAlign:"center"}}>{field.clue}</div></div>;
  if(st==="clue")return<div style={s}><div style={{fontSize:"clamp(10px,1vw,14px)",color:"#fff",fontWeight:700,textAlign:"center",lineHeight:1.2}}>{field.clue}</div></div>;
  return<div onClick={canOpen?()=>onOpen(field.id):undefined} style={s} onMouseEnter={e=>{if(canOpen){e.currentTarget.style.background="#3a6e9e";}}} onMouseLeave={e=>{if(canOpen)e.currentTarget.style.background=FCLK;}}><span style={{fontSize:"clamp(11px,1.2vw,18px)",fontWeight:900,color:canOpen?"#7ab8e0":"#1a2a3a",letterSpacing:1}}>{field.id}</span></div>;
}

/* ── THEME INPUT ── */
function TInput({cid,solved,solvedBy,theme,disabled,onGuess,h}){
  const[ed,setEd]=useState(false);const[v,setV]=useState("");const[err,setErr]=useState(false);
  const sc=solvedBy==="p1"?R:B;
  const sub=()=>{if(!v.trim())return;if(!onGuess(v)){setErr(true);setTimeout(()=>setErr(false),600);}else{setV("");setEd(false);}};
  if(solved)return<div style={{width:"100%",height:h,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:sc,boxShadow:"0 3px 0 rgba(0,0,0,.4)"}}><span style={{fontSize:"clamp(9px,1vw,13px)",fontWeight:900,color:"#fff",textAlign:"center",padding:"0 5px"}}>✓ {theme}</span></div>;
  if(!disabled&&ed)return<div style={{width:"100%",height:h,borderRadius:8,display:"flex",alignItems:"center",gap:4,padding:"0 6px",background:"#fff",animation:err?"shake .4s":"none",boxSizing:"border-box"}}><input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sub();if(e.key==="Escape")setEd(false);}} placeholder={"Col "+cid+"..."} autoFocus style={{flex:1,background:"transparent",border:"none",fontSize:11,fontWeight:700,outline:"none",fontFamily:"inherit",color:"#1a2a4a",minWidth:0}}/><button onClick={sub} style={{background:FCLK,border:"none",borderRadius:5,padding:"4px 8px",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:10,flexShrink:0}}>OK</button><button onClick={()=>setEd(false)} style={{background:"#ddd",border:"none",borderRadius:5,padding:"4px 5px",color:"#666",cursor:"pointer",fontSize:10}}>✕</button></div>;
  return<div onClick={disabled?undefined:()=>setEd(true)} style={{width:"100%",height:h,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:disabled?"#111c2a":"rgba(45,90,138,.35)",border:`2px dashed ${disabled?"#1e3a5a":"#5b9bd5"}`,cursor:disabled?"default":"pointer",transition:"all .15s"}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background="rgba(45,90,138,.55)";}} onMouseLeave={e=>{if(!disabled)e.currentTarget.style.background="rgba(45,90,138,.35)";}}><span style={{fontSize:22,color:disabled?"#1e3a5a":"#7ab8e0",fontWeight:900}}>?</span></div>;
}

/* ── FINAL INPUT ── */
function FInput({solved,solvedBy,answer,disabled,onGuess,h}){
  const[ed,setEd]=useState(false);const[v,setV]=useState("");const[err,setErr]=useState(false);
  const sc=solvedBy==="p1"?R:B;
  const sub=()=>{if(!v.trim())return;if(!onGuess(v)){setErr(true);setTimeout(()=>setErr(false),600);}else{setV("");setEd(false);}};
  if(solved)return<div style={{width:"100%",height:h,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:sc,boxShadow:"0 4px 0 rgba(0,0,0,.4)"}}><span style={{fontSize:16,fontWeight:900,color:"#fff",letterSpacing:1}}>✓ {answer}</span></div>;
  if(!disabled&&ed)return<div style={{width:"100%",height:h,borderRadius:10,display:"flex",alignItems:"center",gap:8,padding:"0 10px",background:"#fff",animation:err?"shake .4s":"none",boxSizing:"border-box"}}><input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sub();if(e.key==="Escape")setEd(false);}} placeholder="Final answer..." autoFocus style={{flex:1,background:"transparent",border:"none",fontSize:14,fontWeight:700,outline:"none",fontFamily:"inherit",color:"#1a2a4a",textAlign:"center"}}/><button onClick={sub} style={{background:"#f59e0b",border:"none",borderRadius:8,padding:"7px 14px",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:13,flexShrink:0}}>OK</button></div>;
  return<div onClick={disabled?undefined:()=>setEd(true)} style={{width:"100%",height:h,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:disabled?"#111c2a":"rgba(245,158,11,.15)",border:`3px dashed ${disabled?"#1e3a5a":"#f59e0b"}`,cursor:disabled?"default":"pointer",transition:"all .15s"}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background="rgba(245,158,11,.3)";}} onMouseLeave={e=>{if(!disabled)e.currentTarget.style.background="rgba(245,158,11,.15)";}}><span style={{fontSize:26,color:disabled?"#1e3a5a":"#f59e0b",fontWeight:900}}>?</span></div>;
}

function Spin({msg}){return<div style={ROOT}><style>{CSS}</style><div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}><div style={{width:52,height:52,border:"4px solid rgba(255,255,255,.1)",borderTop:"4px solid #f59e0b",borderRadius:"50%",animation:"spin 1s linear infinite"}}/><div style={{color:"rgba(255,255,255,.6)",fontSize:13,letterSpacing:2}}>{msg}</div></div></div>;}

export default function App(){
  const[myUid]=useState(uid);
  const[scr,setScr]=useState("lobby");
  const[nm,setNm]=useState("");
  const[wager,setWager]=useState(100);
  const[mode,setMode]=useState("create");
  const[jin,setJin]=useState("");
  const[jerr,setJerr]=useState("");
  const[wallet,setWallet]=useState(null);
  const[wload,setWload]=useState(false);
  const[ldmsg,setLdmsg]=useState("");
  const[roomId,setRoomId]=useState(null);
  const[myRole,setMyRole]=useState(null);
  const[gs,setGs]=useState(null);
  const[started,setStarted]=useState(false);
  const[tt,setTt]=useState(TSEC);
  const[it,setIt]=useState(ISEC);
  const[didOpen,setDidOpen]=useState(false);
  const[log,setLog]=useState([]);
  const[desktop,setDesktop]=useState(window.innerWidth>=768);

  const tR=useRef(),iR=useRef(),lastAct=useRef(Date.now()),rRef=useRef(null);
  const L=m=>setLog(p=>[m,...p].slice(0,4));
  const touch=()=>{lastAct.current=Date.now();setIt(ISEC);};

  useEffect(()=>{const c=()=>setDesktop(window.innerWidth>=768);window.addEventListener("resize",c);return()=>window.removeEventListener("resize",c);},[]);
  useEffect(()=>{try{if(window.solana?.isPhantom&&window.solana.publicKey)setWallet(window.solana.publicKey.toString());}catch{};},[]);

  useEffect(()=>{
    if(!roomId||!db)return;
    rRef.current=ref(db,"games/"+roomId);
    const u=onValue(rRef.current,s=>{const d=s.val();if(!d)return;setGs(d);if(d.status==="finished")setScr("result");if(d.status==="active"&&d.p1&&d.p2&&!started){setStarted(true);lastAct.current=Date.now();}});
    return()=>u();
  },[roomId,started]);

  useEffect(()=>{
    if(scr!=="game"||!started||!gs)return;
    if(gs.status==="finished"||gs.finalPhase||gs.currentTurn!==myRole)return;
    clearInterval(tR.current);setTt(TSEC);
    tR.current=setInterval(()=>setTt(t=>{if(t<=1){clearInterval(tR.current);autoRev();return TSEC;}return t-1;}),1000);
    return()=>clearInterval(tR.current);
  },[gs?.currentTurn,gs?.finalPhase,scr,started]);

  useEffect(()=>{
    if(!gs?.finalPhase||gs?.status==="finished"||!started)return;
    clearInterval(iR.current);
    iR.current=setInterval(()=>{const rem=ISEC-Math.floor((Date.now()-lastAct.current)/1000);setIt(Math.max(0,rem));if(rem<=0){clearInterval(iR.current);const p1=gs.scores?.p1||0,p2=gs.scores?.p2||0;doEnd(p1>=p2?"p1":"p2","Time up! Winner by points ("+p1+" vs "+p2+")");}},1000);
    return()=>clearInterval(iR.current);
  },[gs?.finalPhase,gs?.status,started]);

  useEffect(()=>{
    if(!gs||gs.finalPhase||gs.status==="finished"||!gs.board)return;
    if(Object.keys(gs.revealed||{}).length>=gs.board.columns.reduce((s,c)=>s+c.fields.length,0)){update(rRef.current,{finalPhase:true});L("🎯 All fields open!");}
  },[gs?.revealed]);

  useEffect(()=>{
    if(scr!=="waiting"||!roomId||!db)return;
    const u=onValue(ref(db,"games/"+roomId),s=>{const d=s.val();if(d?.status==="active"&&d.p1&&d.p2){setGs(d);setStarted(true);lastAct.current=Date.now();setScr("game");L("Opponent joined! Your turn!");}});
    return()=>u();
  },[scr,roomId]);

  async function doWallet(){setWload(true);const a=await phantom();if(a)setWallet(a);setWload(false);}

  async function doCreate(){
    if(!nm.trim()||!myUid)return;
    if(!wallet){alert("Connect Phantom first!");return;}
    setScr("loading");setLdmsg("Picking new board...");
    const board=pickBoard();
    await new Promise(r=>setTimeout(r,300));
    setLdmsg("Confirming wager...");
    const tx=await signW(wager);
    if(!tx.ok){alert("Wager failed: "+tx.err);setScr("lobby");return;}
    const id=gid();
    try{
      await set(ref(db,"games/"+id),{p1:myUid,p1name:nm,p1wallet:wallet,p2:null,p2name:null,p2wallet:null,status:"waiting",wager,board,scores:{p1:0,p2:0},revealed:{},colSolved:{A:null,B:null,C:null,D:null},finalSolved:null,finalPhase:false,currentTurn:"p1",lastActivity:Date.now(),winner:null,p1tx:tx.id});
      setRoomId(id);setMyRole("p1");setStarted(false);setScr("waiting");
    }catch(e){alert("Error: "+e.message);setScr("lobby");}
  }

  async function doJoin(){
    const id=jin.trim().toUpperCase();
    if(!nm.trim()||!myUid||id.length<6)return;
    if(!wallet){alert("Connect Phantom first!");return;}
    setJerr("");setScr("loading");setLdmsg("Looking for room "+id+"...");
    try{
      const sn=await get(ref(db,"games/"+id));
      if(!sn.exists()){setJerr("Room "+id+" not found!");setScr("lobby");return;}
      const d=sn.val();
      if(d.status!=="waiting"){setJerr("Room already started!");setScr("lobby");return;}
      if(d.p1===myUid){setJerr("Can't join your own room!");setScr("lobby");return;}
      const tx=await signW(d.wager);
      if(!tx.ok){alert("Wager failed: "+tx.err);setScr("lobby");return;}
      await update(ref(db,"games/"+id),{p2:myUid,p2name:nm,p2wallet:wallet,status:"active",currentTurn:"p1",lastActivity:Date.now(),p2tx:tx.id});
      setWager(d.wager);setRoomId(id);setMyRole("p2");setStarted(true);lastAct.current=Date.now();setScr("game");L("Joined! P2. P1 goes first.");
    }catch(e){setJerr("Error: "+e.message);setScr("lobby");}
  }

  async function doOpen(fid){if(!isMy||didOpen||gs?.finalPhase||!started)return;touch();setDidOpen(true);await update(rRef.current,{["revealed/"+fid]:"clue",lastActivity:Date.now()});L("Field "+fid+" opened!");}

  async function autoRev(){
    if(!gs?.board||!rRef.current)return;
    const all=gs.board.columns.flatMap(c=>c.fields),hidden=all.filter(f=>!gs.revealed?.[f.id]);
    if(!hidden.length){await update(rRef.current,{finalPhase:true});return;}
    const pk=hidden[Math.floor(Math.random()*hidden.length)];
    await update(rRef.current,{["revealed/"+pk.id]:"clue",lastActivity:Date.now()});
    L("⏱ "+pk.id+" auto-revealed.");await doPass();
  }

  async function doGuessCol(cid,val){
    touch();const col=gs.board.columns.find(c=>c.id===cid);if(!col||gs.colSolved?.[cid])return false;
    if(match(val,col.theme)){const u={};col.fields.forEach(f=>{u["revealed/"+f.id]="solved_"+myRole;});u["colSolved/"+cid]=myRole;u["scores/"+myRole]=(gs.scores?.[myRole]||0)+20;u.lastActivity=Date.now();await update(rRef.current,u);L("✅ "+cid+': "'+col.theme+'" +20pts!');return true;}
    L("❌ Wrong. Opponent's turn!");await doPass();return false;
  }

  async function doGuessFinal(val){
    touch();if(match(val,gs.board.final.answer)){await update(rRef.current,{finalSolved:myRole,["scores/"+myRole]:(gs.scores?.[myRole]||0)+30,lastActivity:Date.now()});doEnd(myRole,"Final correct! +30pts 🎉");return true;}
    L("❌ Wrong final. Opponent's turn!");await doPass();return false;
  }

  async function doPass(){clearInterval(tR.current);setDidOpen(false);await update(rRef.current,{currentTurn:myRole==="p1"?"p2":"p1",lastActivity:Date.now()});}

  async function doEnd(w,reason){
    clearInterval(tR.current);clearInterval(iR.current);if(!rRef.current)return;
    await update(rRef.current,{status:"finished",winner:w,winReason:reason,finishedAt:Date.now()});
    if(!gs)return;const sc=gs.scores||{p1:0,p2:0};
    for(const r of["p1","p2"]){const u=gs[r];if(!u)continue;const lb=ref(db,"leaderboard/"+u);const sn=await get(lb);const cv=sn.val()||{wins:0,losses:0,points:0};await set(lb,{name:r==="p1"?gs.p1name:gs.p2name,wins:(cv.wins||0)+(w===r?1:0),losses:(cv.losses||0)+(w===r?0:1),points:(cv.points||0)+(sc[r]||0)});}
  }

  function doReset(){setScr("lobby");setRoomId(null);setMyRole(null);setGs(null);setDidOpen(false);setLog([]);setJin("");setJerr("");setStarted(false);}

  const board=gs?.board||null,isMy=gs?.currentTurn===myRole;
  const scores=gs?.scores||{p1:0,p2:0},revealed=gs?.revealed||{},colSolved=gs?.colSolved||{};
  const finalSolved=gs?.finalSolved||null,finalPhase=gs?.finalPhase||false,winner=gs?.winner||null,winReason=gs?.winReason||"";
  const myNm=myRole==="p1"?gs?.p1name||"P1":gs?.p2name||"P2",opNm=myRole==="p1"?gs?.p2name||"P2":gs?.p1name||"P1";
  const myScore=myRole==="p1"?scores.p1:scores.p2,opScore=myRole==="p1"?scores.p2:scores.p1;
  const canOpen=isMy&&!didOpen&&!finalPhase&&!winner&&gs?.status==="active"&&started;
  const canGuess=isMy&&(didOpen||finalPhase)&&!winner&&gs?.status==="active"&&started;
  const fst=fid=>{const r=revealed[fid];if(!r)return{st:"hidden",solvedBy:null};if(r==="clue")return{st:"clue",solvedBy:null};if(r==="solved_p1")return{st:"solved",solvedBy:"p1"};if(r==="solved_p2")return{st:"solved",solvedBy:"p2"};return{st:"clue",solvedBy:null};};

  /* LOBBY */
  if(scr==="lobby")return(
    <div style={ROOT}><style>{CSS}</style>
      <div style={{background:"#0a1628",padding:"12px 16px",borderBottom:"2px solid #f59e0b",textAlign:"center",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:2}}>
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><polygon points="32,2 54,16 54,40 32,54 10,40 10,16" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity=".6"/><circle cx="32" cy="26" r="16" fill="#fff" opacity=".93"/><rect x="24" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93"/><rect x="33" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93"/><ellipse cx="26" cy="24" rx="4.5" ry="5.5" fill="#111"/><ellipse cx="38" cy="24" rx="4.5" ry="5.5" fill="#111"/><ellipse cx="26" cy="23" rx="1.5" ry="2" fill="#8b5cf6" opacity=".9"/><ellipse cx="38" cy="23" rx="1.5" ry="2" fill="#22c55e" opacity=".9"/><path d="M28 34 L32 31 L36 34" stroke="#333" strokeWidth="1.5" fill="none"/></svg>
          <span style={{fontFamily:"'Black Ops One',cursive",fontSize:22,color:"#22c55e",letterSpacing:4,textShadow:"0 0 16px #22c55e88"}}>FREEDOM</span>
        </div>
        <div style={{fontFamily:"'Black Ops One',cursive",fontSize:11,color:"#f59e0b",letterSpacing:4}}>ASSOCIATIONS</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        <div style={{background:"rgba(255,255,255,.05)",borderRadius:12,padding:"10px",marginBottom:10,border:"1px solid rgba(255,255,255,.1)"}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:2,marginBottom:6}}>PHANTOM WALLET</div>
          {wallet?<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 8px #22c55e"}}/><span style={{fontSize:11,color:"#22c55e",fontFamily:"monospace"}}>{wallet.slice(0,6)}...{wallet.slice(-4)}</span><span style={{fontSize:9,color:"rgba(255,255,255,.3)",marginLeft:"auto"}}>✓ Connected</span></div>:<button onClick={doWallet} disabled={wload} style={{width:"100%",padding:"10px 0",background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1}}>{wload?"CONNECTING...":"🔗 CONNECT PHANTOM WALLET"}</button>}
        </div>
        <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="Your name / username" maxLength={16} style={{width:"100%",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:12,padding:"11px 14px",color:"#fff",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:2,marginBottom:6}}>WAGER — FREEDOM TOKENS</div>
          <div style={{display:"flex",gap:8}}>{WAGERS.map(w=><button key={w} onClick={()=>setWager(w)} style={{flex:1,padding:"10px 0",borderRadius:10,fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",background:wager===w?"#f59e0b":"rgba(255,255,255,.08)",color:wager===w?"#fff":"rgba(255,255,255,.7)",border:`2px solid ${wager===w?"#f59e0b":"rgba(255,255,255,.15)"}`}}>{w}</button>)}</div>
        </div>
        <div style={{display:"flex",borderRadius:12,overflow:"hidden",border:"1px solid rgba(255,255,255,.15)",marginBottom:10}}>{[["create","🎮 CREATE"],["join","🚪 JOIN"]].map(([m,l])=><button key={m} onClick={()=>{setMode(m);setJerr("");}} style={{flex:1,padding:"11px 0",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",background:mode===m?"#f59e0b":"transparent",color:mode===m?"#fff":"rgba(255,255,255,.5)",border:"none",letterSpacing:1}}>{l}</button>)}</div>
        {mode==="create"&&<button onClick={doCreate} disabled={!nm.trim()||!wallet} style={{width:"100%",padding:"14px 0",background:nm.trim()&&wallet?"linear-gradient(90deg,#f59e0b,#d97706)":"rgba(255,255,255,.08)",color:nm.trim()&&wallet?"#fff":"rgba(255,255,255,.3)",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:14,fontWeight:900,cursor:nm.trim()&&wallet?"pointer":"default",letterSpacing:2,boxShadow:nm.trim()&&wallet?"0 4px 0 rgba(0,0,0,.3)":"none"}}>🎮 CREATE ROOM</button>}
        {mode==="join"&&<div>
          <div style={{fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:2,marginBottom:6}}>ENTER ROOM ID</div>
          <input value={jin} onChange={e=>{setJin(e.target.value.toUpperCase());setJerr("");}} maxLength={6} placeholder="ABC123" style={{width:"100%",background:"rgba(255,255,255,.08)",border:`2px solid ${jin.length===6?"#22c55e":"rgba(255,255,255,.15)"}`,borderRadius:12,padding:"12px",color:"#22c55e",fontSize:24,outline:"none",fontFamily:"'Black Ops One',cursive",boxSizing:"border-box",textAlign:"center",letterSpacing:10,marginBottom:6}}/>
          {jerr&&<div style={{padding:"7px 10px",background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.4)",borderRadius:8,fontSize:11,color:"#ef4444",marginBottom:6}}>⚠ {jerr}</div>}
          <button onClick={doJoin} disabled={!nm.trim()||!wallet||jin.length<6} style={{width:"100%",padding:"14px 0",background:jin.length===6&&nm.trim()&&wallet?"linear-gradient(90deg,#22c55e,#16a34a)":"rgba(255,255,255,.08)",color:jin.length===6&&nm.trim()&&wallet?"#fff":"rgba(255,255,255,.3)",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:14,fontWeight:900,cursor:jin.length===6&&nm.trim()&&wallet?"pointer":"default",letterSpacing:2}}>🚪 JOIN ROOM</button>
        </div>}
        <div style={{marginTop:12,background:"rgba(255,255,255,.04)",borderRadius:12,padding:"10px",border:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{color:"#f59e0b",fontSize:10,fontWeight:700,letterSpacing:2,marginBottom:6}}>RULES</div>
          {[["30s/turn","Open 1 field. Timer starts when both join."],["Guessing","Correct = keep turn. Wrong = opponent's turn."],["Time up","30s = random field auto-reveals."],["Final","All fields open: 60s idle = winner by POINTS."],["Points","Theme +20 · Final +30"]].map(([t,d],i)=><div key={i} style={{display:"flex",gap:8,marginBottom:4}}><span style={{fontSize:9,color:"#f59e0b",fontWeight:700,whiteSpace:"nowrap",minWidth:55}}>{t}</span><span style={{fontSize:10,color:"rgba(255,255,255,.45)",lineHeight:1.4}}>{d}</span></div>)}
        </div>
        <div style={{textAlign:"center",marginTop:12,paddingBottom:6}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:11,letterSpacing:2}}><span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"rgba(255,255,255,.3)"}}>.FUN</span></span></div>
      </div>
    </div>
  );

  if(scr==="loading")return<Spin msg={ldmsg}/>;

  if(scr==="waiting")return(
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
        <button onClick={()=>{try{set(ref(db,"games/"+roomId),null);}catch{}setScr("lobby");setRoomId(null);setMyRole(null);setStarted(false);}} style={{padding:"10px 22px",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer"}}>CANCEL</button>
      </div>
    </div>
  );

  if(scr==="result"||winner)return(
    <div style={ROOT}><style>{CSS}</style>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{width:"100%",maxWidth:380,background:"#0a1628",borderRadius:20,padding:"24px 18px",textAlign:"center",border:"2px solid rgba(255,255,255,.1)"}}>
          <div style={{fontSize:56}}>{winner===myRole?"🏆":"💀"}</div>
          <div style={{fontFamily:"'Black Ops One',cursive",fontSize:24,letterSpacing:3,marginTop:6,color:winner===myRole?"#22c55e":"#ef4444"}}>{winner===myRole?"YOU WIN!":"YOU LOSE"}</div>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:12,marginTop:5,marginBottom:18}}>{winReason}</div>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:18}}>{["p1","p2"].map(r=><div key={r} style={{flex:1,padding:"12px",borderRadius:12,background:r===winner?"rgba(34,197,94,.1)":"rgba(255,255,255,.05)",border:`2px solid ${r===winner?"#22c55e":"rgba(255,255,255,.1)"}`}}><div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>{r===myRole?myNm:opNm}</div><div style={{fontSize:30,fontWeight:900,color:r===winner?"#22c55e":"#fff"}}>{r==="p1"?scores.p1:scores.p2}</div><div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>pts</div></div>)}</div>
          {winner===myRole&&<div style={{color:"#f59e0b",fontSize:12,marginBottom:14}}>🎉 Winnings: <b>{wager*2}</b> FREEDOM tokens</div>}
          <button onClick={doReset} style={{width:"100%",padding:"13px",background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:13,fontWeight:900,cursor:"pointer",letterSpacing:2,boxShadow:"0 4px 0 rgba(0,0,0,.3)"}}>NEW GAME</button>
        </div>
      </div>
    </div>
  );

  if(!board)return<Spin msg="Loading..."/>;
  const[colA,colB,colC,colD]=board.columns;

  /* ── SCOREBOARD ── */
  const SB=(
    <div style={{background:"#0a1628",padding:"7px 14px",borderBottom:"2px solid #f59e0b",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:R,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Black Ops One',cursive",fontSize:12,color:"#fff",flexShrink:0,boxShadow:"0 2px 0 rgba(0,0,0,.3)"}}>{myNm.slice(0,2).toUpperCase()}</div>
          <div><div style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{myNm}</div><div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{myScore}</div></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:60}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:"#060e1c",border:`3px solid ${!started?"#1a3450":finalPhase?(it<10?"#ef4444":"#f59e0b"):isMy?"#22c55e":"#1a3450"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:"'Black Ops One',cursive",fontSize:15,fontWeight:900,color:!started?"#1a3450":finalPhase?"#f59e0b":isMy?"#22c55e":"#1a3450"}}>{!started?"⏳":finalPhase&&isMy?it:!finalPhase&&isMy?tt:"·"}</span>
          </div>
          <div style={{fontSize:7,color:isMy&&started?"#22c55e":"rgba(255,255,255,.3)",letterSpacing:1,fontWeight:700}}>{!started?"WAIT":finalPhase?"FINAL":isMy?"YOUR TURN":"WAIT"}</div>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{opNm}</div><div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{opScore}</div></div>
          <div style={{width:36,height:36,borderRadius:"50%",background:B,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Black Ops One',cursive",fontSize:12,color:"#fff",flexShrink:0,boxShadow:"0 2px 0 rgba(0,0,0,.3)"}}>{opNm.slice(0,2).toUpperCase()}</div>
        </div>
      </div>
      <div style={{textAlign:"center",marginTop:4,fontSize:10,color:isMy&&started?"#f59e0b":"rgba(255,255,255,.3)",fontWeight:700}}>
        {!started?"⏳ Waiting...":finalPhase?(isMy?"🎯 TAP ? TO GUESS":"⏳ OPPONENT..."):isMy?(canOpen?"👆 TAP A FIELD TO REVEAL":canGuess?"💡 TAP ? TO GUESS":"..."):"⏳ OPPONENT'S TURN"}
      </div>
    </div>
  );

  const PL=(
    <div style={{display:"flex",gap:8,alignItems:"flex-start",marginTop:6}}>
      {isMy&&!finalPhase&&didOpen&&started&&<button onClick={()=>{touch();doPass();L("Passed.");}} style={{padding:"8px 14px",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.15)",borderRadius:8,fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>PASS</button>}
      {log.length>0&&<div style={{flex:1,padding:"5px 9px",background:"rgba(0,0,0,.3)",borderRadius:8}}>{log.map((l,i)=><div key={i} style={{fontSize:10,color:i===0?"rgba(255,255,255,.8)":"rgba(255,255,255,.3)",padding:"1px 0"}}>{l}</div>)}</div>}
    </div>
  );

  /* ══════════════════════════════════════════════════════
     DESKTOP — X layout, fields fill full screen height
     
     Uses explicit height: calc(100vh - 230px) on the grid
     so CSS Grid 1fr rows get a real height to divide
  ══════════════════════════════════════════════════════ */
  if(desktop){
    const G=10,TW=110,FW=140,LW=30;
    const lbl=(txt,c)=><span style={{fontFamily:"'Black Ops One',cursive",fontSize:24,color:c,textShadow:"0 0 12px "+c+"66"}}>{txt}</span>;

    return(
      <div style={ROOT}><style>{CSS}</style>
      {SB}
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"10px 16px",overflow:"hidden"}}>

        {/* THE GRID — explicit calc height so 1fr rows expand */}
        <div style={{
          display:"grid",
          gridTemplateColumns:LW+"px 1fr "+TW+"px "+FW+"px "+TW+"px 1fr "+LW+"px",
          gridTemplateRows:"1fr 1fr",
          gap:G,
          width:"100%",
          height:"calc(100vh - 230px)",
          marginBottom:8,
        }}>
          {/* ── ROW 1 ── */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{lbl("A",R)}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {[...colA.fields].reverse().map(f=>{const{st,solvedBy}=fst(f.id);return<Field key={f.id} field={f} st={st} solvedBy={solvedBy} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h="100%"/>;}) }
          </div>
          <div><TInput cid="A" solved={!!colSolved.A} solvedBy={colSolved.A} theme={colA.theme} disabled={!canGuess} onGuess={v=>doGuessCol("A",v)} h="100%"/></div>
          {/* FINAL — spans rows 1 & 2 */}
          <div style={{gridRow:"1/3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:finalPhase?"rgba(245,158,11,.08)":"#060e1c",border:"2px solid "+(finalPhase?"#f59e0b66":"#1a3450"),borderRadius:14,textAlign:"center",animation:finalPhase?"glowPulse 2s infinite":"none",padding:12}}>
            <div style={{fontSize:9,color:"#2a4a6a",letterSpacing:2,marginBottom:10}}>FINAL ANSWER</div>
            {finalSolved?<div style={{fontSize:14,fontWeight:900,color:finalSolved==="p1"?R:B}}>{board.final.answer}</div>:<div style={{fontSize:28,color:"#1a3450",fontWeight:900,fontFamily:"'Black Ops One',cursive",lineHeight:1}}>???</div>}
            <div style={{fontSize:8,color:"#1a3450",marginTop:10,fontStyle:"italic"}}>{board.final.hint}</div>
          </div>
          <div><TInput cid="B" solved={!!colSolved.B} solvedBy={colSolved.B} theme={colB.theme} disabled={!canGuess} onGuess={v=>doGuessCol("B",v)} h="100%"/></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {colB.fields.map(f=>{const{st,solvedBy}=fst(f.id);return<Field key={f.id} field={f} st={st} solvedBy={solvedBy} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h="100%"/>;}) }
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{lbl("B",B)}</div>

          {/* ── ROW 2 ── */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{lbl("C",R)}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {[...colC.fields].reverse().map(f=>{const{st,solvedBy}=fst(f.id);return<Field key={f.id} field={f} st={st} solvedBy={solvedBy} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h="100%"/>;}) }
          </div>
          <div><TInput cid="C" solved={!!colSolved.C} solvedBy={colSolved.C} theme={colC.theme} disabled={!canGuess} onGuess={v=>doGuessCol("C",v)} h="100%"/></div>
          {/* col 4 = FINAL (already placed) */}
          <div><TInput cid="D" solved={!!colSolved.D} solvedBy={colSolved.D} theme={colD.theme} disabled={!canGuess} onGuess={v=>doGuessCol("D",v)} h="100%"/></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {colD.fields.map(f=>{const{st,solvedBy}=fst(f.id);return<Field key={f.id} field={f} st={st} solvedBy={solvedBy} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h="100%"/>;}) }
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{lbl("D",B)}</div>
        </div>

        <div style={{maxWidth:500,margin:"0 auto 6px",width:"100%"}}>
          <FInput solved={!!finalSolved} solvedBy={finalSolved} answer={board.final.answer} disabled={!canGuess} onGuess={doGuessFinal} h={50}/>
        </div>
        {PL}
        <div style={{textAlign:"center",padding:"4px 0"}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:10,letterSpacing:2}}><span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"rgba(255,255,255,.3)"}}>.FUN</span></span></div>
      </div>
      </div>
    );
  }

  /* ── MOBILE ── */
  return(
    <div style={ROOT}><style>{CSS}</style>
    {SB}
    <div style={{flex:1,overflowY:"auto",padding:"7px 10px"}}>
      <div style={{maxWidth:500,margin:"0 auto",display:"flex",flexDirection:"column",gap:5}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <div style={{textAlign:"center",paddingBottom:2,borderBottom:"3px solid "+R}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:R,letterSpacing:3}}>A</span></div>
          <div style={{textAlign:"center",paddingBottom:2,borderBottom:"3px solid "+B}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:B,letterSpacing:3}}>B</span></div>
        </div>
        {[0,1,2,3].map(i=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{[colA.fields[i],colB.fields[i]].map(f=>{const{st,solvedBy}=fst(f.id);return<Field key={f.id} field={f} st={st} solvedBy={solvedBy} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h={52}/>;})}</div>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <TInput cid="A" solved={!!colSolved.A} solvedBy={colSolved.A} theme={colA.theme} disabled={!canGuess} onGuess={v=>doGuessCol("A",v)} h={48}/>
          <TInput cid="B" solved={!!colSolved.B} solvedBy={colSolved.B} theme={colB.theme} disabled={!canGuess} onGuess={v=>doGuessCol("B",v)} h={48}/>
        </div>
        <FInput solved={!!finalSolved} solvedBy={finalSolved} answer={board.final.answer} disabled={!canGuess} onGuess={doGuessFinal} h={56}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <TInput cid="C" solved={!!colSolved.C} solvedBy={colSolved.C} theme={colC.theme} disabled={!canGuess} onGuess={v=>doGuessCol("C",v)} h={48}/>
          <TInput cid="D" solved={!!colSolved.D} solvedBy={colSolved.D} theme={colD.theme} disabled={!canGuess} onGuess={v=>doGuessCol("D",v)} h={48}/>
        </div>
        {[0,1,2,3].map(i=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{[colC.fields[i],colD.fields[i]].map(f=>{const{st,solvedBy}=fst(f.id);return<Field key={f.id} field={f} st={st} solvedBy={solvedBy} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h={52}/>;})}</div>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <div style={{textAlign:"center",paddingTop:2,borderTop:"3px solid "+R}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:R,letterSpacing:3}}>C</span></div>
          <div style={{textAlign:"center",paddingTop:2,borderTop:"3px solid "+B}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:B,letterSpacing:3}}>D</span></div>
        </div>
        {PL}
        <div style={{textAlign:"center",padding:"6px 0 2px"}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:10,letterSpacing:2}}><span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"rgba(255,255,255,.3)"}}>.FUN</span></span></div>
      </div>
    </div>
    </div>
  );
}

const ROOT={height:"100vh",display:"flex",flexDirection:"column",background:"#0d1b2e",fontFamily:"'Rajdhani','Oswald',sans-serif",color:"#fff",overflow:"hidden"};
const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;600;700&display=swap');
  html,body{margin:0;padding:0;background:#0d1b2e;}
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  @keyframes pop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(245,158,11,.2)}50%{box-shadow:0 0 40px rgba(245,158,11,.5)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:rgba(0,0,0,.3)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:2px}
`;
