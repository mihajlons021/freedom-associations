// Background music (100% in the lobby, 12% during a match) + soft, calm sound effects.
// Browsers only allow sound after the first click / key press, so everything unlocks then.
const MENU = 1.0, GAME = 0.12;
let music = null, ctx = null, master = null, target = MENU, fade = null, unlocked = false, muted = false;
const subs = new Set();

export function boot() {
  if (music || typeof window === "undefined") return;
  muted = localStorage.getItem("as_muted") === "1";
  music = new Audio("/audio/music.mp3"); music.loop = true; music.preload = "auto"; music.volume = target; music.muted = muted;
  const unlock = () => {
    if (unlocked) return; unlocked = true;
    music.play().catch(() => { unlocked = false; });
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination); } catch (e) {}
  };
  ["pointerdown", "keydown", "touchstart"].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  music.play().then(() => { unlocked = true; }).catch(() => {});
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
export const isMuted = () => muted;
export function setMuted(m) {
  boot(); muted = m; localStorage.setItem("as_muted", m ? "1" : "0");
  music.muted = m; if (master) master.gain.value = m ? 0 : 0.5; subs.forEach(f => f(m));
}
export const onMute = f => { subs.add(f); return () => subs.delete(f); };

// gentle tones: soft sine/triangle notes with a slow fade
function note(freq, at, dur, vol = 0.25, type = "sine") {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
export const sfx = {
  open: () => { note(660, 0, 0.35, 0.18); note(990, 0.05, 0.3, 0.08); },
  right: () => { [523, 659, 784].forEach((f, i) => note(f, i * 0.09, 0.6, 0.2, "triangle")); },
  wrong: () => { note(330, 0, 0.35, 0.16, "triangle"); note(247, 0.16, 0.45, 0.14, "triangle"); },
  turn: () => { note(784, 0, 0.25, 0.12); note(1047, 0.12, 0.35, 0.1); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.13, 0.9, 0.2, "triangle")); },
  tick: () => note(1200, 0, 0.08, 0.05),
};
