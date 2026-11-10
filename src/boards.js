// Associations boards, in the classic TV format ("Asocijacije" from Slagalica):
// each column has 4 easy clue words that point to the column answer,
// and the 4 column answers point to the final answer.
// Rule for every board: everyday words only, and every link must be obvious once you see it.
// `alt` lists other answers we also accept (synonyms, US/UK spelling, plural is handled automatically).

export const BOARDS = [
  { final: "WINTER", cols: [
    { a: "SNOW", w: ["White", "Flake", "Ball", "Angel"] },
    { a: "ICE", w: ["Cube", "Cream", "Skating", "Hockey"] },
    { a: "CHRISTMAS", alt: ["XMAS"], w: ["Tree", "Santa", "Gifts", "December"] },
    { a: "COLD", alt: ["CHILLY"], w: ["Freezer", "Shiver", "Flu", "Frost"] },
  ]},
  { final: "SUMMER", cols: [
    { a: "BEACH", w: ["Sand", "Towel", "Umbrella", "Waves"] },
    { a: "SUN", w: ["Hot", "Shine", "Yellow", "Tan"] },
    { a: "VACATION", alt: ["HOLIDAY", "HOLIDAYS"], w: ["Travel", "Hotel", "Suitcase", "Trip"] },
    { a: "ICE CREAM", alt: ["ICECREAM", "GELATO"], w: ["Cone", "Vanilla", "Scoop", "Chocolate"] },
  ]},
  { final: "FOOTBALL", alt: ["SOCCER"], cols: [
    { a: "GOAL", w: ["Net", "Score", "Keeper", "Post"] },
    { a: "BALL", w: ["Round", "Kick", "Bounce", "Throw"] },
    { a: "STADIUM", alt: ["ARENA"], w: ["Fans", "Seats", "Tickets", "Crowd"] },
    { a: "REFEREE", alt: ["REF"], w: ["Whistle", "Red card", "Yellow card", "Rules"] },
  ]},
  { final: "COFFEE", cols: [
    { a: "CUP", alt: ["MUG"], w: ["Saucer", "Handle", "World", "Tea"] },
    { a: "MORNING", w: ["Breakfast", "Alarm", "Sunrise", "Wake up"] },
    { a: "BEANS", alt: ["BEAN"], w: ["Seeds", "Brown", "Jelly", "Cocoa"] },
    { a: "MILK", w: ["Cow", "White", "Bottle", "Shake"] },
  ]},
  { final: "SEA", alt: ["OCEAN"], cols: [
    { a: "FISH", w: ["Gold", "Fin", "Aquarium", "Chips"] },
    { a: "WAVE", alt: ["WAVES"], w: ["Surf", "Hand", "Tide", "Splash"] },
    { a: "SHIP", alt: ["BOAT"], w: ["Captain", "Sail", "Anchor", "Titanic"] },
    { a: "WHALE", w: ["Big", "Blue", "Moby Dick", "Killer"] },
  ]},
  { final: "MONEY", alt: ["CASH"], cols: [
    { a: "BANK", w: ["Account", "Savings", "Loan", "Robbery"] },
    { a: "GOLD", w: ["Medal", "Ring", "Yellow", "Metal"] },
    { a: "WALLET", alt: ["PURSE"], w: ["Leather", "Pocket", "Cards", "Phantom"] },
    { a: "COIN", alt: ["COINS"], w: ["Flip", "Penny", "Heads", "Tails"] },
  ]},
  { final: "MUSIC", cols: [
    { a: "GUITAR", w: ["Strings", "Rock", "Acoustic", "Electric"] },
    { a: "PIANO", w: ["Keys", "Black and white", "Grand", "Pedal"] },
    { a: "SONG", w: ["Lyrics", "Singer", "Chorus", "Hit"] },
    { a: "CONCERT", w: ["Stage", "Tickets", "Band", "Live"] },
  ]},
  { final: "SCHOOL", cols: [
    { a: "BOOK", alt: ["BOOKS"], w: ["Page", "Read", "Library", "Cover"] },
    { a: "PENCIL", w: ["Eraser", "Sharp", "Write", "Draw"] },
    { a: "TEACHER", w: ["Lesson", "Classroom", "Board", "Students"] },
    { a: "EXAM", alt: ["TEST"], w: ["Grade", "Questions", "Pass", "Fail"] },
  ]},
  { final: "SPACE", alt: ["UNIVERSE", "COSMOS"], cols: [
    { a: "MOON", w: ["Full", "Night", "Crescent", "Apollo"] },
    { a: "STAR", alt: ["STARS"], w: ["Twinkle", "Shooting", "Sky", "Wish"] },
    { a: "ROCKET", w: ["Launch", "Fuel", "NASA", "Countdown"] },
    { a: "PLANET", alt: ["PLANETS"], w: ["Mars", "Earth", "Jupiter", "Orbit"] },
  ]},
  { final: "KITCHEN", cols: [
    { a: "KNIFE", w: ["Sharp", "Cut", "Blade", "Fork"] },
    { a: "FRIDGE", alt: ["REFRIGERATOR"], w: ["Cold", "Freezer", "Door", "Magnet"] },
    { a: "OVEN", alt: ["STOVE"], w: ["Bake", "Hot", "Pizza", "Roast"] },
    { a: "PLATE", alt: ["DISH"], w: ["Dinner", "Bowl", "Wash", "Spoon"] },
  ]},
  { final: "BIRTHDAY", cols: [
    { a: "CAKE", w: ["Chocolate", "Slice", "Bake", "Cream"] },
    { a: "GIFT", alt: ["PRESENT", "GIFTS"], w: ["Box", "Ribbon", "Wrap", "Surprise"] },
    { a: "PARTY", w: ["Dance", "Friends", "Music", "Balloons"] },
    { a: "CANDLE", alt: ["CANDLES"], w: ["Wax", "Flame", "Light", "Blow"] },
  ]},
  { final: "DOG", alt: ["DOGS"], cols: [
    { a: "BONE", w: ["Skeleton", "Skull", "Chew", "Broken"] },
    { a: "BARK", w: ["Tree", "Loud", "Woof", "Noise"] },
    { a: "PUPPY", w: ["Small", "Cute", "Young", "Love"] },
    { a: "WALK", w: ["Park", "Steps", "Feet", "Slow"] },
  ]},
  { final: "CAR", alt: ["AUTO"], cols: [
    { a: "WHEEL", alt: ["WHEELS"], w: ["Steering", "Ferris", "Spin", "Round"] },
    { a: "ENGINE", alt: ["MOTOR"], w: ["Oil", "Start", "Power", "Noise"] },
    { a: "ROAD", alt: ["STREET"], w: ["Highway", "Asphalt", "Traffic", "Map"] },
    { a: "DRIVER", w: ["License", "Taxi", "Seat", "Bus"] },
  ]},
  { final: "RAIN", cols: [
    { a: "CLOUD", alt: ["CLOUDS"], w: ["Sky", "Grey", "Fluffy", "White"] },
    { a: "UMBRELLA", w: ["Open", "Handle", "Dry", "Black"] },
    { a: "DROP", alt: ["DROPS"], w: ["Water", "Tear", "Small", "Fall"] },
    { a: "STORM", w: ["Thunder", "Lightning", "Wind", "Dark"] },
  ]},
  { final: "FIRE", cols: [
    { a: "SMOKE", w: ["Grey", "Cigarette", "Alarm", "Chimney"] },
    { a: "HOT", alt: ["HEAT"], w: ["Pepper", "Spicy", "Warm", "Burn"] },
    { a: "CAMP", alt: ["CAMPING"], w: ["Tent", "Scout", "Forest", "Sleeping bag"] },
    { a: "MATCH", alt: ["MATCHES"], w: ["Stick", "Box", "Light", "Strike"] },
  ]},
  { final: "HOSPITAL", cols: [
    { a: "DOCTOR", w: ["White coat", "Patient", "Check-up", "Stethoscope"] },
    { a: "NURSE", w: ["Care", "Uniform", "Help", "Injection"] },
    { a: "MEDICINE", alt: ["PILL", "PILLS"], w: ["Tablet", "Cure", "Pharmacy", "Syrup"] },
    { a: "AMBULANCE", w: ["Siren", "Emergency", "Fast", "911"] },
  ]},
  { final: "CINEMA", alt: ["MOVIES", "MOVIE", "THEATER", "THEATRE", "FILM"], cols: [
    { a: "POPCORN", w: ["Butter", "Salt", "Microwave", "Snack"] },
    { a: "TICKET", alt: ["TICKETS"], w: ["Pass", "Line", "Price", "Seat"] },
    { a: "SCREEN", w: ["Big", "TV", "Phone", "Touch"] },
    { a: "ACTOR", alt: ["ACTORS", "ACTRESS"], w: ["Star", "Role", "Hollywood", "Oscar"] },
  ]},
  { final: "PIZZA", cols: [
    { a: "CHEESE", w: ["Mouse", "Yellow", "Holes", "Swiss"] },
    { a: "TOMATO", alt: ["TOMATOES"], w: ["Red", "Ketchup", "Salad", "Juice"] },
    { a: "ITALY", alt: ["ITALIAN"], w: ["Rome", "Pasta", "Boot", "Venice"] },
    { a: "OVEN", w: ["Bake", "Hot", "Bread", "Kitchen"] },
  ]},
  { final: "TIME", cols: [
    { a: "CLOCK", w: ["Tick", "Wall", "Hands", "Alarm"] },
    { a: "HOUR", alt: ["HOURS"], w: ["Sixty", "Rush", "Happy", "Minutes"] },
    { a: "CALENDAR", w: ["Date", "Month", "Year", "Days"] },
    { a: "WATCH", w: ["Wrist", "Smart", "Look", "Rolex"] },
  ]},
  { final: "NIGHT", cols: [
    { a: "DARK", w: ["Black", "Shadow", "Lights off", "Scary"] },
    { a: "SLEEP", w: ["Bed", "Dream", "Pillow", "Tired"] },
    { a: "OWL", w: ["Bird", "Wise", "Hoot", "Big eyes"] },
    { a: "MOON", w: ["Full", "Wolf", "Crescent", "Silver"] },
  ]},
  { final: "GARDEN", cols: [
    { a: "FLOWER", alt: ["FLOWERS"], w: ["Rose", "Tulip", "Bloom", "Petal"] },
    { a: "TREE", alt: ["TREES"], w: ["Leaf", "Branch", "Trunk", "Wood"] },
    { a: "GRASS", alt: ["LAWN"], w: ["Green", "Mow", "Field", "Cow food"] },
    { a: "WATER", w: ["Drink", "Glass", "Bottle", "River"] },
  ]},
  { final: "BASKETBALL", cols: [
    { a: "HOOP", w: ["Ring", "Net", "Rim", "Hula"] },
    { a: "DUNK", w: ["Slam", "Jump", "Cookie", "Air"] },
    { a: "TALL", w: ["High", "Giant", "Long legs", "Height"] },
    { a: "NBA", w: ["League", "Lakers", "Bulls", "Celtics"] },
  ]},
  { final: "BREAKFAST", cols: [
    { a: "EGG", alt: ["EGGS"], w: ["Chicken", "Yolk", "Fried", "Boiled"] },
    { a: "TOAST", w: ["Bread", "Butter", "Jam", "Cheers"] },
    { a: "JUICE", w: ["Orange", "Apple", "Fresh", "Glass"] },
    { a: "CEREAL", w: ["Milk", "Bowl", "Corn flakes", "Spoon"] },
  ]},
  { final: "PHONE", alt: ["MOBILE", "SMARTPHONE", "CELLPHONE", "TELEPHONE"], cols: [
    { a: "CALL", w: ["Ring", "Answer", "Hello", "Number"] },
    { a: "MESSAGE", alt: ["TEXT", "SMS", "MESSAGES"], w: ["Chat", "Send", "Inbox", "Emoji"] },
    { a: "CAMERA", w: ["Photo", "Lens", "Flash", "Selfie"] },
    { a: "APP", alt: ["APPS"], w: ["Store", "Download", "Icon", "Install"] },
  ]},
  { final: "HONEY", cols: [
    { a: "BEE", alt: ["BEES"], w: ["Buzz", "Sting", "Wings", "Queen"] },
    { a: "BEAR", w: ["Teddy", "Polar", "Brown", "Winnie"] },
    { a: "SWEET", w: ["Sugar", "Candy", "Dessert", "Cute"] },
    { a: "TEA", w: ["Green", "Cup", "Lemon", "Kettle"] },
  ]},
  { final: "FARM", cols: [
    { a: "COW", alt: ["COWS"], w: ["Moo", "Milk", "Calf", "Spots"] },
    { a: "PIG", alt: ["PIGS"], w: ["Pink", "Mud", "Oink", "Bacon"] },
    { a: "TRACTOR", w: ["Wheels", "Field", "Plough", "Diesel"] },
    { a: "CHICKEN", alt: ["HEN", "CHICKENS"], w: ["Egg", "Feather", "Cluck", "Wings"] },
  ]},
  { final: "CRYPTO", alt: ["CRYPTOCURRENCY"], cols: [
    { a: "BITCOIN", alt: ["BTC"], w: ["Satoshi", "Halving", "Orange coin", "First coin"] },
    { a: "WALLET", w: ["Phantom", "Seed phrase", "Keys", "Address"] },
    { a: "MOON", w: ["Pump", "Rocket", "Lambo", "To the..."] },
    { a: "CHART", alt: ["CHARTS"], w: ["Candles", "Green", "Red", "Trading"] },
  ]},
  { final: "GYM", alt: ["FITNESS"], cols: [
    { a: "MUSCLE", alt: ["MUSCLES"], w: ["Strong", "Biceps", "Arm", "Protein"] },
    { a: "RUN", alt: ["RUNNING"], w: ["Jog", "Fast", "Marathon", "Sneakers"] },
    { a: "WEIGHT", alt: ["WEIGHTS"], w: ["Heavy", "Kilo", "Scale", "Lift"] },
    { a: "SWEAT", w: ["Towel", "Hot", "Wet", "Shirt"] },
  ]},
  { final: "AIRPORT", cols: [
    { a: "PLANE", alt: ["AIRPLANE", "AEROPLANE"], w: ["Wings", "Pilot", "Fly", "Jet"] },
    { a: "PASSPORT", w: ["Photo", "Stamp", "Border", "Visa"] },
    { a: "SUITCASE", alt: ["LUGGAGE", "BAG"], w: ["Pack", "Wheels", "Travel", "Clothes"] },
    { a: "FLIGHT", w: ["Delay", "Boarding", "Seat belt", "Take off"] },
  ]},
  { final: "WEDDING", cols: [
    { a: "RING", alt: ["RINGS"], w: ["Diamond", "Finger", "Gold", "Engagement"] },
    { a: "BRIDE", w: ["Dress", "Veil", "White", "Bouquet"] },
    { a: "CAKE", w: ["Slice", "Layers", "Cream", "Birthday"] },
    { a: "DANCE", w: ["Waltz", "Floor", "Party", "Music"] },
  ]},
  { final: "HALLOWEEN", cols: [
    { a: "PUMPKIN", w: ["Orange", "Pie", "Seeds", "Carve"] },
    { a: "GHOST", w: ["Boo", "Sheet", "Haunted", "Spirit"] },
    { a: "CANDY", alt: ["SWEETS"], w: ["Sugar", "Lollipop", "Chocolate", "Trick or treat"] },
    { a: "COSTUME", alt: ["COSTUMES"], w: ["Mask", "Dress up", "Party", "Disguise"] },
  ]},
  { final: "ZOO", cols: [
    { a: "LION", w: ["King", "Mane", "Roar", "Africa"] },
    { a: "MONKEY", w: ["Banana", "Jungle", "Tail", "Climb"] },
    { a: "ELEPHANT", w: ["Trunk", "Grey", "Big ears", "Ivory"] },
    { a: "CAGE", w: ["Bird", "Bars", "Lock", "Prison"] },
  ]},
];

// ---------- answer checking: forgiving, so a small typo or a plural never costs a point ----------
const norm = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const stem = s => (s.length > 3 && s.endsWith("S") ? s.slice(0, -1) : s);
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
export function isMatch(guess, answer, alt = []) {
  const g = stem(norm(guess)); if (!g) return false;
  return [answer, ...alt].some(x => {
    const t = stem(norm(x));
    return g === t || (t.length >= 6 && lev(g, t) <= 1);   // one typo allowed on longer words
  });
}
