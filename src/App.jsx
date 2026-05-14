/* eslint-disable */
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";

const FB = { apiKey:"AIzaSyAKmKRj7Hhy4K6DsY_XDbqLb3oYOwZC5jw", authDomain:"project-freedom-a004e.firebaseapp.com", databaseURL:"https://project-freedom-a004e-default-rtdb.firebaseio.com", projectId:"project-freedom-a004e", storageBucket:"project-freedom-a004e.firebasestorage.app", messagingSenderId:"844172246267", appId:"1:844172246267:web:a31b8cd6affe8337f7845e" };
let db; try { db = getDatabase(initializeApp(FB)); } catch(e) {}

function getUid() {
  try {
    let id = localStorage.getItem("_pgf");
    if (!id) { id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2); localStorage.setItem("_pgf", id); }
    return id;
  } catch { return "u" + Math.random().toString(36).slice(2,14); }
}

const ESCROW = "GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const WAGERS = [100,500,1000];
const TSEC=30, ISEC=60;
const PC1="#e53935", PC2="#1e88e5";

/* ═════════════════════════════════════════════════
   30 COMPLETELY FRESH BOARDS
   Forbidden forever: Animals, Food (pizza/sushi/burrito/baguette),
   King of jungle, Black & white stripes, Trunk & tusks
   
   Board rotates automatically every 30 seconds via timestamp.
   Users who create rooms at different times get different boards.
═════════════════════════════════════════════════ */
const B = [
  /* 0 */ { columns:[
    {id:"A",theme:"BRIDGES",fields:[{id:"A1",clue:"London drawbridge",answer:"TOWERBRIDGE"},{id:"A2",clue:"San Francisco icon",answer:"GOLDENGATE"},{id:"A3",clue:"Venice marble",answer:"RIALTO"},{id:"A4",clue:"Brooklyn NY",answer:"BROOKLYN"}]},
    {id:"B",theme:"MUSIC GENRES",fields:[{id:"B1",clue:"Jamaica rhythm",answer:"REGGAE"},{id:"B2",clue:"Electronic dance",answer:"TECHNO"},{id:"B3",clue:"Guitar & rebellion",answer:"PUNK"},{id:"B4",clue:"Piano & blues",answer:"JAZZ"}]},
    {id:"C",theme:"ANCIENT EMPIRES",fields:[{id:"C1",clue:"Rome's peak power",answer:"ROMAN"},{id:"C2",clue:"Egypt pharaohs",answer:"EGYPTIAN"},{id:"C3",clue:"Greece city-states",answer:"GREEK"},{id:"C4",clue:"Genghis Khan",answer:"MONGOL"}]},
    {id:"D",theme:"CODE LANGUAGES",fields:[{id:"D1",clue:"Snake language",answer:"PYTHON"},{id:"D2",clue:"Coffee language",answer:"JAVA"},{id:"D3",clue:"Web trio front",answer:"JAVASCRIPT"},{id:"D4",clue:"Low level fast",answer:"C"}]},
  ], final:{answer:"CIVILIZATION",hint:"Human achievement"} },

  /* 1 */ { columns:[
    {id:"A",theme:"FAMOUS AUTHORS",fields:[{id:"A1",clue:"To Kill Mockingbird",answer:"LEEHARPER"},{id:"A2",clue:"1984 & Big Brother",answer:"ORWELL"},{id:"A3",clue:"Don Quixote",answer:"CERVANTES"},{id:"A4",clue:"War & Peace",answer:"TOLSTOY"}]},
    {id:"B",theme:"NATURAL DISASTERS",fields:[{id:"B1",clue:"Ring of fire shaker",answer:"EARTHQUAKE"},{id:"B2",clue:"Sea surge wave",answer:"TSUNAMI"},{id:"B3",clue:"Funnel wind vortex",answer:"TORNADO"},{id:"B4",clue:"Lava mountain",answer:"VOLCANO"}]},
    {id:"C",theme:"CONSTELLATIONS",fields:[{id:"C1",clue:"Hunter in the sky",answer:"ORION"},{id:"C2",clue:"Bear in the north",answer:"URSAMAJOR"},{id:"C3",clue:"Southern cross",answer:"CRUX"},{id:"C4",clue:"Zodiac water bearer",answer:"AQUARIUS"}]},
    {id:"D",theme:"FAMOUS OPERAS",fields:[{id:"D1",clue:"Phantom of the",answer:"PHANTOM"},{id:"D2",clue:"Verdi's slave princess",answer:"AIDA"},{id:"D3",clue:"Butterfly Japan",answer:"MADAMA"},{id:"D4",clue:"Don Giovanni Mozart",answer:"DONGIOVANNI"}]},
  ], final:{answer:"CULTURE",hint:"Art of civilization"} },

  /* 2 */ { columns:[
    {id:"A",theme:"SPACE AGENCIES",fields:[{id:"A1",clue:"USA rockets",answer:"NASA"},{id:"A2",clue:"Europe rockets",answer:"ESA"},{id:"A3",clue:"Russia rockets",answer:"ROSCOSMOS"},{id:"A4",clue:"China rockets",answer:"CNSA"}]},
    {id:"B",theme:"NATIONAL PARKS",fields:[{id:"B1",clue:"USA grand canyon",answer:"GRANDCANYON"},{id:"B2",clue:"Geysers USA",answer:"YELLOWSTONE"},{id:"B3",clue:"Serengeti Tanzania",answer:"SERENGETI"},{id:"B4",clue:"Amazon rainforest",answer:"AMAZON"}]},
    {id:"C",theme:"FAMOUS SPEECHES",fields:[{id:"C1",clue:"I have a dream",answer:"MLKJUNIOR"},{id:"C2",clue:"We shall fight beaches",answer:"CHURCHILL"},{id:"C3",clue:"Ask not what country",answer:"KENNEDY"},{id:"C4",clue:"Gettysburg address",answer:"LINCOLN"}]},
    {id:"D",theme:"CRYPTO COINS",fields:[{id:"D1",clue:"First crypto",answer:"BITCOIN"},{id:"D2",clue:"Smart contracts",answer:"ETHEREUM"},{id:"D3",clue:"Meme dog coin",answer:"DOGECOIN"},{id:"D4",clue:"Fastest blockchain",answer:"SOLANA"}]},
  ], final:{answer:"FRONTIER",hint:"Edge of the known"} },

  /* 3 */ { columns:[
    {id:"A",theme:"MARTIAL ARTS",fields:[{id:"A1",clue:"Japanese throws",answer:"JUDO"},{id:"A2",clue:"Korean kicks",answer:"TAEKWONDO"},{id:"A3",clue:"Brazilian ground",answer:"BJJ"},{id:"A4",clue:"Chinese strikes",answer:"KUNGFU"}]},
    {id:"B",theme:"PRECIOUS METALS",fields:[{id:"B1",clue:"Olympic gold",answer:"GOLD"},{id:"B2",clue:"Olympic silver",answer:"SILVER"},{id:"B3",clue:"Wedding ring metal",answer:"PLATINUM"},{id:"B4",clue:"Olympic bronze",answer:"BRONZE"}]},
    {id:"C",theme:"CHEESES",fields:[{id:"C1",clue:"Italian hard pasta",answer:"PARMESAN"},{id:"C2",clue:"French soft white",answer:"BRIE"},{id:"C3",clue:"Blue veiny Italian",answer:"GORGONZOLA"},{id:"C4",clue:"Stretchy pizza top",answer:"MOZZARELLA"}]},
    {id:"D",theme:"DETECTIVES",fields:[{id:"D1",clue:"221B Baker Street",answer:"HOLMES"},{id:"D2",clue:"Belgian mustache",answer:"POIROT"},{id:"D3",clue:"Little old lady",answer:"MARPLE"},{id:"D4",clue:"Trench coat Columbo",answer:"COLUMBO"}]},
  ], final:{answer:"MASTERY",hint:"Expert skill"} },

  /* 4 */ { columns:[
    {id:"A",theme:"ART MOVEMENTS",fields:[{id:"A1",clue:"Monet & water lily",answer:"IMPRESSIONISM"},{id:"A2",clue:"Picasso distorted",answer:"CUBISM"},{id:"A3",clue:"Dali melting clocks",answer:"SURREALISM"},{id:"A4",clue:"Bold colors Matisse",answer:"FAUVISM"}]},
    {id:"B",theme:"FAMOUS QUOTES",fields:[{id:"B1",clue:"Carpe diem seize",answer:"HORACE"},{id:"B2",clue:"Cogito ergo sum",answer:"DESCARTES"},{id:"B3",clue:"To be or not to be",answer:"SHAKESPEARE"},{id:"B4",clue:"Power tends corrupt",answer:"ACTON"}]},
    {id:"C",theme:"WINE REGIONS",fields:[{id:"C1",clue:"Bordeaux France",answer:"BORDEAUX"},{id:"C2",clue:"Tuscany Italy",answer:"TUSCANY"},{id:"C3",clue:"Mendoza Argentina",answer:"MENDOZA"},{id:"C4",clue:"Napa California",answer:"NAPA"}]},
    {id:"D",theme:"FAMOUS RACES",fields:[{id:"D1",clue:"Monaco F1 street",answer:"MONACO"},{id:"D2",clue:"Le Mans 24hr",answer:"LEMANS"},{id:"D3",clue:"Boston marathon",answer:"BOSTON"},{id:"D4",clue:"Tour de France",answer:"TOUR"}]},
  ], final:{answer:"PASSION",hint:"Deep driving force"} },

  /* 5 */ { columns:[
    {id:"A",theme:"GREEK GODS",fields:[{id:"A1",clue:"King of gods",answer:"ZEUS"},{id:"A2",clue:"Sea trident god",answer:"POSEIDON"},{id:"A3",clue:"Underworld god",answer:"HADES"},{id:"A4",clue:"War god",answer:"ARES"}]},
    {id:"B",theme:"ELEMENTS",fields:[{id:"B1",clue:"Periodic table 1",answer:"HYDROGEN"},{id:"B2",clue:"Bling bling metal",answer:"GOLD"},{id:"B3",clue:"We breathe it",answer:"OXYGEN"},{id:"B4",clue:"Diamond material",answer:"CARBON"}]},
    {id:"C",theme:"FAMOUS QUOTES 2",fields:[{id:"C1",clue:"Elementary my dear",answer:"HOLMES"},{id:"C2",clue:"May the force be",answer:"STARWARS"},{id:"C3",clue:"I'll be back",answer:"TERMINATOR"},{id:"C4",clue:"You can't handle",answer:"FEWGOODMEN"}]},
    {id:"D",theme:"BOARD GAMES",fields:[{id:"D1",clue:"32 piece board",answer:"CHESS"},{id:"D2",clue:"Buy & rent property",answer:"MONOPOLY"},{id:"D3",clue:"Stack & topple",answer:"JENGA"},{id:"D4",clue:"Words on board",answer:"SCRABBLE"}]},
  ], final:{answer:"LEGACY",hint:"What you leave behind"} },

  /* 6 */ { columns:[
    {id:"A",theme:"RIVERS",fields:[{id:"A1",clue:"Egypt's lifeline",answer:"NILE"},{id:"A2",clue:"Through Paris",answer:"SEINE"},{id:"A3",clue:"China's sorrow",answer:"YANGTZE"},{id:"A4",clue:"India's sacred",answer:"GANGES"}]},
    {id:"B",theme:"MINERALS",fields:[{id:"B1",clue:"Pink quartz love",answer:"ROSEQUARTZ"},{id:"B2",clue:"Purple crystal",answer:"AMETHYST"},{id:"B3",clue:"Black volcanic blade",answer:"OBSIDIAN"},{id:"B4",clue:"Green malachite",answer:"MALACHITE"}]},
    {id:"C",theme:"CURRENCIES",fields:[{id:"C1",clue:"USA dollar sign",answer:"DOLLAR"},{id:"C2",clue:"European money",answer:"EURO"},{id:"C3",clue:"Japan money",answer:"YEN"},{id:"C4",clue:"UK money",answer:"POUND"}]},
    {id:"D",theme:"COCKTAILS",fields:[{id:"D1",clue:"James Bond's pick",answer:"MARTINI"},{id:"D2",clue:"Rum & mint leaves",answer:"MOJITO"},{id:"D3",clue:"Tequila & lime",answer:"MARGARITA"},{id:"D4",clue:"Coconut & rum cream",answer:"PINACOLADA"}]},
  ], final:{answer:"CLASSIC",hint:"Timeless and enduring"} },

  /* 7 */ { columns:[
    {id:"A",theme:"FASHION HOUSES",fields:[{id:"A1",clue:"French CC double",answer:"CHANEL"},{id:"A2",clue:"Italian LV bags",answer:"VUITTON"},{id:"A3",clue:"Italian Gucci",answer:"GUCCI"},{id:"A4",clue:"Italian Prada",answer:"PRADA"}]},
    {id:"B",theme:"PHOBIAS",fields:[{id:"B1",clue:"Fear of heights",answer:"ACROPHOBIA"},{id:"B2",clue:"Fear of spiders",answer:"ARACHNOPHOBIA"},{id:"B3",clue:"Fear of flying",answer:"AVIOPHOBIA"},{id:"B4",clue:"Fear of open spaces",answer:"AGORAPHOBIA"}]},
    {id:"C",theme:"FAMOUS SHIPS",fields:[{id:"C1",clue:"Iceberg disaster",answer:"TITANIC"},{id:"C2",clue:"Columbus flagship",answer:"SANTAMARIA"},{id:"C3",clue:"Star Trek starship",answer:"ENTERPRISE"},{id:"C4",clue:"Pirate legendary",answer:"BLACKPEARL"}]},
    {id:"D",theme:"TECH GIANTS",fields:[{id:"D1",clue:"Bitten apple logo",answer:"APPLE"},{id:"D2",clue:"Search engine giant",answer:"GOOGLE"},{id:"D3",clue:"Social network",answer:"FACEBOOK"},{id:"D4",clue:"Everything store",answer:"AMAZON"}]},
  ], final:{answer:"POWER",hint:"Force that shapes the world"} },

  /* 8 */ { columns:[
    {id:"A",theme:"MEDIEVAL",fields:[{id:"A1",clue:"Armor clad warrior",answer:"KNIGHT"},{id:"A2",clue:"Fire breathing beast",answer:"DRAGON"},{id:"A3",clue:"Magic spell caster",answer:"WIZARD"},{id:"A4",clue:"Stone fortress home",answer:"CASTLE"}]},
    {id:"B",theme:"SPACE MISSIONS",fields:[{id:"B1",clue:"Moon landing 1969",answer:"APOLLO"},{id:"B2",clue:"Space telescope",answer:"HUBBLE"},{id:"B3",clue:"Mars rover NASA",answer:"CURIOSITY"},{id:"B4",clue:"First satellite USSR",answer:"SPUTNIK"}]},
    {id:"C",theme:"WORLD RECORDS",fields:[{id:"C1",clue:"Tallest building",answer:"BURJKHALIFA"},{id:"C2",clue:"Longest river",answer:"NILE"},{id:"C3",clue:"Deepest ocean",answer:"MARIANATRENCH"},{id:"C4",clue:"Largest desert",answer:"SAHARA"}]},
    {id:"D",theme:"FAMOUS DUOS",fields:[{id:"D1",clue:"Batman and",answer:"ROBIN"},{id:"D2",clue:"Tom and",answer:"JERRY"},{id:"D3",clue:"Sherlock and Watson",answer:"WATSON"},{id:"D4",clue:"Mario and",answer:"LUIGI"}]},
  ], final:{answer:"EPIC",hint:"Larger than life"} },

  /* 9 */ { columns:[
    {id:"A",theme:"PLANETS",fields:[{id:"A1",clue:"Red planet",answer:"MARS"},{id:"A2",clue:"Ringed giant",answer:"SATURN"},{id:"A3",clue:"Morning star",answer:"VENUS"},{id:"A4",clue:"Blue ice giant",answer:"NEPTUNE"}]},
    {id:"B",theme:"CAPITALS",fields:[{id:"B1",clue:"Eiffel Tower city",answer:"PARIS"},{id:"B2",clue:"Rising sun capital",answer:"TOKYO"},{id:"B3",clue:"Thames River city",answer:"LONDON"},{id:"B4",clue:"Vatican neighbour",answer:"ROME"}]},
    {id:"C",theme:"SUPERHEROES",fields:[{id:"C1",clue:"Web slinger",answer:"SPIDERMAN"},{id:"C2",clue:"Dark knight",answer:"BATMAN"},{id:"C3",clue:"Iron suit billionaire",answer:"IRONMAN"},{id:"C4",clue:"Super soldier",answer:"CAPTAIN"}]},
    {id:"D",theme:"OCEANS",fields:[{id:"D1",clue:"World's biggest",answer:"PACIFIC"},{id:"D2",clue:"Titanic sank here",answer:"ATLANTIC"},{id:"D3",clue:"Between continents",answer:"INDIAN"},{id:"D4",clue:"North polar sea",answer:"ARCTIC"}]},
  ], final:{answer:"WORLD",hint:"The big picture"} },

  /* 10 */ { columns:[
    {id:"A",theme:"CARS",fields:[{id:"A1",clue:"Italian stallion",answer:"FERRARI"},{id:"A2",clue:"German luxury",answer:"BMW"},{id:"A3",clue:"Electric pioneer",answer:"TESLA"},{id:"A4",clue:"Japanese reliable",answer:"TOYOTA"}]},
    {id:"B",theme:"MOUNTAINS",fields:[{id:"B1",clue:"World's highest",answer:"EVEREST"},{id:"B2",clue:"Swiss Alps icon",answer:"MATTERHORN"},{id:"B3",clue:"Africa's roof",answer:"KILIMANJARO"},{id:"B4",clue:"Japan's sacred peak",answer:"FUJI"}]},
    {id:"C",theme:"DANCES",fields:[{id:"C1",clue:"Argentine passion",answer:"TANGO"},{id:"C2",clue:"Cuban rhythm",answer:"SALSA"},{id:"C3",clue:"Spanish style",answer:"FLAMENCO"},{id:"C4",clue:"Hawaiian hips",answer:"HULA"}]},
    {id:"D",theme:"RIVERS 2",fields:[{id:"D1",clue:"Rome's river",answer:"TIBER"},{id:"D2",clue:"Vienna's blue river",answer:"DANUBE"},{id:"D3",clue:"Russia's longest",answer:"VOLGA"},{id:"D4",clue:"Jungle river",answer:"AMAZON"}]},
  ], final:{answer:"JOURNEY",hint:"About movement"} },

  /* 11 */ { columns:[
    {id:"A",theme:"GEMS",fields:[{id:"A1",clue:"Hardest gem",answer:"DIAMOND"},{id:"A2",clue:"Red passion gem",answer:"RUBY"},{id:"A3",clue:"Blue royal gem",answer:"SAPPHIRE"},{id:"A4",clue:"Green forest gem",answer:"EMERALD"}]},
    {id:"B",theme:"COMPOSERS",fields:[{id:"B1",clue:"Fifth symphony",answer:"BEETHOVEN"},{id:"B2",clue:"Four seasons",answer:"VIVALDI"},{id:"B3",clue:"Magic flute",answer:"MOZART"},{id:"B4",clue:"G string air",answer:"BACH"}]},
    {id:"C",theme:"SCIENTISTS",fields:[{id:"C1",clue:"Gravity & apple",answer:"NEWTON"},{id:"C2",clue:"Relativity theory",answer:"EINSTEIN"},{id:"C3",clue:"Evolution theory",answer:"DARWIN"},{id:"C4",clue:"Radium & polonium",answer:"CURIE"}]},
    {id:"D",theme:"PHILOSOPHERS",fields:[{id:"D1",clue:"I think therefore",answer:"DESCARTES"},{id:"D2",clue:"Cave allegory",answer:"PLATO"},{id:"D3",clue:"Golden mean",answer:"ARISTOTLE"},{id:"D4",clue:"Thus spoke Z",answer:"NIETZSCHE"}]},
  ], final:{answer:"GENIUS",hint:"Intelligence at its finest"} },

  /* 12 */ { columns:[
    {id:"A",theme:"LANGUAGES",fields:[{id:"A1",clue:"Most speakers",answer:"MANDARIN"},{id:"A2",clue:"Shakespeare wrote",answer:"ENGLISH"},{id:"A3",clue:"Cervantes wrote",answer:"SPANISH"},{id:"A4",clue:"Language of love",answer:"FRENCH"}]},
    {id:"B",theme:"MOVIES",fields:[{id:"B1",clue:"Simba's story",answer:"LIONKING"},{id:"B2",clue:"Force & Jedi",answer:"STARWARS"},{id:"B3",clue:"One ring quest",answer:"LOTR"},{id:"B4",clue:"Blue alien planet",answer:"AVATAR"}]},
    {id:"C",theme:"SPORTS TEAMS",fields:[{id:"C1",clue:"NY pinstripes",answer:"YANKEES"},{id:"C2",clue:"Chicago red bulls",answer:"BULLS"},{id:"C3",clue:"Manchester red devils",answer:"UNITED"},{id:"C4",clue:"LA purple & gold",answer:"LAKERS"}]},
    {id:"D",theme:"DESSERTS",fields:[{id:"D1",clue:"Italian ice cream",answer:"GELATO"},{id:"D2",clue:"French choux pastry",answer:"ECLAIR"},{id:"D3",clue:"Chocolate fudge square",answer:"BROWNIE"},{id:"D4",clue:"Italian coffee cake",answer:"TIRAMISU"}]},
  ], final:{answer:"ENTERTAINMENT",hint:"Fun & pleasure"} },

  /* 13 */ { columns:[
    {id:"A",theme:"US STATES",fields:[{id:"A1",clue:"Golden Gate state",answer:"CALIFORNIA"},{id:"A2",clue:"Lone Star state",answer:"TEXAS"},{id:"A3",clue:"Empire state",answer:"NEWYORK"},{id:"A4",clue:"Sunshine state",answer:"FLORIDA"}]},
    {id:"B",theme:"DINOSAURS",fields:[{id:"B1",clue:"Tyrant lizard king",answer:"TREX"},{id:"B2",clue:"Three horned face",answer:"TRICERATOPS"},{id:"B3",clue:"Long neck plant eater",answer:"BRACHIOSAURUS"},{id:"B4",clue:"Clever pack hunter",answer:"RAPTOR"}]},
    {id:"C",theme:"WINTER SPORTS",fields:[{id:"C1",clue:"Two planks downhill",answer:"SKIING"},{id:"C2",clue:"One board downhill",answer:"SNOWBOARD"},{id:"C3",clue:"Ice spinning jumps",answer:"SKATING"},{id:"C4",clue:"Broom on ice",answer:"CURLING"}]},
    {id:"D",theme:"ARTISTS",fields:[{id:"D1",clue:"Mona Lisa painter",answer:"DAVINCI"},{id:"D2",clue:"Sunflowers painter",answer:"VANGOGH"},{id:"D3",clue:"Cubism founder",answer:"PICASSO"},{id:"D4",clue:"Sistine chapel",answer:"MICHELANGELO"}]},
  ], final:{answer:"AMERICA",hint:"The new world"} },

  /* 14 */ { columns:[
    {id:"A",theme:"VOLCANOES",fields:[{id:"A1",clue:"Sicily fire mountain",answer:"ETNA"},{id:"A2",clue:"Pompeii destroyer",answer:"VESUVIUS"},{id:"A3",clue:"Hawaii's fire",answer:"KILAUEA"},{id:"A4",clue:"Indonesia Krakatoa",answer:"KRAKATOA"}]},
    {id:"B",theme:"SPICES",fields:[{id:"B1",clue:"Yellow warm powder",answer:"TURMERIC"},{id:"B2",clue:"Vampire repellent",answer:"GARLIC"},{id:"B3",clue:"Red festive spice",answer:"PAPRIKA"},{id:"B4",clue:"Sweet roll spice",answer:"CINNAMON"}]},
    {id:"C",theme:"CLOUD TYPES",fields:[{id:"C1",clue:"Fluffy cotton balls",answer:"CUMULUS"},{id:"C2",clue:"Thin high streaks",answer:"CIRRUS"},{id:"C3",clue:"Gray rain layer",answer:"STRATUS"},{id:"C4",clue:"Storm tower dark",answer:"CUMULONIMBUS"}]},
    {id:"D",theme:"FAMOUS BATTLES",fields:[{id:"D1",clue:"Napoleon's defeat",answer:"WATERLOO"},{id:"D2",clue:"Sparta 300",answer:"THERMOPYLAE"},{id:"D3",clue:"D-Day beaches",answer:"NORMANDY"},{id:"D4",clue:"Naval victory",answer:"TRAFALGAR"}]},
  ], final:{answer:"EARTH",hint:"Our planet"} },

  /* 15 */ { columns:[
    {id:"A",theme:"ARCHITECTURE STYLES",fields:[{id:"A1",clue:"Pointed arches gothic",answer:"GOTHIC"},{id:"A2",clue:"Roman arches revival",answer:"ROMANESQUE"},{id:"A3",clue:"Steel & glass modern",answer:"MODERNIST"},{id:"A4",clue:"Ancient columns",answer:"CLASSICAL"}]},
    {id:"B",theme:"FAMOUS SCIENTISTS 2",fields:[{id:"B1",clue:"Electric lightning rod",answer:"FRANKLIN"},{id:"B2",clue:"Periodic table",answer:"MENDELEEV"},{id:"B3",clue:"Quantum physics",answer:"BOHR"},{id:"B4",clue:"DNA double helix",answer:"WATSON"}]},
    {id:"C",theme:"DANCES 2",fields:[{id:"C1",clue:"Brazilian Carnival",answer:"SAMBA"},{id:"C2",clue:"Irish quick step",answer:"JIVE"},{id:"C3",clue:"Slow romantic",answer:"WALTZ"},{id:"C4",clue:"Street hip hop",answer:"BREAKDANCE"}]},
    {id:"D",theme:"POKER HANDS",fields:[{id:"D1",clue:"Five same suit",answer:"ROYALFLUSH"},{id:"D2",clue:"Four same rank",answer:"FOUROFAKIND"},{id:"D3",clue:"Three + pair",answer:"FULLHOUSE"},{id:"D4",clue:"Two same rank",answer:"PAIR"}]},
  ], final:{answer:"GAME",hint:"Play and competition"} },

  /* 16 */ { columns:[
    {id:"A",theme:"ASTRONOMY",fields:[{id:"A1",clue:"Milky Way center",answer:"BLACKHOLE"},{id:"A2",clue:"Shooting star burn",answer:"METEOR"},{id:"A3",clue:"Giant gas ball",answer:"NEBULA"},{id:"A4",clue:"Exploding star death",answer:"SUPERNOVA"}]},
    {id:"B",theme:"FAMOUS INVENTORS",fields:[{id:"B1",clue:"Light bulb",answer:"EDISON"},{id:"B2",clue:"Telephone",answer:"BELL"},{id:"B3",clue:"Airplane brothers",answer:"WRIGHT"},{id:"B4",clue:"Internet",answer:"BERNERSLEE"}]},
    {id:"C",theme:"PSYCHOLOGICAL TERMS",fields:[{id:"C1",clue:"Id ego superego",answer:"FREUD"},{id:"C2",clue:"Collective unconscious",answer:"JUNG"},{id:"C3",clue:"Conditioning reflex",answer:"PAVLOV"},{id:"C4",clue:"Hierarchy of needs",answer:"MASLOW"}]},
    {id:"D",theme:"WORLD WONDERS",fields:[{id:"D1",clue:"Egypt pyramid",answer:"GIZA"},{id:"D2",clue:"Jordan carved city",answer:"PETRA"},{id:"D3",clue:"Machu Picchu Peru",answer:"MACCHU"},{id:"D4",clue:"Chinese long wall",answer:"GREATWALL"}]},
  ], final:{answer:"DISCOVERY",hint:"Finding what was hidden"} },

  /* 17 */ { columns:[
    {id:"A",theme:"CARD GAMES",fields:[{id:"A1",clue:"21 target",answer:"BLACKJACK"},{id:"A2",clue:"Texas Hold",answer:"POKER"},{id:"A3",clue:"Draw four wild",answer:"UNO"},{id:"A4",clue:"Pairs classic",answer:"BRIDGE"}]},
    {id:"B",theme:"SEAS",fields:[{id:"B1",clue:"Mediterranean Adriatic",answer:"ADRIATIC"},{id:"B2",clue:"Hot red sea",answer:"REDSEA"},{id:"B3",clue:"Saltiest lake-sea",answer:"DEADSEA"},{id:"B4",clue:"Between Europe & UK",answer:"NORTHSEA"}]},
    {id:"C",theme:"WEAPONS",fields:[{id:"C1",clue:"Long blade knight",answer:"SWORD"},{id:"C2",clue:"Japanese blade",answer:"KATANA"},{id:"C3",clue:"Stone tip arrow",answer:"ARROW"},{id:"C4",clue:"Viking axe",answer:"BATTLEAXE"}]},
    {id:"D",theme:"FAMOUS DUELS",fields:[{id:"D1",clue:"Hamilton Burr pistols",answer:"HAMILTON"},{id:"D2",clue:"Pushkin fatal",answer:"PUSHKIN"},{id:"D3",clue:"Wild West shootout",answer:"GUNFIGHT"},{id:"D4",clue:"Jedi lightsaber",answer:"OBI"}]},
  ], final:{answer:"CONFLICT",hint:"Clash of forces"} },

  /* 18 */ { columns:[
    {id:"A",theme:"FAMOUS LOGOS",fields:[{id:"A1",clue:"Bitten apple",answer:"APPLE"},{id:"A2",clue:"Swoosh shoe",answer:"NIKE"},{id:"A3",clue:"Golden arches M",answer:"MCDONALDS"},{id:"A4",clue:"Three pointed star",answer:"MERCEDES"}]},
    {id:"B",theme:"LANGUAGES FAMILIES",fields:[{id:"B1",clue:"Romance Latin roots",answer:"ROMANCE"},{id:"B2",clue:"Germanic English Dutch",answer:"GERMANIC"},{id:"B3",clue:"Slavic Russian Polish",answer:"SLAVIC"},{id:"B4",clue:"Semitic Arabic Hebrew",answer:"SEMITIC"}]},
    {id:"C",theme:"PSYCHOLOGY TERMS",fields:[{id:"C1",clue:"Unconscious defense",answer:"DENIAL"},{id:"C2",clue:"Mirror opposite",answer:"PROJECTION"},{id:"C3",clue:"Transfer feelings",answer:"TRANSFERENCE"},{id:"C4",clue:"Revert childhood",answer:"REGRESSION"}]},
    {id:"D",theme:"CURRENCIES 2",fields:[{id:"D1",clue:"Swiss franc",answer:"FRANC"},{id:"D2",clue:"Brazil real",answer:"REAL"},{id:"D3",clue:"India rupee",answer:"RUPEE"},{id:"D4",clue:"South Korea won",answer:"WON"}]},
  ], final:{answer:"IDENTITY",hint:"Who you truly are"} },

  /* 19 */ { columns:[
    {id:"A",theme:"MUSICAL KEYS",fields:[{id:"A1",clue:"Happy piano key",answer:"CMAJOR"},{id:"A2",clue:"Sad minor key",answer:"AMINOR"},{id:"A3",clue:"Jazz flatted notes",answer:"BLUES"},{id:"A4",clue:"Pentatonic scale",answer:"PENTATONIC"}]},
    {id:"B",theme:"FAMOUS ATHLETES",fields:[{id:"B1",clue:"GOAT basketball",answer:"JORDAN"},{id:"B2",clue:"100m record",answer:"BOLT"},{id:"B3",clue:"Tennis 23 slams",answer:"SERENA"},{id:"B4",clue:"Football el Clasico",answer:"MESSI"}]},
    {id:"C",theme:"FAMOUS ISLANDS",fields:[{id:"C1",clue:"Hawaii Pacific",answer:"HAWAII"},{id:"C2",clue:"UK island England",answer:"GREATBRITAIN"},{id:"C3",clue:"Australia island",answer:"AUSTRALIA"},{id:"C4",clue:"Iceland volcanic",answer:"ICELAND"}]},
    {id:"D",theme:"PHYSICS TERMS",fields:[{id:"D1",clue:"Attraction between masses",answer:"GRAVITY"},{id:"D2",clue:"E equals mc squared",answer:"ENERGY"},{id:"D3",clue:"Electron proton neutron",answer:"ATOM"},{id:"D4",clue:"Speed fastest",answer:"LIGHT"}]},
  ], final:{answer:"PHYSICS",hint:"Rules of the universe"} },

  /* 20 */ { columns:[
    {id:"A",theme:"ANCIENT CITIES",fields:[{id:"A1",clue:"Colosseum city",answer:"ROME"},{id:"A2",clue:"Parthenon city",answer:"ATHENS"},{id:"A3",clue:"Pharaoh pyramid city",answer:"CAIRO"},{id:"A4",clue:"Hanging gardens city",answer:"BABYLON"}]},
    {id:"B",theme:"MUSICAL INSTRUMENTS 2",fields:[{id:"B1",clue:"Plucked strings harp",answer:"HARP"},{id:"B2",clue:"Air reed woodwind",answer:"OBOE"},{id:"B3",clue:"Bowed strings",answer:"VIOLIN"},{id:"B4",clue:"Percussion metal",answer:"XYLOPHONE"}]},
    {id:"C",theme:"FAMOUS TRIALS",fields:[{id:"C1",clue:"OJ Simpson murder",answer:"OJSIMPSON"},{id:"C2",clue:"Nuremberg war crimes",answer:"NUREMBERG"},{id:"C3",clue:"Socrates poison",answer:"SOCRATES"},{id:"C4",clue:"Salem witch trials",answer:"SALEM"}]},
    {id:"D",theme:"PROGRAMMING CONCEPTS",fields:[{id:"D1",clue:"Stored data container",answer:"VARIABLE"},{id:"D2",clue:"Loop repeat code",answer:"LOOP"},{id:"D3",clue:"If else condition",answer:"CONDITION"},{id:"D4",clue:"Reusable code block",answer:"FUNCTION"}]},
  ], final:{answer:"HISTORY",hint:"What came before"} },

  /* 21 */ { columns:[
    {id:"A",theme:"AFRICAN COUNTRIES",fields:[{id:"A1",clue:"Pyramids country",answer:"EGYPT"},{id:"A2",clue:"Savanna lions country",answer:"KENYA"},{id:"A3",clue:"Table Mountain country",answer:"SOUTHAFRICA"},{id:"A4",clue:"Nile source country",answer:"ETHIOPIA"}]},
    {id:"B",theme:"FAMOUS GENERALS",fields:[{id:"B1",clue:"Waterloo conqueror",answer:"WELLINGTON"},{id:"B2",clue:"Conquer Persia",answer:"ALEXANDER"},{id:"B3",clue:"Gallic wars",answer:"CAESAR"},{id:"B4",clue:"Desert Fox Africa",answer:"ROMMEL"}]},
    {id:"C",theme:"WEATHER PHENOMENA",fields:[{id:"C1",clue:"Rainbow colors arch",answer:"RAINBOW"},{id:"C2",clue:"Ball lightning rare",answer:"BALLLIGHTNING"},{id:"C3",clue:"Northern green lights",answer:"AURORA"},{id:"C4",clue:"Sand storm desert",answer:"SANDSTORM"}]},
    {id:"D",theme:"ANCIENT WONDERS",fields:[{id:"D1",clue:"Rhodes giant statue",answer:"COLOSSUS"},{id:"D2",clue:"Lighthouse Alexandria",answer:"LIGHTHOUSE"},{id:"D3",clue:"Babylon hanging plants",answer:"HANGINGGARDENS"},{id:"D4",clue:"Olympia Zeus statue",answer:"ZEUS"}]},
  ], final:{answer:"ANCIENT",hint:"From long ago"} },

  /* 22 */ { columns:[
    {id:"A",theme:"ECONOMIC TERMS",fields:[{id:"A1",clue:"Rising prices",answer:"INFLATION"},{id:"A2",clue:"Market downturn",answer:"RECESSION"},{id:"A3",clue:"Country total output",answer:"GDP"},{id:"A4",clue:"Central bank rate",answer:"INTERESTRATE"}]},
    {id:"B",theme:"FAMOUS QUOTES 3",fields:[{id:"B1",clue:"Rome wasn't built",answer:"ROMAN"},{id:"B2",clue:"Actions speak louder",answer:"ENGLISH"},{id:"B3",clue:"Fortune favors bold",answer:"LATIN"},{id:"B4",clue:"Know thyself",answer:"GREEK"}]},
    {id:"C",theme:"FAMOUS BUILDINGS",fields:[{id:"C1",clue:"Pisa tower lean",answer:"PISATOWER"},{id:"C2",clue:"Sydney opera shell",answer:"OPERAHOUSE"},{id:"C3",clue:"Paris iron tower",answer:"EIFFELTOWER"},{id:"C4",clue:"India love monument",answer:"TAJMAHAL"}]},
    {id:"D",theme:"OLYMPIC SPORTS",fields:[{id:"D1",clue:"Rings gymnastics",answer:"GYMNASTICS"},{id:"D2",clue:"Pool swimming race",answer:"SWIMMING"},{id:"D3",clue:"Track sprint run",answer:"ATHLETICS"},{id:"D4",clue:"Mat wrestling",answer:"WRESTLING"}]},
  ], final:{answer:"ACHIEVEMENT",hint:"Reaching the top"} },

  /* 23 */ { columns:[
    {id:"A",theme:"MOUNTAIN RANGES",fields:[{id:"A1",clue:"Europe spine Alps",answer:"ALPS"},{id:"A2",clue:"South America Andes",answer:"ANDES"},{id:"A3",clue:"Russia Ural",answer:"URAL"},{id:"A4",clue:"Asia Himalaya",answer:"HIMALAYAS"}]},
    {id:"B",theme:"MUSIC LEGENDS",fields:[{id:"B1",clue:"King of rock roll",answer:"PRESLEY"},{id:"B2",clue:"Thriller moonwalk",answer:"JACKSON"},{id:"B3",clue:"Liverpool Fab Four",answer:"BEATLES"},{id:"B4",clue:"Ziggy Stardust",answer:"BOWIE"}]},
    {id:"C",theme:"FAMOUS WOMEN",fields:[{id:"C1",clue:"First female pilot",answer:"EARHART"},{id:"C2",clue:"Mother Teresa Calcutta",answer:"MOTHERTERESA"},{id:"C3",clue:"Radium pioneer",answer:"CURIE"},{id:"C4",clue:"Nursing lamp lady",answer:"NIGHTINGALE"}]},
    {id:"D",theme:"BEER TYPES",fields:[{id:"D1",clue:"Dark roasted stout",answer:"STOUT"},{id:"D2",clue:"Light lager cold",answer:"LAGER"},{id:"D3",clue:"Wheat white beer",answer:"WHEAT"},{id:"D4",clue:"Bitter hop ale",answer:"IPA"}]},
  ], final:{answer:"LEGEND",hint:"Icon of their time"} },

  /* 24 */ { columns:[
    {id:"A",theme:"FAMOUS SCIENTISTS 3",fields:[{id:"A1",clue:"Electricity current",answer:"FARADAY"},{id:"A2",clue:"Atom structure Bohr",answer:"BOHR"},{id:"A3",clue:"Germ theory",answer:"PASTEUR"},{id:"A4",clue:"Telescope universe",answer:"GALILEO"}]},
    {id:"B",theme:"FICTIONAL WORLDS",fields:[{id:"B1",clue:"Middle Earth Tolkien",answer:"MIDDLEEARTH"},{id:"B2",clue:"Hogwarts magic school",answer:"HOGWARTS"},{id:"B3",clue:"Westeros dragons",answer:"WESTEROS"},{id:"B4",clue:"Pandora blue avatars",answer:"PANDORA"}]},
    {id:"C",theme:"FAMOUS POEMS",fields:[{id:"C1",clue:"The Raven Poe",answer:"POE"},{id:"C2",clue:"If Rudyard Kipling",answer:"KIPLING"},{id:"C3",clue:"Waste Land TS Eliot",answer:"ELIOT"},{id:"C4",clue:"Leaves of Grass Whitman",answer:"WHITMAN"}]},
    {id:"D",theme:"HISTORICAL EVENTS",fields:[{id:"D1",clue:"Moon landing year",answer:"1969"},{id:"D2",clue:"Wall Berlin fell",answer:"1989"},{id:"D3",clue:"World War One began",answer:"1914"},{id:"D4",clue:"Internet born year",answer:"1991"}]},
  ], final:{answer:"HISTORY",hint:"Marking the past"} },

  /* 25 */ { columns:[
    {id:"A",theme:"MARTIAL ARTS 2",fields:[{id:"A1",clue:"Muay Thai kicks",answer:"MUAYTHAI"},{id:"A2",clue:"Capoeira Brazil dance",answer:"CAPOEIRA"},{id:"A3",clue:"Krav Maga Israel",answer:"KRAVMAGA"},{id:"A4",clue:"Aikido joint locks",answer:"AIKIDO"}]},
    {id:"B",theme:"FAMOUS LAKES",fields:[{id:"B1",clue:"Russia deepest",answer:"BAIKAL"},{id:"B2",clue:"Africa Victoria",answer:"VICTORIA"},{id:"B3",clue:"USA Michigan",answer:"MICHIGAN"},{id:"B4",clue:"Peru Titicaca",answer:"TITICACA"}]},
    {id:"C",theme:"ARCHITECTURAL WONDERS",fields:[{id:"C1",clue:"Angkor Wat Cambodia",answer:"ANGKORWAT"},{id:"C2",clue:"Colosseum Rome",answer:"COLOSSEUM"},{id:"C3",clue:"Alhambra Granada",answer:"ALHAMBRA"},{id:"C4",clue:"Versailles France",answer:"VERSAILLES"}]},
    {id:"D",theme:"FAMOUS EXPLORERS",fields:[{id:"D1",clue:"New world Columbus",answer:"COLUMBUS"},{id:"D2",clue:"Around world Magellan",answer:"MAGELLAN"},{id:"D3",clue:"Africa Stanley Livingstone",answer:"LIVINGSTONE"},{id:"D4",clue:"North Pole Amundsen",answer:"AMUNDSEN"}]},
  ], final:{answer:"EXPLORATION",hint:"Going beyond the known"} },

  /* 26 */ { columns:[
    {id:"A",theme:"PROGRAMMING LANGUAGES 2",fields:[{id:"A1",clue:"Apple swift mobile",answer:"SWIFT"},{id:"A2",clue:"Web style sheet",answer:"CSS"},{id:"A3",clue:"Data science R",answer:"R"},{id:"A4",clue:"Systems Rust safe",answer:"RUST"}]},
    {id:"B",theme:"PSYCHOLOGY DISORDERS",fields:[{id:"B1",clue:"Split personality",answer:"DID"},{id:"B2",clue:"Extreme mood swings",answer:"BIPOLAR"},{id:"B3",clue:"Obsessive rituals",answer:"OCD"},{id:"B4",clue:"Trauma flashbacks",answer:"PTSD"}]},
    {id:"C",theme:"FAMOUS QUOTES 4",fields:[{id:"C1",clue:"Be the change Gandhi",answer:"GANDHI"},{id:"C2",clue:"I am not failed Edison",answer:"EDISON"},{id:"C3",clue:"Genius is patience Buffon",answer:"BUFFON"},{id:"C4",clue:"Think different Apple",answer:"APPLE"}]},
    {id:"D",theme:"WINE TYPES",fields:[{id:"D1",clue:"Red Bordeaux type",answer:"CABERNET"},{id:"D2",clue:"White chardonnay",answer:"CHARDONNAY"},{id:"D3",clue:"Sparkling champagne",answer:"PROSECCO"},{id:"D4",clue:"Sweet dessert wine",answer:"RIESLING"}]},
  ], final:{answer:"MIND",hint:"The power of thought"} },

  /* 27 */ { columns:[
    {id:"A",theme:"CHESS PIECES",fields:[{id:"A1",clue:"Most powerful queen",answer:"QUEEN"},{id:"A2",clue:"Castle rook",answer:"ROOK"},{id:"A3",clue:"Horse L shape",answer:"KNIGHT"},{id:"A4",clue:"Diagonal bishop",answer:"BISHOP"}]},
    {id:"B",theme:"FAMOUS ARTISTS 2",fields:[{id:"B1",clue:"Melting clocks",answer:"DALI"},{id:"B2",clue:"Water lily pond",answer:"MONET"},{id:"B3",clue:"Scream painting",answer:"MUNCH"},{id:"B4",clue:"Girl with pearl",answer:"VERMEER"}]},
    {id:"C",theme:"MILITARY RANKS",fields:[{id:"C1",clue:"Five star general",answer:"GENERAL"},{id:"C2",clue:"Star admiral navy",answer:"ADMIRAL"},{id:"C3",clue:"Senior officer colonel",answer:"COLONEL"},{id:"C4",clue:"Junior officer lieutenant",answer:"LIEUTENANT"}]},
    {id:"D",theme:"FAMOUS MUSICALS",fields:[{id:"D1",clue:"Cats Webber",answer:"CATS"},{id:"D2",clue:"Chicago jazz crime",answer:"CHICAGO"},{id:"D3",clue:"Grease pink ladies",answer:"GREASE"},{id:"D4",clue:"Hamilton rap history",answer:"HAMILTON"}]},
  ], final:{answer:"PERFORMANCE",hint:"Show must go on"} },

  /* 28 */ { columns:[
    {id:"A",theme:"GEMSTONES 2",fields:[{id:"A1",clue:"Deep blue lapis",answer:"LAPIS"},{id:"A2",clue:"Orange fire opal",answer:"OPAL"},{id:"A3",clue:"Yellow citrine warm",answer:"CITRINE"},{id:"A4",clue:"Red garnet deep",answer:"GARNET"}]},
    {id:"B",theme:"FAMOUS BUILDINGS 2",fields:[{id:"B1",clue:"Parliament Big Ben",answer:"BIGBEN"},{id:"B2",clue:"White House USA",answer:"WHITEHOUSE"},{id:"B3",clue:"Kremlin Russia",answer:"KREMLIN"},{id:"B4",clue:"Forbidden City China",answer:"FORBIDDENCITY"}]},
    {id:"C",theme:"COCKTAILS 2",fields:[{id:"C1",clue:"Whiskey sour citrus",answer:"WHISKEYSOUR"},{id:"C2",clue:"Negroni bitters",answer:"NEGRONI"},{id:"C3",clue:"Old fashioned bourbon",answer:"OLDFASHIONED"},{id:"C4",clue:"Aperol spritz Italy",answer:"APEROLSPRITZ"}]},
    {id:"D",theme:"FAMOUS PAINTINGS",fields:[{id:"D1",clue:"Mona Lisa smile",answer:"MONALISA"},{id:"D2",clue:"Starry night sky",answer:"STARRYNIGHT"},{id:"D3",clue:"Birth of Venus",answer:"BIRTHOFVENUS"},{id:"D4",clue:"Last Supper table",answer:"LASTSUPPER"}]},
  ], final:{answer:"MASTERPIECE",hint:"Work of genius"} },

  /* 29 */ { columns:[
    {id:"A",theme:"FAMOUS SPEECHES 2",fields:[{id:"A1",clue:"Gettysburg Lincoln",answer:"LINCOLN"},{id:"A2",clue:"Iron Curtain Churchill",answer:"CHURCHILL"},{id:"A3",clue:"We choose Moon JFK",answer:"KENNEDY"},{id:"A4",clue:"Blood sweat tears",answer:"CHURCHILL2"}]},
    {id:"B",theme:"SCIENTIFIC LAWS",fields:[{id:"B1",clue:"Objects in motion Newton",answer:"NEWTON1ST"},{id:"B2",clue:"Equal opposite reaction",answer:"NEWTON3RD"},{id:"B3",clue:"Energy conservation",answer:"THERMODYNAMICS"},{id:"B4",clue:"Attraction mass gravity",answer:"GRAVITATION"}]},
    {id:"C",theme:"FAMOUS PLAYS",fields:[{id:"C1",clue:"To be or not to be",answer:"HAMLET"},{id:"C2",clue:"Star crossed lovers",answer:"ROMEO"},{id:"C3",clue:"Scottish king murder",answer:"MACBETH"},{id:"C4",clue:"Moor of Venice jealous",answer:"OTHELLO"}]},
    {id:"D",theme:"CARD HANDS",fields:[{id:"D1",clue:"Straight flush royal",answer:"ROYALFLUSH"},{id:"D2",clue:"Same four cards",answer:"FOUROFAKIND"},{id:"D3",clue:"Three plus two pair",answer:"FULLHOUSE"},{id:"D4",clue:"Two matching cards",answer:"PAIR"}]},
  ], final:{answer:"STRATEGY",hint:"Thinking ahead to win"} },
];

/* ═══════════════════════════════════════════
   TIMESTAMP-BASED BOARD ROTATION
   Board changes every 30 seconds automatically.
   Each time you create a room = different board.
═══════════════════════════════════════════ */
function getCurrentBoard() {
  const idx = Math.floor(Date.now() / 30000) % B.length;
  return JSON.parse(JSON.stringify(B[idx]));
}

function nrm(s){return s.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");}
function match(a,b){return nrm(a)===nrm(b);}
function gid(){return Math.random().toString(36).slice(2,8).toUpperCase();}
async function phantom(){try{if(!window.solana?.isPhantom){window.open("https://phantom.app/","_blank");return null;}return(await window.solana.connect()).publicKey.toString();}catch{return null;}}
async function signW(n){try{if(!window.solana?.isPhantom)return{ok:false,err:"No Phantom"};await window.solana.signMessage(new TextEncoder().encode("Wager "+n),"utf8");return{ok:true,id:"SIG"+Date.now()};}catch(e){return{ok:false,err:e.message};}}

/* ══ FIELD COMPONENT ══ */
function Fld({field,st,solvedBy,canOpen,onOpen,h}){
  const bg=st==="solved"?(solvedBy==="p1"?PC1:PC2):st==="clue"?"#c47d0e":canOpen?"#2d5a8a":"#1e3a5a";
  const s={width:"100%",height:h||52,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:2,padding:"0 8px",boxSizing:"border-box",background:bg,border:st==="clue"?"2px solid #f59e0b":st==="solved"?"none":canOpen?"1px solid #3a6a9a":"1px solid #1a2a3a",boxShadow:canOpen&&st==="hidden"?"0 3px 8px rgba(0,0,0,.5)":st==="solved"?"0 3px 0 rgba(0,0,0,.4)":"none",cursor:canOpen&&st==="hidden"?"pointer":"default",transition:"all .15s",userSelect:"none"};
  if(st==="solved")return<div style={s}><div style={{fontSize:"clamp(9px,1.1vw,15px)",fontWeight:900,color:"#fff",textAlign:"center",letterSpacing:.5}}>{field.answer}</div><div style={{fontSize:"clamp(6px,.8vw,10px)",color:"rgba(255,255,255,.7)",textAlign:"center"}}>{field.clue}</div></div>;
  /* NO "CLUE" label — just the text directly */
  if(st==="clue")return<div style={s}><div style={{fontSize:"clamp(9px,1vw,14px)",color:"#fff",fontWeight:700,textAlign:"center",lineHeight:1.2}}>{field.clue}</div></div>;
  return<div onClick={canOpen?()=>onOpen(field.id):undefined} style={s} onMouseEnter={e=>{if(canOpen)e.currentTarget.style.background="#3a6e9e";}} onMouseLeave={e=>{if(canOpen)e.currentTarget.style.background="#2d5a8a";}}><span style={{fontSize:"clamp(11px,1.2vw,18px)",fontWeight:900,color:canOpen?"#7ab8e0":"#1a2a3a",letterSpacing:1}}>{field.id}</span></div>;
}

/* ══ THEME INPUT ══ */
function TIn({cid,solved,solvedBy,theme,disabled,onGuess,h}){
  const[ed,setEd]=useState(false);const[v,setV]=useState("");const[err,setErr]=useState(false);
  const sc=solvedBy==="p1"?PC1:PC2;const ph=h||48;
  const sub=()=>{if(!v.trim())return;if(!onGuess(v)){setErr(true);setTimeout(()=>setErr(false),600);}else{setV("");setEd(false);}};
  if(solved)return<div style={{width:"100%",height:ph,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:sc,boxShadow:"0 3px 0 rgba(0,0,0,.4)"}}><span style={{fontSize:"clamp(8px,.9vw,12px)",fontWeight:900,color:"#fff",textAlign:"center",padding:"0 4px"}}>✓ {theme}</span></div>;
  if(!disabled&&ed)return<div style={{width:"100%",height:ph,borderRadius:8,display:"flex",alignItems:"center",gap:4,padding:"0 6px",background:"#fff",animation:err?"shake .4s":"none",boxSizing:"border-box"}}><input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sub();if(e.key==="Escape")setEd(false);}} placeholder={"Col "+cid} autoFocus style={{flex:1,background:"transparent",border:"none",fontSize:11,fontWeight:700,outline:"none",fontFamily:"inherit",color:"#1a2a4a",minWidth:0}}/><button onClick={sub} style={{background:"#2d5a8a",border:"none",borderRadius:5,padding:"4px 8px",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:10,flexShrink:0}}>OK</button><button onClick={()=>setEd(false)} style={{background:"#ddd",border:"none",borderRadius:5,padding:"4px 5px",color:"#666",cursor:"pointer",fontSize:10}}>✕</button></div>;
  return<div onClick={disabled?undefined:()=>setEd(true)} style={{width:"100%",height:ph,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:disabled?"#111c2a":"rgba(45,90,138,.35)",border:"2px dashed "+(disabled?"#1a2a3a":"#5b9bd5"),cursor:disabled?"default":"pointer",transition:"all .15s"}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background="rgba(45,90,138,.55)";}} onMouseLeave={e=>{if(!disabled)e.currentTarget.style.background="rgba(45,90,138,.35)";}}><span style={{fontSize:22,color:disabled?"#1a2a3a":"#7ab8e0",fontWeight:900}}>?</span></div>;
}

/* ══ FINAL INPUT ══ */
function FIn({solved,solvedBy,answer,disabled,onGuess,h}){
  const[ed,setEd]=useState(false);const[v,setV]=useState("");const[err,setErr]=useState(false);
  const sc=solvedBy==="p1"?PC1:PC2;const ph=h||56;
  const sub=()=>{if(!v.trim())return;if(!onGuess(v)){setErr(true);setTimeout(()=>setErr(false),600);}else{setV("");setEd(false);}};
  if(solved)return<div style={{width:"100%",height:ph,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:sc,boxShadow:"0 4px 0 rgba(0,0,0,.4)"}}><span style={{fontSize:16,fontWeight:900,color:"#fff",letterSpacing:1}}>✓ {answer}</span></div>;
  if(!disabled&&ed)return<div style={{width:"100%",height:ph,borderRadius:10,display:"flex",alignItems:"center",gap:8,padding:"0 10px",background:"#fff",animation:err?"shake .4s":"none",boxSizing:"border-box"}}><input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sub();if(e.key==="Escape")setEd(false);}} placeholder="Final answer..." autoFocus style={{flex:1,background:"transparent",border:"none",fontSize:14,fontWeight:700,outline:"none",fontFamily:"inherit",color:"#1a2a4a",textAlign:"center"}}/><button onClick={sub} style={{background:"#f59e0b",border:"none",borderRadius:8,padding:"7px 14px",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:13,flexShrink:0}}>OK</button></div>;
  return<div onClick={disabled?undefined:()=>setEd(true)} style={{width:"100%",height:ph,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:disabled?"#111c2a":"rgba(245,158,11,.15)",border:"3px dashed "+(disabled?"#1a2a3a":"#f59e0b"),cursor:disabled?"default":"pointer",transition:"all .15s"}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background="rgba(245,158,11,.3)";}} onMouseLeave={e=>{if(!disabled)e.currentTarget.style.background="rgba(245,158,11,.15)";}}><span style={{fontSize:26,color:disabled?"#1a2a3a":"#f59e0b",fontWeight:900}}>?</span></div>;
}

function Spin({msg}){return<div style={ROOT}><style>{CSS}</style><div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}><div style={{width:52,height:52,border:"4px solid rgba(255,255,255,.1)",borderTop:"4px solid #f59e0b",borderRadius:"50%",animation:"spin 1s linear infinite"}}/><div style={{color:"rgba(255,255,255,.6)",fontSize:13,letterSpacing:2}}>{msg}</div></div></div>;}

export default function App(){
  const[myUid]=useState(getUid);
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
  const[isDesktop,setIsDesktop]=useState(window.innerWidth>=768);

  const tR=useRef(),iR=useRef(),lastAct=useRef(Date.now()),rRef=useRef(null);
  const L=m=>setLog(p=>[m,...p].slice(0,4));
  const touch=()=>{lastAct.current=Date.now();setIt(ISEC);};

  useEffect(()=>{const c=()=>setIsDesktop(window.innerWidth>=768);window.addEventListener("resize",c);return()=>window.removeEventListener("resize",c);},[]);
  useEffect(()=>{try{if(window.solana?.isPhantom&&window.solana.publicKey)setWallet(window.solana.publicKey.toString());}catch{};},[]);

  useEffect(()=>{if(!roomId||!db)return;rRef.current=ref(db,"games/"+roomId);const u=onValue(rRef.current,s=>{const d=s.val();if(!d)return;setGs(d);if(d.status==="finished")setScr("result");if(d.status==="active"&&d.p1&&d.p2&&!started){setStarted(true);lastAct.current=Date.now();}});return()=>u();},[roomId,started]);

  useEffect(()=>{if(scr!=="game"||!started||!gs)return;if(gs.status==="finished"||gs.finalPhase||gs.currentTurn!==myRole)return;clearInterval(tR.current);setTt(TSEC);tR.current=setInterval(()=>setTt(t=>{if(t<=1){clearInterval(tR.current);autoRev();return TSEC;}return t-1;}),1000);return()=>clearInterval(tR.current);},[gs?.currentTurn,gs?.finalPhase,scr,started]);

  useEffect(()=>{if(!gs?.finalPhase||gs?.status==="finished"||!started)return;clearInterval(iR.current);iR.current=setInterval(()=>{const rem=ISEC-Math.floor((Date.now()-lastAct.current)/1000);setIt(Math.max(0,rem));if(rem<=0){clearInterval(iR.current);const p1=gs.scores?.p1||0,p2=gs.scores?.p2||0;doEnd(p1>=p2?"p1":"p2","Time up! Winner by points");}},1000);return()=>clearInterval(iR.current);},[gs?.finalPhase,gs?.status,started]);

  useEffect(()=>{if(!gs||gs.finalPhase||gs.status==="finished"||!gs.board)return;if(Object.keys(gs.revealed||{}).length>=gs.board.columns.reduce((s,c)=>s+c.fields.length,0)){update(rRef.current,{finalPhase:true});L("🎯 All fields open!");}},[gs?.revealed]);

  useEffect(()=>{if(scr!=="waiting"||!roomId||!db)return;const u=onValue(ref(db,"games/"+roomId),s=>{const d=s.val();if(d?.status==="active"&&d.p1&&d.p2){setGs(d);setStarted(true);lastAct.current=Date.now();setScr("game");L("Opponent joined! Your turn!");}});return()=>u();},[scr,roomId]);

  async function doWallet(){setWload(true);const a=await phantom();if(a)setWallet(a);setWload(false);}

  async function doCreate(){
    if(!nm.trim()||!myUid)return;if(!wallet){alert("Connect Phantom first!");return;}
    setScr("loading");setLdmsg("Loading current board...");
    const board=getCurrentBoard(); // Timestamp-based, changes every 30s
    await new Promise(r=>setTimeout(r,300));
    setLdmsg("Confirming wager...");
    const tx=await signW(wager);if(!tx.ok){alert("Wager failed: "+tx.err);setScr("lobby");return;}
    const id=gid();
    try{await set(ref(db,"games/"+id),{p1:myUid,p1name:nm,p1wallet:wallet,p2:null,p2name:null,p2wallet:null,status:"waiting",wager,board,scores:{p1:0,p2:0},revealed:{},colSolved:{A:null,B:null,C:null,D:null},finalSolved:null,finalPhase:false,currentTurn:"p1",lastActivity:Date.now(),winner:null,p1tx:tx.id});setRoomId(id);setMyRole("p1");setStarted(false);setScr("waiting");}
    catch(e){alert("Error: "+e.message);setScr("lobby");}
  }

  async function doJoin(){
    const id=jin.trim().toUpperCase();if(!nm.trim()||!myUid||id.length<6)return;if(!wallet){alert("Connect Phantom first!");return;}
    setJerr("");setScr("loading");setLdmsg("Looking for room "+id+"...");
    try{const sn=await get(ref(db,"games/"+id));if(!sn.exists()){setJerr("Room "+id+" not found!");setScr("lobby");return;}const d=sn.val();if(d.status!=="waiting"){setJerr("Room already started!");setScr("lobby");return;}if(d.p1===myUid){setJerr("Can't join your own room!");setScr("lobby");return;}const tx=await signW(d.wager);if(!tx.ok){alert("Wager failed: "+tx.err);setScr("lobby");return;}await update(ref(db,"games/"+id),{p2:myUid,p2name:nm,p2wallet:wallet,status:"active",currentTurn:"p1",lastActivity:Date.now(),p2tx:tx.id});setWager(d.wager);setRoomId(id);setMyRole("p2");setStarted(true);lastAct.current=Date.now();setScr("game");L("Joined! P2. P1 goes first.");}
    catch(e){setJerr("Error: "+e.message);setScr("lobby");}
  }

  async function doOpen(fid){if(!isMy||didOpen||gs?.finalPhase||!started)return;touch();setDidOpen(true);await update(rRef.current,{["revealed/"+fid]:"clue",lastActivity:Date.now()});L("Field "+fid+" opened!");}
  async function autoRev(){if(!gs?.board||!rRef.current)return;const all=gs.board.columns.flatMap(c=>c.fields),hidden=all.filter(f=>!gs.revealed?.[f.id]);if(!hidden.length){await update(rRef.current,{finalPhase:true});return;}const pk=hidden[Math.floor(Math.random()*hidden.length)];await update(rRef.current,{["revealed/"+pk.id]:"clue",lastActivity:Date.now()});L("⏱ "+pk.id+" auto-revealed.");await doPass();}
  async function doGuessCol(cid,val){touch();const col=gs.board.columns.find(c=>c.id===cid);if(!col||gs.colSolved?.[cid])return false;if(match(val,col.theme)){const u={};col.fields.forEach(f=>{u["revealed/"+f.id]="solved_"+myRole;});u["colSolved/"+cid]=myRole;u["scores/"+myRole]=(gs.scores?.[myRole]||0)+20;u.lastActivity=Date.now();await update(rRef.current,u);L("✅ "+cid+': "'+col.theme+'" +20pts!');return true;}L("❌ Wrong. Opponent's turn!");await doPass();return false;}
  async function doGuessFinal(val){touch();if(match(val,gs.board.final.answer)){await update(rRef.current,{finalSolved:myRole,["scores/"+myRole]:(gs.scores?.[myRole]||0)+30,lastActivity:Date.now()});doEnd(myRole,"Final correct! +30pts 🎉");return true;}L("❌ Wrong final.");await doPass();return false;}
  async function doPass(){clearInterval(tR.current);setDidOpen(false);await update(rRef.current,{currentTurn:myRole==="p1"?"p2":"p1",lastActivity:Date.now()});}
  async function doEnd(w,reason){clearInterval(tR.current);clearInterval(iR.current);if(!rRef.current)return;await update(rRef.current,{status:"finished",winner:w,winReason:reason,finishedAt:Date.now()});if(!gs)return;const sc=gs.scores||{p1:0,p2:0};for(const r of["p1","p2"]){const u=gs[r];if(!u)continue;const lb=ref(db,"leaderboard/"+u);const sn=await get(lb);const cv=sn.val()||{wins:0,losses:0,points:0};await set(lb,{name:r==="p1"?gs.p1name:gs.p2name,wins:(cv.wins||0)+(w===r?1:0),losses:(cv.losses||0)+(w===r?0:1),points:(cv.points||0)+(sc[r]||0)});}}
  function doReset(){setScr("lobby");setRoomId(null);setMyRole(null);setGs(null);setDidOpen(false);setLog([]);setJin("");setJerr("");setStarted(false);}

  const board=gs?.board||null,isMy=gs?.currentTurn===myRole;
  const scores=gs?.scores||{p1:0,p2:0},revealed=gs?.revealed||{},colSolved=gs?.colSolved||{};
  const finalSolved=gs?.finalSolved||null,finalPhase=gs?.finalPhase||false,winner=gs?.winner||null,winReason=gs?.winReason||"";
  const myNm=myRole==="p1"?gs?.p1name||"P1":gs?.p2name||"P2",opNm=myRole==="p1"?gs?.p2name||"P2":gs?.p1name||"P1";
  const myScore=myRole==="p1"?scores.p1:scores.p2,opScore=myRole==="p1"?scores.p2:scores.p1;
  const canOpen=isMy&&!didOpen&&!finalPhase&&!winner&&gs?.status==="active"&&started;
  const canGuess=isMy&&(didOpen||finalPhase)&&!winner&&gs?.status==="active"&&started;
  const fst=fid=>{const r=revealed[fid];if(!r)return{st:"hidden",sb:null};if(r==="clue")return{st:"clue",sb:null};if(r==="solved_p1")return{st:"solved",sb:"p1"};if(r==="solved_p2")return{st:"solved",sb:"p2"};return{st:"clue",sb:null};};

  const LobbyB=({txt,onClick,dis})=><button onClick={onClick} disabled={dis} style={{width:"100%",padding:"14px 0",background:!dis?"linear-gradient(90deg,#f59e0b,#d97706)":"rgba(255,255,255,.08)",color:!dis?"#fff":"rgba(255,255,255,.3)",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:14,fontWeight:900,cursor:!dis?"pointer":"default",letterSpacing:2,boxShadow:!dis?"0 4px 0 rgba(0,0,0,.3)":"none"}}>{txt}</button>;

  if(scr==="lobby")return(
    <div style={ROOT}><style>{CSS}</style>
      <div style={{background:"#0a1628",padding:"12px 16px",borderBottom:"2px solid #f59e0b",textAlign:"center",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:2}}>
          <svg width="26" height="26" viewBox="0 0 64 64" fill="none"><polygon points="32,2 54,16 54,40 32,54 10,40 10,16" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity=".6"/><circle cx="32" cy="26" r="16" fill="#fff" opacity=".93"/><rect x="24" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93"/><rect x="33" y="38" width="7" height="9" rx="2" fill="#fff" opacity=".93"/><ellipse cx="26" cy="24" rx="4.5" ry="5.5" fill="#111"/><ellipse cx="38" cy="24" rx="4.5" ry="5.5" fill="#111"/><ellipse cx="26" cy="23" rx="1.5" ry="2" fill="#8b5cf6" opacity=".9"/><ellipse cx="38" cy="23" rx="1.5" ry="2" fill="#22c55e" opacity=".9"/><path d="M28 34 L32 31 L36 34" stroke="#333" strokeWidth="1.5" fill="none"/></svg>
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
        <div style={{marginBottom:10}}><div style={{fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:2,marginBottom:6}}>WAGER — FREEDOM TOKENS</div><div style={{display:"flex",gap:8}}>{WAGERS.map(w=><button key={w} onClick={()=>setWager(w)} style={{flex:1,padding:"10px 0",borderRadius:10,fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",background:wager===w?"#f59e0b":"rgba(255,255,255,.08)",color:wager===w?"#fff":"rgba(255,255,255,.7)",border:"2px solid "+(wager===w?"#f59e0b":"rgba(255,255,255,.15)")}}>{w}</button>)}</div></div>
        <div style={{display:"flex",borderRadius:12,overflow:"hidden",border:"1px solid rgba(255,255,255,.15)",marginBottom:10}}>{[["create","🎮 CREATE"],["join","🚪 JOIN"]].map(([m,l])=><button key={m} onClick={()=>{setMode(m);setJerr("");}} style={{flex:1,padding:"11px 0",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",background:mode===m?"#f59e0b":"transparent",color:mode===m?"#fff":"rgba(255,255,255,.5)",border:"none",letterSpacing:1}}>{l}</button>)}</div>
        {mode==="create"&&<LobbyB txt="🎮 CREATE ROOM" onClick={doCreate} dis={!nm.trim()||!wallet}/>}
        {mode==="join"&&<div><div style={{fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:2,marginBottom:6}}>ENTER ROOM ID</div><input value={jin} onChange={e=>{setJin(e.target.value.toUpperCase());setJerr("");}} maxLength={6} placeholder="ABC123" style={{width:"100%",background:"rgba(255,255,255,.08)",border:"2px solid "+(jin.length===6?"#22c55e":"rgba(255,255,255,.15)"),borderRadius:12,padding:"12px",color:"#22c55e",fontSize:24,outline:"none",fontFamily:"'Black Ops One',cursive",boxSizing:"border-box",textAlign:"center",letterSpacing:10,marginBottom:6}}/>{jerr&&<div style={{padding:"7px 10px",background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.4)",borderRadius:8,fontSize:11,color:"#ef4444",marginBottom:6}}>⚠ {jerr}</div>}<button onClick={doJoin} disabled={!nm.trim()||!wallet||jin.length<6} style={{width:"100%",padding:"14px 0",background:jin.length===6&&nm.trim()&&wallet?"linear-gradient(90deg,#22c55e,#16a34a)":"rgba(255,255,255,.08)",color:jin.length===6&&nm.trim()&&wallet?"#fff":"rgba(255,255,255,.3)",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:14,fontWeight:900,cursor:jin.length===6&&nm.trim()&&wallet?"pointer":"default",letterSpacing:2}}>🚪 JOIN ROOM</button></div>}
        <div style={{marginTop:12,background:"rgba(255,255,255,.04)",borderRadius:12,padding:"10px",border:"1px solid rgba(255,255,255,.08)"}}><div style={{color:"#f59e0b",fontSize:10,fontWeight:700,letterSpacing:2,marginBottom:6}}>RULES</div>{[["30s/turn","Open 1 field. Timer starts when both join."],["Guessing","Correct = keep turn. Wrong = opponent's turn."],["Time up","30s = random field auto-reveals."],["Final","All fields open: 60s idle = winner by POINTS."],["Points","Theme +20 · Final +30"]].map(([t,d],i)=><div key={i} style={{display:"flex",gap:8,marginBottom:4}}><span style={{fontSize:9,color:"#f59e0b",fontWeight:700,whiteSpace:"nowrap",minWidth:55}}>{t}</span><span style={{fontSize:10,color:"rgba(255,255,255,.45)",lineHeight:1.4}}>{d}</span></div>)}</div>
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
        <div style={{textAlign:"center"}}><div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:8}}>SHARE ROOM ID:</div><div style={{fontSize:42,fontFamily:"'Black Ops One',cursive",color:"#22c55e",letterSpacing:10,padding:"14px 28px",background:"rgba(34,197,94,.1)",border:"2px solid rgba(34,197,94,.4)",borderRadius:12}}>{roomId}</div></div>
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
          <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:18}}>{["p1","p2"].map(r=><div key={r} style={{flex:1,padding:"12px",borderRadius:12,background:r===winner?"rgba(34,197,94,.1)":"rgba(255,255,255,.05)",border:"2px solid "+(r===winner?"#22c55e":"rgba(255,255,255,.1)")}}><div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>{r===myRole?myNm:opNm}</div><div style={{fontSize:30,fontWeight:900,color:r===winner?"#22c55e":"#fff"}}>{r==="p1"?scores.p1:scores.p2}</div><div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>pts</div></div>)}</div>
          {winner===myRole&&<div style={{color:"#f59e0b",fontSize:12,marginBottom:14}}>🎉 Winnings: <b>{wager*2}</b> FREEDOM tokens</div>}
          <button onClick={doReset} style={{width:"100%",padding:"13px",background:"linear-gradient(90deg,#8b5cf6,#7c3aed)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:13,fontWeight:900,cursor:"pointer",letterSpacing:2,boxShadow:"0 4px 0 rgba(0,0,0,.3)"}}>NEW GAME</button>
        </div>
      </div>
    </div>
  );
  if(!board)return<Spin msg="Loading..."/>;
  const[colA,colB,colC,colD]=board.columns;

  const SB=(
    <div style={{background:"#0a1628",padding:"7px 14px",borderBottom:"2px solid #f59e0b",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}><div style={{width:34,height:34,borderRadius:"50%",background:PC1,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Black Ops One',cursive",fontSize:11,color:"#fff",flexShrink:0}}>{myNm.slice(0,2).toUpperCase()}</div><div><div style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{myNm}</div><div style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1}}>{myScore}</div></div></div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:56}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"#060e1c",border:"3px solid "+(!started?"#1a3450":finalPhase?(it<10?"#ef4444":"#f59e0b"):isMy?"#22c55e":"#1a3450"),display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:13,fontWeight:900,color:!started?"#1a3450":finalPhase?"#f59e0b":isMy?"#22c55e":"#1a3450"}}>{!started?"⏳":finalPhase&&isMy?it:!finalPhase&&isMy?tt:"·"}</span></div>
          <div style={{fontSize:6,color:isMy&&started?"#22c55e":"rgba(255,255,255,.3)",letterSpacing:1,fontWeight:700}}>{!started?"WAIT":finalPhase?"FINAL":isMy?"YOUR TURN":"WAIT"}</div>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}><div style={{textAlign:"right"}}><div style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{opNm}</div><div style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1}}>{opScore}</div></div><div style={{width:34,height:34,borderRadius:"50%",background:PC2,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Black Ops One',cursive",fontSize:11,color:"#fff",flexShrink:0}}>{opNm.slice(0,2).toUpperCase()}</div></div>
      </div>
      <div style={{textAlign:"center",marginTop:3,fontSize:10,color:isMy&&started?"#f59e0b":"rgba(255,255,255,.3)",fontWeight:700}}>{!started?"⏳ Waiting...":finalPhase?(isMy?"🎯 TAP ? TO GUESS":"⏳ OPPONENT..."):isMy?(canOpen?"👆 TAP A FIELD":canGuess?"💡 TAP ? TO GUESS":"..."):"⏳ OPPONENT'S TURN"}</div>
    </div>
  );

  const PL=(<div style={{display:"flex",gap:8,alignItems:"flex-start"}}>{isMy&&!finalPhase&&didOpen&&started&&<button onClick={()=>{touch();doPass();L("Passed.");}} style={{padding:"6px 12px",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.6)",border:"1px solid rgba(255,255,255,.15)",borderRadius:8,fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>PASS</button>}{log.length>0&&<div style={{flex:1,padding:"4px 8px",background:"rgba(0,0,0,.3)",borderRadius:8}}>{log.map((l,i)=><div key={i} style={{fontSize:10,color:i===0?"rgba(255,255,255,.8)":"rgba(255,255,255,.3)",padding:"1px 0"}}>{l}</div>)}</div>}</div>);

  /* ══════════════════════════════════════════════════════════
     DESKTOP X LAYOUT
     
     Key technique: use a SINGLE CSS Grid for the entire board.
     This allows the FINAL box to span rows 1 and 2 natively.
     
     Grid: 7 columns × 2 rows
     Col layout: [lbl] [4fields] [theme] [FINAL] [theme] [4fields] [lbl]
     FINAL spans gridRow: 1/3
     
     Height: flex:1 + minHeight:0 makes the grid expand.
     Rows: gridTemplateRows:"1fr 1fr" divides height equally.
     Fields in sub-grids get height:"100%" which works because
     the sub-grid itself has height:"100%" within its grid cell.
  ══════════════════════════════════════════════════════════ */
  if(isDesktop){
    const G=8;
    const lbl=(t,c)=><span style={{fontFamily:"'Black Ops One',cursive",fontSize:24,color:c,textShadow:"0 0 12px "+c+"55"}}>{t}</span>;
    const subGrid={display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:G,height:"100%",alignItems:"stretch"};

    return(
      <div style={ROOT}><style>{CSS}</style>
      {SB}
      {/* Main area — flex column, overflow hidden */}
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"8px 14px",gap:6,overflow:"hidden",minHeight:0}}>

        {/* THE GRID — fills remaining space via flex:1, minHeight:0 is crucial */}
        <div style={{
          flex:1,
          minHeight:0,
          display:"grid",
          gridTemplateColumns:"28px 1fr 108px 130px 108px 1fr 28px",
          gridTemplateRows:"1fr 1fr",
          gap:G,
        }}>
          {/* ── ROW 1 ── */}
          {/* A label */}
          <div style={{gridColumn:1,gridRow:1,display:"flex",alignItems:"center",justifyContent:"center"}}>{lbl("A",PC1)}</div>

          {/* A fields: A4 A3 A2 A1 */}
          <div style={{gridColumn:2,gridRow:1,...subGrid}}>
            {[...colA.fields].reverse().map(f=>{const{st,sb}=fst(f.id);return<Fld key={f.id} field={f} st={st} solvedBy={sb} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h="100%"/>;}) }
          </div>

          {/* Theme A */}
          <div style={{gridColumn:3,gridRow:1}}>
            <TIn cid="A" solved={!!colSolved.A} solvedBy={colSolved.A} theme={colA.theme} disabled={!canGuess} onGuess={v=>doGuessCol("A",v)} h="100%"/>
          </div>

          {/* FINAL — spans both rows */}
          <div style={{gridColumn:4,gridRow:"1/3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:finalPhase?"rgba(245,158,11,.08)":"#060c1a",border:"2px solid "+(finalPhase?"#f59e0b66":"#1a2a3a"),borderRadius:12,textAlign:"center",animation:finalPhase?"glowPulse 2s infinite":"none",padding:10}}>
            <div style={{fontSize:8,color:"#253545",letterSpacing:2,marginBottom:8}}>FINAL ANSWER</div>
            {finalSolved?<div style={{fontSize:14,fontWeight:900,color:finalSolved==="p1"?PC1:PC2}}>{board.final.answer}</div>:<div style={{fontSize:24,color:"#1a2a3a",fontWeight:900,fontFamily:"'Black Ops One',cursive",lineHeight:1}}>???</div>}
            <div style={{fontSize:8,color:"#1a2a3a",marginTop:8,fontStyle:"italic"}}>{board.final.hint}</div>
          </div>

          {/* Theme B */}
          <div style={{gridColumn:5,gridRow:1}}>
            <TIn cid="B" solved={!!colSolved.B} solvedBy={colSolved.B} theme={colB.theme} disabled={!canGuess} onGuess={v=>doGuessCol("B",v)} h="100%"/>
          </div>

          {/* B fields: B1 B2 B3 B4 */}
          <div style={{gridColumn:6,gridRow:1,...subGrid}}>
            {colB.fields.map(f=>{const{st,sb}=fst(f.id);return<Fld key={f.id} field={f} st={st} solvedBy={sb} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h="100%"/>;}) }
          </div>

          {/* B label */}
          <div style={{gridColumn:7,gridRow:1,display:"flex",alignItems:"center",justifyContent:"center"}}>{lbl("B",PC2)}</div>

          {/* ── ROW 2 ── */}
          {/* C label */}
          <div style={{gridColumn:1,gridRow:2,display:"flex",alignItems:"center",justifyContent:"center"}}>{lbl("C",PC1)}</div>

          {/* C fields: C4 C3 C2 C1 */}
          <div style={{gridColumn:2,gridRow:2,...subGrid}}>
            {[...colC.fields].reverse().map(f=>{const{st,sb}=fst(f.id);return<Fld key={f.id} field={f} st={st} solvedBy={sb} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h="100%"/>;}) }
          </div>

          {/* Theme C */}
          <div style={{gridColumn:3,gridRow:2}}>
            <TIn cid="C" solved={!!colSolved.C} solvedBy={colSolved.C} theme={colC.theme} disabled={!canGuess} onGuess={v=>doGuessCol("C",v)} h="100%"/>
          </div>

          {/* col 4 = FINAL (already placed, spans rows) */}

          {/* Theme D */}
          <div style={{gridColumn:5,gridRow:2}}>
            <TIn cid="D" solved={!!colSolved.D} solvedBy={colSolved.D} theme={colD.theme} disabled={!canGuess} onGuess={v=>doGuessCol("D",v)} h="100%"/>
          </div>

          {/* D fields: D1 D2 D3 D4 */}
          <div style={{gridColumn:6,gridRow:2,...subGrid}}>
            {colD.fields.map(f=>{const{st,sb}=fst(f.id);return<Fld key={f.id} field={f} st={st} solvedBy={sb} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h="100%"/>;}) }
          </div>

          {/* D label */}
          <div style={{gridColumn:7,gridRow:2,display:"flex",alignItems:"center",justifyContent:"center"}}>{lbl("D",PC2)}</div>
        </div>

        {/* FINAL INPUT — fixed size below board */}
        <div style={{maxWidth:500,margin:"0 auto",width:"100%",flexShrink:0}}>
          <FIn solved={!!finalSolved} solvedBy={finalSolved} answer={board.final.answer} disabled={!canGuess} onGuess={doGuessFinal} h={48}/>
        </div>
        {PL}
        <div style={{textAlign:"center",flexShrink:0}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:9,letterSpacing:2}}><span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"rgba(255,255,255,.3)"}}>.FUN</span></span></div>
      </div>
      </div>
    );
  }

  /* MOBILE — unchanged */
  return(
    <div style={ROOT}><style>{CSS}</style>
    {SB}
    <div style={{flex:1,overflowY:"auto",padding:"7px 10px"}}>
      <div style={{maxWidth:500,margin:"0 auto",display:"flex",flexDirection:"column",gap:5}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <div style={{textAlign:"center",paddingBottom:2,borderBottom:"3px solid "+PC1}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:PC1,letterSpacing:3}}>A</span></div>
          <div style={{textAlign:"center",paddingBottom:2,borderBottom:"3px solid "+PC2}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:PC2,letterSpacing:3}}>B</span></div>
        </div>
        {[0,1,2,3].map(i=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{[colA.fields[i],colB.fields[i]].map(f=>{const{st,sb}=fst(f.id);return<Fld key={f.id} field={f} st={st} solvedBy={sb} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h={52}/>;})}</div>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}><TIn cid="A" solved={!!colSolved.A} solvedBy={colSolved.A} theme={colA.theme} disabled={!canGuess} onGuess={v=>doGuessCol("A",v)} h={48}/><TIn cid="B" solved={!!colSolved.B} solvedBy={colSolved.B} theme={colB.theme} disabled={!canGuess} onGuess={v=>doGuessCol("B",v)} h={48}/></div>
        <FIn solved={!!finalSolved} solvedBy={finalSolved} answer={board.final.answer} disabled={!canGuess} onGuess={doGuessFinal} h={56}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}><TIn cid="C" solved={!!colSolved.C} solvedBy={colSolved.C} theme={colC.theme} disabled={!canGuess} onGuess={v=>doGuessCol("C",v)} h={48}/><TIn cid="D" solved={!!colSolved.D} solvedBy={colSolved.D} theme={colD.theme} disabled={!canGuess} onGuess={v=>doGuessCol("D",v)} h={48}/></div>
        {[0,1,2,3].map(i=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{[colC.fields[i],colD.fields[i]].map(f=>{const{st,sb}=fst(f.id);return<Fld key={f.id} field={f} st={st} solvedBy={sb} canOpen={canOpen&&st==="hidden"} onOpen={doOpen} h={52}/>;})}</div>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}><div style={{textAlign:"center",paddingTop:2,borderTop:"3px solid "+PC1}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:PC1,letterSpacing:3}}>C</span></div><div style={{textAlign:"center",paddingTop:2,borderTop:"3px solid "+PC2}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:16,color:PC2,letterSpacing:3}}>D</span></div></div>
        {PL}
        <div style={{textAlign:"center",padding:"6px 0"}}><span style={{fontFamily:"'Black Ops One',cursive",fontSize:10,letterSpacing:2}}><span style={{color:"#8b5cf6"}}>DEGEN</span><span style={{color:"#22c55e"}}>SAFE</span><span style={{color:"rgba(255,255,255,.3)"}}>.FUN</span></span></div>
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
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(245,158,11,.2)}50%{box-shadow:0 0 40px rgba(245,158,11,.5)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:rgba(0,0,0,.3)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:2px}
`;
