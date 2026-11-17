// MOONMELON ACRES — all canvas art. A moonlit, textured garden (seeded
// stars, speckled soil, furrows, a fence and fireflies — never a plain
// grid), the nine beds and their crops in four growth stages, mutation
// auras, pests, storm wards, and every screen: play HUD, dense title,
// talisman draft, and the end screen with its letter rank.

import {
  VIEW_W, VIEW_H, FIELD, CROPS, MUTATIONS, TALISMANS, PESTS, SEASONS,
  DIFFICULTIES, MOONPHASES, PHASE_RECT, WELL_RECT, SHOP_Y, shopRect, STORMS,
} from './config.js';
import { cropStage, isRipe } from './world.js';
import { makeRng } from './rng.js';

// Deterministic scenery, generated once from a fixed seed.
const scenRng = makeRng(424242);
const STARS = Array.from({ length: 130 }, () => ({ x: scenRng() * VIEW_W, y: scenRng() * 300, r: 0.8 + scenRng() * 1.7, p: scenRng() * 6.28 }));
const SPECKS = Array.from({ length: 340 }, () => ({ x: FIELD.x + scenRng() * FIELD.w, y: FIELD.y + scenRng() * FIELD.h, r: 1 + scenRng() * 2.4, a: 0.05 + scenRng() * 0.12 }));
const GRASS = Array.from({ length: 90 }, () => ({ x: scenRng() * VIEW_W, y: 520 + scenRng() * 180, h: 8 + scenRng() * 16, p: scenRng() * 6.28 }));
const BED_DOTS = Array.from({ length: 9 }, (_, b) => {
  const r = makeRng(900 + b * 77);
  return Array.from({ length: 26 }, () => ({ x: r() * 200 + 12, y: r() * 88 + 12, rad: 1 + r() * 2.2 }));
});

function rr(ctx, x, y, w, h, rad) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
function wrap(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; }
    else line = t;
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}
function bar(ctx, x, y, w, h, frac, color, back) {
  ctx.fillStyle = back || 'rgba(8,12,30,.85)';
  rr(ctx, x, y, w, h, h / 2); ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color;
    rr(ctx, x + 1.5, y + 1.5, Math.max(3, (w - 3) * Math.min(1, frac)), h - 3, (h - 3) / 2); ctx.fill();
  }
}

// --- Scenery ---------------------------------------------------------------------
function drawBackground(ctx, state, dark) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#0a1233'); g.addColorStop(0.55, '#101d42'); g.addColorStop(1, '#0c2418');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (const s of STARS) {
    ctx.globalAlpha = 0.35 + 0.3 * Math.sin(state.time * 0.7 + s.p);
    ctx.fillStyle = '#dfeaff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // The moon, with a halo — bigger and lower when the Locust Moon rides.
  const locust = state.storm && state.storm.kind === 'locust';
  const mx = 1130, my = 92, mr = locust ? 44 : 34;
  const halo = ctx.createRadialGradient(mx, my, 6, mx, my, mr * 3.1);
  halo.addColorStop(0, locust ? 'rgba(255,210,77,.5)' : 'rgba(255,240,190,.42)');
  halo.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = halo; ctx.fillRect(mx - mr * 3.2, my - mr * 3.2, mr * 6.4, mr * 6.4);
  ctx.fillStyle = locust ? '#ffd24d' : '#fdf3cf';
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.29); ctx.fill();
  ctx.fillStyle = 'rgba(190,170,120,.35)';
  ctx.beginPath(); ctx.arc(mx - 12, my - 8, 7, 0, 6.29); ctx.fill();
  ctx.beginPath(); ctx.arc(mx + 10, my + 12, 5, 0, 6.29); ctx.fill();
  // Rolling hills and the fence line behind the field.
  ctx.fillStyle = '#0e2c1c';
  ctx.beginPath(); ctx.moveTo(0, 470);
  for (let x = 0; x <= VIEW_W; x += 80) ctx.lineTo(x, 452 + Math.sin(x * 0.011 + 2) * 16);
  ctx.lineTo(VIEW_W, VIEW_H); ctx.lineTo(0, VIEW_H); ctx.fill();
  ctx.strokeStyle = 'rgba(120,86,50,.8)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(FIELD.x - 18, FIELD.y - 14); ctx.lineTo(FIELD.x + FIELD.w + 18, FIELD.y - 14); ctx.stroke();
  for (let x = FIELD.x - 10; x < FIELD.x + FIELD.w + 14; x += 62) {
    ctx.beginPath(); ctx.moveTo(x, FIELD.y - 26); ctx.lineTo(x, FIELD.y - 2); ctx.stroke();
  }
  // Field soil texture: speckles, then grass at the edges.
  ctx.fillStyle = '#17351f'; rr(ctx, FIELD.x - 14, FIELD.y - 10, FIELD.w + 28, FIELD.h + 20, 18); ctx.fill();
  for (const s of SPECKS) { ctx.fillStyle = `rgba(210,255,190,${s.a})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.fill(); }
  ctx.strokeStyle = 'rgba(90,200,120,.25)'; ctx.lineWidth = 2;
  for (const gr of GRASS) {
    ctx.beginPath(); ctx.moveTo(gr.x, gr.y + 20);
    ctx.quadraticCurveTo(gr.x + Math.sin(state.time + gr.p) * 3, gr.y + 8, gr.x + 2, gr.y + 20 - gr.h); ctx.stroke();
  }
  if (dark) { ctx.fillStyle = 'rgba(4,6,18,.45)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
}

// --- Crops ---------------------------------------------------------------------------
function drawCrop(ctx, bed, state) {
  if (bed.crop === null) return;
  const crop = CROPS[bed.crop];
  const cx = bed.x + bed.w / 2, base = bed.y + bed.h - 16;
  const stage = cropStage(bed);
  const mut = bed.mutation ? MUTATIONS[bed.mutation] : null;
  const sway = Math.sin(state.time * 1.6 + bed.id * 1.7) * 2;
  if (mut) {
    const pulse = 0.75 + 0.25 * Math.sin(state.time * 4 + bed.id);
    const gl = ctx.createRadialGradient(cx, base - 34, 4, cx, base - 34, 66 * pulse);
    gl.addColorStop(0, mut.glow); gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl; ctx.fillRect(cx - 70, base - 104, 140, 140);
  }
  ctx.strokeStyle = '#2f7a3d'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  if (stage === 0) {
    ctx.fillStyle = '#d8c9a0';
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(cx + i * 16, base - 4, 5, 3.4, 0, 0, 6.29); ctx.fill(); }
    ctx.strokeStyle = '#57b368'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, base - 4); ctx.quadraticCurveTo(cx + sway, base - 14, cx + sway * 1.4, base - 18); ctx.stroke();
    return;
  }
  const hgt = stage === 1 ? 26 : stage === 2 ? 44 : 52;
  ctx.beginPath(); ctx.moveTo(cx, base); ctx.quadraticCurveTo(cx + sway, base - hgt * 0.6, cx + sway * 1.6, base - hgt); ctx.stroke();
  ctx.fillStyle = crop.dark;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + s * 13 + sway, base - hgt * 0.45, 13, 6, s * 0.6, 0, 6.29); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + s * 8 + sway, base - hgt * 0.75, 10, 5, -s * 0.5, 0, 6.29); ctx.fill();
  }
  const fx = cx + sway * 1.6, fy = base - hgt - 6;
  ctx.fillStyle = crop.color;
  if (stage === 2) { ctx.beginPath(); ctx.arc(fx, fy, 8, 0, 6.29); ctx.fill(); return; }
  // Ripe fruit, drawn per crop line.
  const R = crop.fruit === 'pumpkin' ? 24 : crop.fruit === 'melon' ? 21 : 16;
  if (crop.fruit === 'melon' || crop.fruit === 'pumpkin') {
    ctx.beginPath(); ctx.ellipse(fx, fy, R, R * 0.82, 0, 0, 6.29); ctx.fill();
    ctx.strokeStyle = crop.dark; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(fx + i * (R / 2.6), fy, R * 0.32, R * 0.8, 0, 0, 6.29); ctx.stroke(); }
  } else if (crop.fruit === 'berry') {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.28, bx = fx + Math.cos(a) * 10, by = fy + Math.sin(a) * 8;
      ctx.beginPath(); ctx.arc(bx, by, 7.5, 0, 6.29); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(fx, fy, 7.5, 0, 6.29); ctx.fill();
  } else if (crop.fruit === 'pepper') {
    ctx.beginPath(); ctx.ellipse(fx, fy + 4, 9, 19, 0.35, 0, 6.29); ctx.fill();
    ctx.beginPath(); ctx.ellipse(fx - 13, fy + 1, 8, 16, -0.3, 0, 6.29); ctx.fill();
  } else if (crop.fruit === 'turnip') {
    ctx.fillStyle = '#f2eaff';
    ctx.beginPath(); ctx.ellipse(fx, fy + 6, 14, 15, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = crop.color; ctx.beginPath(); ctx.ellipse(fx, fy - 2, 13, 7, 0, 0, 6.29); ctx.fill();
  } else { // orchid
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.28 - 1.57;
      ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 10, fy + Math.sin(a) * 10, 9, 5.5, a, 0, 6.29); ctx.fill();
    }
    ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(fx, fy, 5, 0, 6.29); ctx.fill();
  }
  if (mut) {
    ctx.strokeStyle = mut.color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(fx, fy, R + 9 + Math.sin(state.time * 4 + bed.id) * 2, 0, 6.29); ctx.stroke();
    ctx.fillStyle = mut.color; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(`x${mut.mult}`, fx, fy - R - 14);
  }
}

function drawBeds(ctx, state) {
  for (const bed of state.beds) {
    const dots = BED_DOTS[bed.id];
    ctx.fillStyle = '#4a3220'; rr(ctx, bed.x, bed.y, bed.w, bed.h, 14); ctx.fill();
    ctx.fillStyle = '#5d4028'; rr(ctx, bed.x + 5, bed.y + 5, bed.w - 10, bed.h - 10, 11); ctx.fill();
    ctx.fillStyle = 'rgba(30,18,10,.5)';
    for (const d of dots) { ctx.beginPath(); ctx.arc(bed.x + d.x, bed.y + d.y, d.rad, 0, 6.29); ctx.fill(); }
    ctx.strokeStyle = 'rgba(24,14,8,.55)'; ctx.lineWidth = 3;
    for (let r = 1; r <= 2; r++) { ctx.beginPath(); ctx.moveTo(bed.x + 14, bed.y + r * 36); ctx.lineTo(bed.x + bed.w - 14, bed.y + r * 36); ctx.stroke(); }
    if (bed.watered > 0) { ctx.fillStyle = 'rgba(80,180,255,.13)'; rr(ctx, bed.x + 5, bed.y + 5, bed.w - 10, bed.h - 10, 11); ctx.fill(); }
    if (bed.blessed > 0) {
      ctx.fillStyle = '#ff7ae8'; ctx.font = '13px Georgia'; ctx.textAlign = 'left';
      ctx.fillText('✦ blessed', bed.x + 10, bed.y + 18);
    }
    drawCrop(ctx, bed, state);
    if (bed.frozen > 0) {
      ctx.fillStyle = 'rgba(160,225,255,.4)'; rr(ctx, bed.x + 4, bed.y + 4, bed.w - 8, bed.h - 8, 11); ctx.fill();
      ctx.fillStyle = '#e8fbff'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center';
      ctx.fillText('FROZEN', bed.x + bed.w / 2, bed.y + 22);
    }
    if (bed.scorch > 0) {
      ctx.fillStyle = 'rgba(255,90,40,.28)'; rr(ctx, bed.x + 4, bed.y + 4, bed.w - 8, bed.h - 8, 11); ctx.fill();
      ctx.fillStyle = '#ffb08a'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center';
      ctx.fillText('SCORCHED', bed.x + bed.w / 2, bed.y + 22);
    }
    if (bed.warded) {
      ctx.strokeStyle = 'rgba(160,230,255,.9)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bed.x + bed.w / 2, bed.y + bed.h / 2, bed.w * 0.46, 0, 6.29); ctx.stroke();
      ctx.fillStyle = 'rgba(160,230,255,.12)';
      ctx.beginPath(); ctx.arc(bed.x + bed.w / 2, bed.y + bed.h / 2, bed.w * 0.46, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#cfeeff'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center';
      ctx.fillText('WARDED', bed.x + bed.w / 2, bed.y + bed.h - 8);
    }
    // Bed label: crop + stage + growth.
    ctx.font = '12.5px Georgia'; ctx.textAlign = 'left';
    if (bed.crop === null) {
      ctx.fillStyle = 'rgba(230,255,215,.5)';
      ctx.fillText('empty bed — click to plant', bed.x + 12, bed.y + bed.h - 10);
    } else {
      const crop = CROPS[bed.crop];
      const st = crop.stages[cropStage(bed)];
      ctx.fillStyle = '#eaffd8';
      ctx.fillText(`${crop.name} · ${st}`, bed.x + 12, bed.y + bed.h - 22);
      bar(ctx, bed.x + 12, bed.y + bed.h - 16, 120, 7, bed.growth, isRipe(bed) ? '#ffd24d' : '#8fe86b');
      if (isRipe(bed)) {
        ctx.fillStyle = '#ffd24d'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'right';
        ctx.fillText('RIPE — click to harvest!', bed.x + bed.w - 10, bed.y + bed.h - 22);
      }
    }
    if (state.hoverBed === bed.id && state.mode === 'play') {
      ctx.strokeStyle = 'rgba(255,233,168,.85)'; ctx.lineWidth = 2.5;
      rr(ctx, bed.x - 2, bed.y - 2, bed.w + 4, bed.h + 4, 15); ctx.stroke();
    }
  }
}

// --- Panels ------------------------------------------------------------------------------
function drawLeftPanel(ctx, state) {
  const x = 14, y = 108, w = 224;
  ctx.fillStyle = 'rgba(6,10,26,.82)'; rr(ctx, x, y, w, 252, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(140,190,255,.35)'; ctx.lineWidth = 1.5; rr(ctx, x, y, w, 252, 12); ctx.stroke();
  ctx.fillStyle = '#9fd8b4'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'left';
  ctx.fillText(`TALISMANS (${state.talismans.length}/8)`, x + 12, y + 24);
  if (!state.talismans.length) {
    ctx.fillStyle = 'rgba(230,255,215,.6)'; ctx.font = '12.5px Georgia';
    wrap(ctx, 'None yet — meet a season quota to draft 1 of 3.', x + 12, y + 48, w - 24, 16);
  }
  state.talismans.forEach((id, i) => {
    const t = TALISMANS.find((v) => v.id === id);
    if (!t) return;
    const yy = y + 44 + i * 26;
    ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(x + 24, yy - 4, 10, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#0a0f22'; ctx.font = 'bold 9px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(t.glyph, x + 24, yy - 1);
    ctx.fillStyle = '#eaffd8'; ctx.font = '13px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(t.name, x + 42, yy);
  });
  const fy = y + 262;
  ctx.fillStyle = 'rgba(6,10,26,.82)'; rr(ctx, x, fy, w, 158, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(140,190,255,.35)'; rr(ctx, x, fy, w, 158, 12); ctx.stroke();
  ctx.fillStyle = '#9fd8b4'; ctx.font = 'bold 13px Georgia';
  ctx.fillText('MUTATION FEED', x + 12, fy + 24);
  ctx.font = '12px Georgia';
  state.feed.slice(0, 5).forEach((f, i) => {
    ctx.fillStyle = f.color;
    wrap(ctx, f.text, x + 12, fy + 48 + i * 22, w - 22, 15);
  });
}

function drawRightPanel(ctx, state) {
  const x = 1042, y = 108, w = 224;
  ctx.fillStyle = 'rgba(6,10,26,.82)'; rr(ctx, x, y, w, 252, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(140,190,255,.35)'; ctx.lineWidth = 1.5; rr(ctx, x, y, w, 252, 12); ctx.stroke();
  ctx.fillStyle = '#9fd8b4'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'left';
  ctx.fillText('INCOMING WEATHER', x + 12, y + 24);
  const w = state.weather, nw = state.weatherNext;
  if (w) {
    ctx.fillStyle = w.color; ctx.font = 'bold 17px Georgia';
    ctx.fillText(`NOW: ${w.name}`, x + 12, y + 52);
    ctx.fillStyle = '#eaffd8'; ctx.font = '12px Georgia';
    wrap(ctx, w.desc, x + 12, y + 72, w - 24, 15);
  }
  if (nw) {
    ctx.fillStyle = nw.color; ctx.font = 'bold 14px Georgia';
    ctx.fillText(`NEXT: ${nw.name}`, x + 12, y + 122);
    ctx.fillStyle = 'rgba(230,255,215,.75)'; ctx.font = '12px Georgia';
    ctx.fillText(`arrives in ${Math.max(0, Math.ceil(state.weatherTimer))}s`, x + 12, y + 142);
  }
  bar(ctx, x + 12, y + 154, w - 24, 8, Math.max(0, state.weatherTimer) / 24, '#7fe8ff');
  ctx.fillStyle = '#9fd8b4'; ctx.font = 'bold 13px Georgia';
  ctx.fillText('SEASON CLOCK', x + 12, y + 186);
  ctx.fillStyle = '#eaffd8'; ctx.font = '14px Georgia';
  ctx.fillText(`${Math.max(0, Math.ceil(state.seasonTime))}s left · quota below`, x + 12, y + 208);
  bar(ctx, x + 12, y + 218, w - 24, 10, state.quota ? state.quotaEarned / state.quota : 0, '#ffd24d');
  ctx.fillStyle = '#ffd24d'; ctx.font = 'bold 12.5px Georgia';
  ctx.fillText(`${Math.floor(state.quotaEarned)} / ${state.quota} coins`, x + 12, y + 244);

  const sy = y + 262;
  ctx.fillStyle = state.storm ? 'rgba(40,8,26,.88)' : 'rgba(6,10,26,.82)';
  rr(ctx, x, sy, w, 158, 12); ctx.fill();
  ctx.strokeStyle = state.storm ? state.storm.def.color : 'rgba(140,190,255,.35)';
  ctx.lineWidth = 1.5; rr(ctx, x, sy, w, 158, 12); ctx.stroke();
  if (state.storm) {
    const st = state.storm;
    ctx.fillStyle = st.def.color; ctx.font = 'bold 15px Georgia';
    ctx.fillText(`⚠ ${st.name}`, x + 12, sy + 26);
    ctx.fillStyle = '#ffe9d8'; ctx.font = '12px Georgia';
    wrap(ctx, st.def.desc, x + 12, sy + 48, w - 24, 15);
    bar(ctx, x + 12, sy + 92, w - 24, 10, st.hp / st.maxHp, st.def.color);
    ctx.fillStyle = '#eaffd8'; ctx.font = '12.5px Georgia';
    ctx.fillText(`storm HP ${Math.max(0, Math.ceil(st.hp))}/${st.maxHp} · ${Math.ceil(st.timer)}s`, x + 12, sy + 120);
    ctx.fillText(`strikes so far: ${st.strikes} · ward = 12 water`, x + 12, sy + 140);
  } else {
    ctx.fillStyle = '#9fd8b4'; ctx.font = 'bold 13px Georgia';
    ctx.fillText('STORM WATCH', x + 12, sy + 26);
    ctx.fillStyle = '#eaffd8'; ctx.font = '12.5px Georgia';
    wrap(ctx, 'No storm this season. The Blightstorm waits in season 4; the Locust Moon closes season 7. Wards cost 12 water.', x + 12, sy + 50, w - 24, 16);
  }
}

function drawTopStrip(ctx, state) {
  ctx.fillStyle = 'rgba(6,10,26,.8)'; rr(ctx, FIELD.x - 14, 56, FIELD.w + 28, 46, 12); ctx.fill();
  ctx.font = 'bold 15px Georgia'; ctx.textAlign = 'left';
  ctx.fillStyle = '#8fe86b';
  const sName = state.endless ? `ETERNAL AUTUMN ${state.seasonN - 6}` : `SEASON ${state.seasonN} · ${state.seasonDef.name.toUpperCase()}`;
  ctx.fillText(sName, FIELD.x, 84);
  ctx.fillStyle = '#ffd24d';
  ctx.fillText(`WIN: earn ${state.quota}c (${Math.floor(state.quotaEarned)}/${state.quota})`, FIELD.x + 300, 76);
  ctx.fillStyle = '#ff8aa8'; ctx.font = 'bold 12.5px Georgia';
  ctx.fillText('LOSE: quota missed = Blightstorm strips the field', FIELD.x + 300, 94);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 16px Georgia';
  ctx.fillText(`SCORE ${Math.floor(state.score).toLocaleString('en-US')}`, FIELD.x + FIELD.w, 76);
  ctx.fillStyle = state.chain >= 2 ? '#ffd24d' : 'rgba(230,255,215,.65)';
  ctx.font = 'bold 13px Georgia';
  ctx.fillText(state.chain >= 2 ? `HARVEST CHAIN x${state.chain}` : 'chain: harvest fast to build', FIELD.x + FIELD.w, 94);
  // Water & blight, in-canvas twins of the DOM bars.
  ctx.textAlign = 'left'; ctx.font = 'bold 11px Georgia'; ctx.fillStyle = '#7fe8ff';
  ctx.fillText('WATER', FIELD.x, 52 - 6 + 6);
  bar(ctx, FIELD.x + 52, 44, 150, 8, state.water / 100, '#39b8e8');
  ctx.fillStyle = '#c99aff'; ctx.fillText('BLIGHT', FIELD.x + 240, 52);
  bar(ctx, FIELD.x + 296, 44, 150, 8, state.blight / 100, '#a86ae0');
}

function drawShop(ctx, state) {
  ctx.fillStyle = 'rgba(6,10,26,.85)'; rr(ctx, 240, SHOP_Y, 800, 124, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(140,190,255,.3)'; rr(ctx, 240, SHOP_Y, 800, 124, 12); ctx.stroke();
  ctx.fillStyle = '#9fd8b4'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'left';
  ctx.fillText('SEED SHOP — click a seed, then a bed · click a growing crop to water · ripe = harvest', 252, SHOP_Y - 8);
  CROPS.forEach((crop, i) => {
    const r = shopRect(i);
    const sel = state.selectedSeed === i;
    ctx.fillStyle = sel ? 'rgba(255,210,77,.18)' : 'rgba(16,26,54,.9)';
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = sel ? '#ffd24d' : 'rgba(140,190,255,.3)'; ctx.lineWidth = sel ? 3 : 1.5;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
    ctx.fillStyle = crop.color; ctx.beginPath(); ctx.arc(r.x + 20, r.y + 22, 10, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#eaffd8'; ctx.font = 'bold 12.5px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(crop.name, r.x + 36, r.y + 27);
    ctx.font = '12px Georgia'; ctx.fillStyle = state.coins >= crop.seed ? '#ffe9a8' : '#ff8aa8';
    ctx.fillText(`seed ${crop.seed}c · sell ${crop.sell}c`, r.x + 10, r.y + 52);
    ctx.fillStyle = 'rgba(230,255,215,.7)';
    ctx.fillText(`grows ${crop.grow}s · key ${i + 1}`, r.x + 10, r.y + 70);
    ctx.fillStyle = crop.color;
    ctx.fillText(`mut up to x40`, r.x + 10, r.y + 86);
  });
  // Moonphase dial + well.
  ctx.fillStyle = 'rgba(16,26,54,.95)'; rr(ctx, PHASE_RECT.x, PHASE_RECT.y, PHASE_RECT.w, PHASE_RECT.h, 10); ctx.fill();
  ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2; rr(ctx, PHASE_RECT.x, PHASE_RECT.y, PHASE_RECT.w, PHASE_RECT.h, 10); ctx.stroke();
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(`MOONPHASE x${MOONPHASES[state.phaseIdx]} (F)`, PHASE_RECT.x + PHASE_RECT.w / 2, PHASE_RECT.y + 28);
  ctx.fillStyle = 'rgba(16,26,54,.95)'; rr(ctx, WELL_RECT.x, WELL_RECT.y, WELL_RECT.w, WELL_RECT.h, 10); ctx.fill();
  ctx.strokeStyle = '#7fe8ff'; rr(ctx, WELL_RECT.x, WELL_RECT.y, WELL_RECT.w, WELL_RECT.h, 10); ctx.stroke();
  ctx.fillStyle = '#7fe8ff'; ctx.font = 'bold 13px Georgia';
  ctx.fillText('WELL +40 water', WELL_RECT.x + WELL_RECT.w / 2, WELL_RECT.y + 25);
}

function drawPests(ctx, state) {
  for (const p of state.pests) {
    const bob = Math.sin(state.time * 6 + p.phase) * 3;
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 14, 13, 4, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = 'rgba(230,240,255,.5)';
    ctx.beginPath(); ctx.ellipse(p.x - 10, p.y - 6 + bob, 8, 4, -0.6, 0, 6.29); ctx.fill();
    ctx.beginPath(); ctx.ellipse(p.x + 10, p.y - 6 + bob, 8, 4, 0.6, 0, 6.29); ctx.fill();
    ctx.fillStyle = p.def.color;
    ctx.beginPath(); ctx.arc(p.x, p.y + bob, 11, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#0a0f22';
    ctx.beginPath(); ctx.arc(p.x - 3.5, p.y - 2 + bob, 1.8, 0, 6.29); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + 3.5, p.y - 2 + bob, 1.8, 0, 6.29); ctx.fill();
    ctx.fillStyle = p.def.color; ctx.font = 'bold 10.5px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(p.def.name, p.x, p.y - 18 + bob);
  }
}

function drawJuice(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floats) {
    ctx.globalAlpha = state.shotMode ? 1 : Math.max(0, 1 - f.t / f.life);
    ctx.fillStyle = f.color;
    ctx.font = f.big ? 'bold 30px Georgia' : 'bold 17px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  if (state.banner) {
    const b = state.banner;
    const a = state.shotMode ? 1 : Math.min(1, b.timer / (b.max * 0.5));
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(6,8,22,.72)';
    const wdt = Math.max(360, b.text.length * 21);
    rr(ctx, VIEW_W / 2 - wdt / 2, 128, wdt, 52, 14); ctx.fill();
    ctx.strokeStyle = b.color; ctx.lineWidth = 2.5; rr(ctx, VIEW_W / 2 - wdt / 2, 128, wdt, 52, 14); ctx.stroke();
    ctx.fillStyle = b.color; ctx.font = 'bold 27px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(b.text, VIEW_W / 2, 164);
    ctx.globalAlpha = 1;
  }
}

export function drawPlay(ctx, state) {
  drawBackground(ctx, state, false);
  drawTopStrip(ctx, state);
  drawLeftPanel(ctx, state);
  drawRightPanel(ctx, state);
  drawBeds(ctx, state);
  drawPests(ctx, state);
  drawShop(ctx, state);
  drawJuice(ctx, state);
  if (state.paused) {
    ctx.fillStyle = 'rgba(4,6,16,.6)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 44px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2);
  }
}

// --- Title screen (dense: how-to + crop bestiary + pests + difficulties) -----------------
export function drawTitle(ctx, state) {
  drawBackground(ctx, state, true);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fdf3cf'; ctx.font = 'bold 56px Georgia';
  ctx.fillText('MOONMELON ACRES', VIEW_W / 2, 92);
  ctx.fillStyle = '#8fe86b'; ctx.font = 'bold 19px Georgia';
  ctx.fillText('plant, mutate, harvest — 7 seasons · 6 crop lines · 9 beds · 8 talismans · 2 storm bosses · the Locust Moon', VIEW_W / 2, 124);
  // How-to, left.
  ctx.fillStyle = 'rgba(6,10,26,.88)'; rr(ctx, 28, 148, 380, 420, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(140,190,255,.4)'; rr(ctx, 28, 148, 380, 420, 14); ctx.stroke();
  ctx.fillStyle = '#9fd8b4'; ctx.font = 'bold 17px Georgia'; ctx.textAlign = 'left';
  ctx.fillText('HOW TO PLAY', 48, 180);
  ctx.fillStyle = '#eaffd8'; ctx.font = '14.5px Georgia';
  const how = [
    '1. Pick a seed (keys 1-6), click a bed to plant.',
    '2. Crops grow in real time. F = moonphase',
    '    fast-forward x1 / x3 / x6.',
    '3. Click a growing crop to water it (faster,',
    '    safer). Click a RIPE crop to harvest & sell.',
    '4. Weather rolls mutation dice as crops ripen:',
    '    Emberkissed x8 · Frostbloom x15 ·',
    '    Prismripe x40. Mutations are the money.',
    '5. Harvest fast to build a CHAIN — chains',
    '    multiply score into the tens of thousands.',
    '6. WIN: meet the season quota in coins sold.',
    '    LOSE: the clock dies first and the',
    '    Blightstorm strips every standing crop.',
    '7. Between seasons, draft 1 of 3 talismans.',
    '8. Storm seasons: click beds to WARD them',
    '    (12 water). Harvests wound the storm.',
    '9. Click pests to shoo them (+45). After',
    '    season 7: the Eternal Autumn endless mode.',
  ];
  how.forEach((line, i) => ctx.fillText(line, 48, 212 + i * 24));
  // Crop bestiary, centre.
  ctx.fillStyle = 'rgba(6,10,26,.88)'; rr(ctx, 428, 148, 424, 420, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(140,190,255,.4)'; rr(ctx, 428, 148, 424, 420, 14); ctx.stroke();
  ctx.fillStyle = '#9fd8b4'; ctx.font = 'bold 17px Georgia';
  ctx.fillText('CROP BESTIARY — 6 LINES, 4 STAGES EACH', 448, 180);
  CROPS.forEach((c, i) => {
    const yy = 214 + i * 58;
    ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(466, yy - 5, 13, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#eaffd8'; ctx.font = 'bold 15px Georgia';
    ctx.fillText(`${c.name} — seed ${c.seed}c · sell ${c.sell}c · ${c.grow}s`, 488, yy);
    ctx.font = '12.5px Georgia'; ctx.fillStyle = 'rgba(230,255,215,.75)';
    ctx.fillText(`${c.blurb} Stages: ${c.stages.join(' → ')}`, 488, yy + 19);
  });
  // Pests + bosses, right.
  ctx.fillStyle = 'rgba(6,10,26,.88)'; rr(ctx, 872, 148, 380, 420, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,150,150,.4)'; rr(ctx, 872, 148, 380, 420, 14); ctx.stroke();
  ctx.fillStyle = '#ffb0a0'; ctx.font = 'bold 17px Georgia';
  ctx.fillText('FIELD BESTIARY — 6 PESTS, 2 BOSSES', 892, 180);
  PESTS.forEach((p, i) => {
    const yy = 212 + i * 40;
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(908, yy - 4, 9, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#eaffd8'; ctx.font = 'bold 13.5px Georgia';
    ctx.fillText(p.name, 926, yy);
    ctx.font = '12px Georgia'; ctx.fillStyle = 'rgba(230,255,215,.75)';
    ctx.fillText(p.desc, 926, yy + 16);
  });
  ctx.fillStyle = STORMS.blight.color; ctx.font = 'bold 14px Georgia';
  ctx.fillText('BOSS S4 · BLIGHTSTORM — batters unwarded beds', 892, 470);
  ctx.fillStyle = STORMS.locust.color;
  ctx.fillText('BOSS S7 · LOCUST MOON — eats ripe crops first', 892, 494);
  ctx.fillStyle = '#eaffd8'; ctx.font = '12.5px Georgia';
  ctx.fillText('Ward beds with water; every harvest wounds the storm.', 892, 518);
  ctx.fillText('Mutations: Emberkissed x8 · Frostbloom x15 · Prismripe x40', 892, 542);
  // Difficulty chips (click targets, mirrored in main.js).
  DIFFICULTIES.forEach((d, i) => {
    const r = { x: 340 + i * 205, y: 596, w: 190, h: 52 };
    ctx.fillStyle = i === 1 ? 'rgba(255,210,77,.22)' : 'rgba(10,18,40,.9)';
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
    ctx.strokeStyle = i === 1 ? '#ffd24d' : 'rgba(140,190,255,.45)'; ctx.lineWidth = 2;
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.stroke();
    ctx.fillStyle = '#eaffd8'; ctx.font = 'bold 16px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(`${d.name} — quota x${d.quotaMult}`, r.x + r.w / 2, r.y + 24);
    ctx.font = '11.5px Georgia'; ctx.fillStyle = 'rgba(230,255,215,.7)';
    ctx.fillText(d.desc, r.x + r.w / 2, r.y + 42);
  });
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 15px Georgia';
  ctx.fillText('Click a difficulty to start · after season 7, ETERNAL AUTUMN endless mode opens', VIEW_W / 2, 676);
  ctx.fillStyle = 'rgba(230,255,215,.6)'; ctx.font = '13px Georgia';
  ctx.fillText(`best score so far: ${state.best.toLocaleString('en-US')}`, VIEW_W / 2, 700);
}

// --- Draft (meta) screen ---------------------------------------------------------------------
export function draftCardRect(i) {
  return { x: 196 + i * 308, y: 268, w: 280, h: 250 };
}
export function drawDraft(ctx, state) {
  drawPlay(ctx, state);
  ctx.fillStyle = 'rgba(4,6,18,.78)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd24d'; ctx.font = 'bold 40px Georgia';
  ctx.fillText(`SEASON ${state.seasonN} QUOTA MET!`, VIEW_W / 2, 120);
  ctx.fillStyle = '#eaffd8'; ctx.font = '18px Georgia';
  ctx.fillText(`Earned ${Math.floor(state.quotaEarned)} / ${state.quota} coins · score ${Math.floor(state.score).toLocaleString('en-US')} · draft ONE talisman for the road ahead`, VIEW_W / 2, 154);
  ctx.fillStyle = '#9fd8b4'; ctx.font = 'bold 15px Georgia';
  ctx.fillText(`CARRIED TALISMANS: ${state.talismans.length ? state.talismans.map((id) => (TALISMANS.find((t) => t.id === id) || {}).name).join(' · ') : 'none yet'}`, VIEW_W / 2, 196);
  ctx.fillStyle = 'rgba(230,255,215,.75)'; ctx.font = '14px Georgia';
  ctx.fillText(`Next: season ${state.seasonN + 1}${state.seasonN + 1 === 4 ? ' — the BLIGHTSTORM season' : state.seasonN + 1 === 7 ? ' — the LOCUST MOON finale' : ''} · the two unchosen talismans return to the pool`, VIEW_W / 2, 224);
  state.draftChoices.forEach((t, i) => {
    const r = draftCardRect(i);
    ctx.fillStyle = 'rgba(12,20,44,.97)'; rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.fill();
    ctx.strokeStyle = t.color; ctx.lineWidth = 3; rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.stroke();
    ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 62, 34, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#0a0f22'; ctx.font = 'bold 20px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(t.glyph, r.x + r.w / 2, r.y + 70);
    ctx.fillStyle = '#eaffd8'; ctx.font = 'bold 21px Georgia';
    ctx.fillText(t.name, r.x + r.w / 2, r.y + 128);
    ctx.font = '14.5px Georgia'; ctx.fillStyle = 'rgba(230,255,215,.85)'; ctx.textAlign = 'left';
    wrap(ctx, t.desc, r.x + 26, r.y + 162, r.w - 52, 20);
    ctx.fillStyle = t.color; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('CLICK TO DRAFT', r.x + r.w / 2, r.y + r.h - 18);
  });
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 15px Georgia'; ctx.textAlign = 'center';
  ctx.fillText('Talismans stack for the whole run — choose for the season ahead, not the one behind', VIEW_W / 2, 580);
}

// --- End screen ----------------------------------------------------------------------------------
export function drawEnd(ctx, state, rank) {
  drawBackground(ctx, state, true);
  drawBeds(ctx, state);
  ctx.fillStyle = 'rgba(4,6,18,.66)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(8,12,30,.95)'; rr(ctx, 190, 64, 900, 520, 18); ctx.fill();
  ctx.strokeStyle = state.victory ? '#ffd24d' : '#e03a6e'; ctx.lineWidth = 3;
  rr(ctx, 190, 64, 900, 520, 18); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = state.victory ? '#ffd24d' : '#ff8aa8'; ctx.font = 'bold 38px Georgia';
  ctx.fillText(state.victory ? 'THE ACRES BLOOM — ALL 7 SEASONS' : 'THE FIELD IS STRIPPED', VIEW_W / 2, 118);
  ctx.fillStyle = '#eaffd8'; ctx.font = '15.5px Georgia';
  if (state.endWhy) wrap(ctx, state.endWhy, 330, 148, 620, 20);
  // Rank letter.
  ctx.fillStyle = 'rgba(255,210,77,.14)'; ctx.beginPath(); ctx.arc(330, 268, 74, 0, 6.29); ctx.fill();
  ctx.strokeStyle = '#ffd24d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(330, 268, 74, 0, 6.29); ctx.stroke();
  ctx.fillStyle = '#ffd24d'; ctx.font = 'bold 92px Georgia';
  ctx.fillText(rank, 330, 302);
  ctx.font = 'bold 14px Georgia'; ctx.fillStyle = '#9fd8b4';
  ctx.fillText('HARVEST RANK', 330, 366);
  ctx.font = '15px Georgia'; ctx.fillStyle = '#eaffd8';
  ctx.fillText(`best: ${state.best.toLocaleString('en-US')}`, 330, 392);
  ctx.fillText(`difficulty: ${state.diff.name}`, 330, 416);
  ctx.fillText(state.endless ? 'died in the Eternal Autumn' : `reached season ${state.seasonN} of 7`, 330, 442);
  // Final score + stats grid (>= 8 stats).
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 30px Georgia';
  ctx.fillText(`FINAL SCORE ${Math.floor(state.score).toLocaleString('en-US')}`, 470, 218);
  const s = state.stats;
  const rows = [
    ['Seasons cleared', s.seasonsCleared],
    ['Crops planted', s.planted],
    ['Crops harvested', s.harvested],
    ['Mutated harvests', s.mutated],
    ['Prismripe x40 hits', s.prism],
    ['Coins earned (run)', s.coinsEarned.toLocaleString('en-US')],
    ['Best harvest chain', `x${s.bestChain}`],
    ['Pests shooed', s.pestsShooed],
    ['Storm wards placed', s.wards],
    ['Storm bosses survived', s.stormsSurvived],
    ['Talismans drafted', s.talismansDrafted],
    ['Crops lost / stripped', s.stripped],
  ];
  ctx.font = '15.5px Georgia';
  rows.forEach((row, i) => {
    const col = i < 6 ? 0 : 1;
    const yy = 262 + (i % 6) * 34;
    const xx = 470 + col * 300;
    ctx.fillStyle = 'rgba(230,255,215,.75)';
    ctx.fillText(row[0], xx, yy);
    ctx.fillStyle = '#eaffd8'; ctx.font = 'bold 15.5px Georgia'; ctx.textAlign = 'right';
    ctx.fillText(String(row[1]), xx + 272, yy);
    ctx.font = '15.5px Georgia'; ctx.textAlign = 'left';
  });
  // Talisman recap.
  ctx.fillStyle = '#9fd8b4'; ctx.font = 'bold 14px Georgia';
  ctx.fillText(`TALISMANS CARRIED (${state.talismans.length}/8):`, 470, 496);
  ctx.font = '14px Georgia'; ctx.fillStyle = '#eaffd8';
  const names = state.talismans.map((id) => (TALISMANS.find((t) => t.id === id) || {}).name).filter(Boolean);
  ctx.fillText(names.length ? names.join(' · ') : 'none — the field was farmed bare-handed', 470, 522);
  ctx.fillText(`final coins: ${Math.floor(state.coins)} · quota last season: ${Math.floor(state.quotaEarned)}/${state.quota}`, 470, 548);
  // Buttons.
  if (state.victory) {
    ctx.fillStyle = 'rgba(143,232,107,.2)'; rr(ctx, 690, 596, 300, 54, 12); ctx.fill();
    ctx.strokeStyle = '#8fe86b'; ctx.lineWidth = 2.5; rr(ctx, 690, 596, 300, 54, 12); ctx.stroke();
    ctx.fillStyle = '#c9ffb0'; ctx.font = 'bold 17px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('CONTINUE: ETERNAL AUTUMN ∞', 840, 630);
  }
  ctx.fillStyle = 'rgba(255,210,77,.16)'; rr(ctx, 290, 596, 300, 54, 12); ctx.fill();
  ctx.strokeStyle = '#ffd24d'; ctx.lineWidth = 2.5; rr(ctx, 290, 596, 300, 54, 12); ctx.stroke();
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 17px Georgia'; ctx.textAlign = 'center';
  ctx.fillText('CLICK / ENTER — NEW RUN', 440, 630);
}

export function drawGame(ctx, state) {
  // rank is computed in main to avoid a cycle; render reads it off state.
  if (state.mode === 'title') { drawTitle(ctx, state); return; }
  if (state.mode === 'draft') { drawDraft(ctx, state); return; }
  if (state.mode === 'end') { drawEnd(ctx, state, state.rank || 'C'); return; }
  drawPlay(ctx, state);
}
