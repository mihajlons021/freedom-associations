// Background music (100% in the lobby, 12% during a match) + soft, calm sound effects.
// Browsers only allow sound after the first click / key press, so everything unlocks then.
const MENU = 1.0, GAME = 0.12;
let music = null, ctx = null, master = null, target = MENU, fade = null, unlocked = false, muted = false;
const subs = new Set();

export function boot() {
  if (music || typeof window === "undefined") return;
  muted = localStorage.getItem("as_muted") === "1";
  music = new Audio("/audio/music.mp3"); music.loop = true; music.preload = "auto"; music.volume = target; music.muted = muted;
  // effects get their own audio engine on the first click, whether or not the music was already allowed to play
  const unlock = () => {
    ensureCtx();
    if (unlocked) return; unlocked = true;
    music.play().catch(() => { unlocked = false; });
  };
  ["pointerdown", "keydown", "touchstart"].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  music.play().then(() => { unlocked = true; }).catch(() => {});
}
function ensureCtx() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.85; master.connect(ctx.destination); } catch (e) {}
}
function level(v) {
  boot(); target = v; clearInterval(fade);
  fade = setInterval(() => {
    const cur = music.volume;
    if (Math.abs(cur - target) <= 0.04) { music.volume = target; clearInterval(fade); } else music.volume = cur + (target > cur ? 0.04 : -0.04);
  }, 40);
}
export const menuMusic = () => level(MENU);
export const gameMusic = () => level(GAME);
export const isMuted = () => { boot(); return muted; };   // read the saved setting before the button first draws
export function setMuted(m) {
  boot(); muted = m; localStorage.setItem("as_muted", m ? "1" : "0");
  music.muted = m; if (master) master.gain.value = m ? 0 : 0.85; subs.forEach(f => f(m));
}
export const onMute = f => { subs.add(f); return () => subs.delete(f); };

// gentle tones: soft sine/triangle notes with a slow fade
function note(freq, at, dur, vol = 0.25, type = "sine", slideTo = 0) {
  if (!ctx || muted) return;
  if (ctx.state === "suspended") ctx.resume();
  const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur * 0.9);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
// short airy "whoosh" (a card turning over)
function swish(at, dur, vol, from, to) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at, len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf; f.type = "bandpass"; f.Q.value = 1.2; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t); src.connect(f); f.connect(g); g.connect(master); src.start(t);
}
const chord = (fs, at, dur, vol, type = "triangle") => fs.forEach(f => note(f, at, dur, vol, type));
export const sfx = {
  // 1) clicking a field: soft card flip + a clear wooden "tok"
  open: () => { swish(0, 0.14, 0.35, 900, 3200); note(880, 0.03, 0.18, 0.32, "sine", 660); note(1760, 0.03, 0.08, 0.08); },
  // 2) wrong answer: a gentle two-step "uh-oh" going down
  wrong: () => { note(392, 0, 0.32, 0.34, "triangle", 370); note(294, 0.2, 0.55, 0.34, "triangle", 262); note(147, 0.2, 0.55, 0.12, "sine"); },
  // 3) column solved: bright rising arpeggio with a sparkle on top
  right: () => { [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.075, 0.55, 0.28, "triangle")); note(2093, 0.3, 0.5, 0.07); note(2637, 0.36, 0.5, 0.05); },
  // 4) final solved: a little fanfare — rising run, then a big warm chord and shimmer
  final: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, i * 0.07, 0.4, 0.26, "triangle"));
    chord([523, 659, 784, 1047], 0.42, 1.6, 0.16); chord([262, 392], 0.42, 1.6, 0.14, "sine");
    [2093, 2349, 2637, 3136].forEach((f, i) => note(f, 0.5 + i * 0.09, 0.7, 0.05));
  },
  turn: () => { note(784, 0, 0.22, 0.14); note(1047, 0.1, 0.32, 0.12); },
  win: () => { chord([392, 523, 659], 0, 1.2, 0.12); },
  tick: () => note(1200, 0, 0.07, 0.07),
};
