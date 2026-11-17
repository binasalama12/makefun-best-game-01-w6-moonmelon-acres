// Tiny WebAudio synth for MOONMELON ACRES: no audio files, just shaped
// oscillator blips — a soft thump when a seed lands, a splash when a bed is
// watered, a coin chime on a sale, and a bright arpeggio when the mutation
// lottery lands. Everything is guarded so the game stays silent rather
// than broken without audio.

let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  } catch { ctx = null; }
}

function blip(freqA, freqB, dur, type = 'sine', vol = 1, when = 0) {
  if (!ctx || !master) return;
  try {
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freqA, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, freqB), t0 + dur);
    g.gain.setValueAtTime(vol * 0.9, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch { /* silence is fine */ }
}

export const sfx = {
  plant() { blip(300, 140, 0.12, 'sine', 0.9); },
  water() { blip(900, 420, 0.18, 'sine', 0.6); blip(1200, 700, 0.14, 'sine', 0.4, 0.05); },
  sell() { blip(880, 1320, 0.16, 'triangle', 0.8); blip(1320, 1760, 0.2, 'triangle', 0.5, 0.06); },
  mutate(tier) {
    if (tier === 'prism') [660, 880, 1108, 1479, 1975].forEach((f, i) => blip(f, f, 0.3, 'sine', 0.7, i * 0.07));
    else if (tier === 'frost') [1046, 1318, 1568].forEach((f, i) => blip(f, f, 0.26, 'sine', 0.7, i * 0.07));
    else [523, 659, 784].forEach((f, i) => blip(f, f * 1.2, 0.22, 'triangle', 0.7, i * 0.06));
  },
  shoo() { blip(1400, 300, 0.12, 'square', 0.4); },
  ward() { blip(520, 780, 0.2, 'sine', 0.7); },
  strike() { blip(180, 60, 0.35, 'sawtooth', 0.7); blip(90, 45, 0.4, 'sine', 0.9, 0.03); },
  storm() { [220, 233, 247].forEach((f, i) => blip(f, f * 0.94, 0.8, 'sawtooth', 0.3, i * 0.12)); },
  clear() { [523, 659, 784, 1046].forEach((f, i) => blip(f, f, 0.34, 'sine', 0.8, i * 0.09)); },
  over() { [392, 330, 262, 196].forEach((f, i) => blip(f, f * 0.94, 0.4, 'triangle', 0.8, i * 0.13)); },
  draft() { [784, 988, 1175].forEach((f, i) => blip(f, f, 0.3, 'triangle', 0.7, i * 0.08)); },
};
