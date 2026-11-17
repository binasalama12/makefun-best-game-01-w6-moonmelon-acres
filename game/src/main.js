// MOONMELON ACRES — main loop and game state.
//
// Buy seeds, plant them in nine moonlit beds, and let the crops grow in
// real time. Weather rolls the mutation lottery — Emberkissed x8,
// Frostbloom x15, Prismripe x40 — and a mutated harvest is where the money
// and the score live. Chain harvests for combo score, draft a talisman
// between seasons, and meet each season's quota before its clock runs
// out: miss it and the Blightstorm strips the field. Season 4 hides the
// Blightstorm boss and season 7 ends under the Locust Moon; survive both
// with water-wards, then farm forever in the Eternal Autumn.

import {
  CROPS, MUTATIONS, TALISMANS, SEASONS, DIFFICULTIES, SCORE,
  START_COINS, START_WATER, WATER_MAX, PLANT_WATER, WATER_COST, WARD_COST,
  WELL_COST, CHAIN_WINDOW, MOONPHASES, PHASE_RECT, WELL_RECT,
  BANK_RECT, BANK_TIME_BONUS,
} from './config.js';
import { makeBeds, plantBed, clearBed, isRipe, rollMutation, rollWeather, spawnPest, makeStorm } from './world.js';
import { drawGame } from './render.js';
import { updateHud, setMessage } from './hud.js';
import { attachInput, bedAt, seedAt, inRect } from './input.js';
import { initAudio, sfx } from './audio.js';
import { makeRng } from './rng.js';
import { setupShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const BASE_SEED = 20261117;

const state = {
  mode: 'title', // title | play | draft | end
  shotMode: null,
  diff: DIFFICULTIES[1],
  seasonN: 1, seasonDef: SEASONS[0], endless: false,
  seasonTime: 0, quota: 0, quotaEarned: 0,
  coins: START_COINS, water: START_WATER, blight: 0,
  score: 0, best: parseInt(localStorage.getItem('moonmelon-best') || '0', 10) || 0,
  beds: makeBeds(), selectedSeed: 0, phaseIdx: 0,
  talismans: [], draftChoices: [],
  weather: null, weatherNext: null, weatherTimer: 20,
  pests: [], pestTimer: 9,
  chain: 0, chainTimer: 0,
  feed: [], floats: [], particles: [],
  banner: null, // { text, color, timer, max }
  storm: null, stormDone: false,
  victory: false, paused: false, time: 0,
  mouse: { x: 0, y: 0 }, hoverBed: -1,
  stats: freshStats(),
};
window.__moonmelon = state;

function freshStats() {
  return {
    planted: 0, harvested: 0, mutated: 0, prism: 0,
    coinsEarned: 0, pestsShooed: 0, wards: 0, bestChain: 0,
    stormsSurvived: 0, seasonsCleared: 0, talismansDrafted: 0, stripped: 0,
  };
}

const rng = makeRng(BASE_SEED ^ 0x9a17);

export function talismanMods() {
  const has = (id) => state.talismans.includes(id);
  return {
    emberBonus: has('embercharm') ? 0.06 : 0,
    frostBonus: has('frostlocket') ? 0.06 : 0,
    prismBonus: has('prismlens') ? 0.015 : 0,
    sellMult: has('sickle') ? 1.25 : 1,
    growMult: has('moondial') ? 1.2 : 1,
    blightMult: has('blightward') ? 0.65 : 1,
    waterRegen: has('chalice') ? 1.6 : 1,
    wellFree: has('chalice'),
    chainWindow: CHAIN_WINDOW + (has('chainbell') ? 2 : 0),
    chainMult: has('chainbell') ? 2 : 1,
    weather: state.weather ? state.weather.id : 'clear',
  };
}

function pushFeed(text, color) {
  state.feed.unshift({ text, color: color || '#eaffd8', t: 14 });
  if (state.feed.length > 5) state.feed.length = 5;
}
function addFloat(x, y, text, color, big) {
  state.floats.push({ x, y, text, color, t: 0, life: big ? 2.2 : 1.5, big: !!big });
}
function burst(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = rng() * 6.283, s = (0.3 + rng() * 0.7) * (speed || 120);
    state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, t: 0, life: 0.6 + rng() * 0.7, color, r: 2 + rng() * 3 });
  }
}
function setBanner(text, color) {
  state.banner = { text, color, timer: 2.4, max: 2.4 };
}

// --- Run / season flow ---------------------------------------------------------
function quotaFor(n) {
  if (n <= 7) return Math.round(SEASONS[n - 1].quota * state.diff.quotaMult);
  return Math.round(SEASONS[6].quota * state.diff.quotaMult * Math.pow(1.45, n - 7));
}
function secondsFor(n) {
  return n <= 7 ? SEASONS[n - 1].seconds : 200;
}

function startSeason(n) {
  state.seasonN = n;
  state.endless = n > 7;
  state.seasonDef = SEASONS[Math.min(n, 7) - 1];
  state.seasonTime = secondsFor(n);
  state.quota = quotaFor(n);
  state.quotaEarned = 0;
  state.blight = Math.max(0, state.blight - 25);
  state.stormDone = false;
  state.storm = null;
  state.weather = rollWeather(rng, n);
  state.weatherNext = rollWeather(rng, n);
  state.weatherTimer = 18;
  const kind = n <= 7 ? SEASONS[n - 1].storm : (n % 2 === 0 ? 'blight' : 'locust');
  if (kind) {
    state.storm = makeStorm(kind);
    setBanner(state.storm.name + ' INCOMING', state.storm.def.color);
    pushFeed(state.storm.name + ' — ward your beds!', state.storm.def.color);
    sfx.storm();
  }
  setMessage(n <= 7
    ? `Season ${n}: ${state.seasonDef.name} — earn ${state.quota} coins before the clock dies.`
    : `Eternal Autumn ${n - 6} — earn ${state.quota} coins. The farm is yours now.`);
}

function startRun(diffIdx) {
  state.diff = DIFFICULTIES[diffIdx ?? 1] || DIFFICULTIES[1];
  state.coins = START_COINS;
  state.water = START_WATER;
  state.blight = 0;
  state.score = 0;
  state.talismans = [];
  state.beds = makeBeds();
  state.pests = [];
  state.chain = 0; state.chainTimer = 0;
  state.feed = []; state.floats = [];
  state.stats = freshStats();
  state.victory = false;
  state.paused = false;
  startSeason(1);
  state.mode = 'play';
  pushFeed('First Furrow — plant Moonmelons!', '#8fe86b');
}

function endRun(victory, why) {
  state.victory = victory;
  state.rank = rankFor(state.score);
  state.mode = 'end';
  state.endWhy = why || '';
  if (state.score > state.best) {
    state.best = Math.floor(state.score);
    try { localStorage.setItem('moonmelon-best', String(state.best)); } catch { /* private mode */ }
  }
  if (victory) sfx.clear(); else sfx.over();
}

export function rankFor(score) {
  if (score >= 55000) return 'S';
  if (score >= 42000) return 'A';
  if (score >= 30000) return 'B';
  if (score >= 18000) return 'C';
  if (score >= 8000) return 'D';
  return 'E';
}

function seasonCleared() {
  state.stats.seasonsCleared++;
  state.score += SCORE.seasonClear;
  if (state.storm && !state.storm.driven) { state.stats.stormsSurvived++; }
  sfx.clear();
  if (state.seasonN >= 7 && !state.endless) { endRun(true, 'All seven seasons harvested. The Locust Moon fled your fields.'); return; }
  // Draft 1-of-3 talismans: the meta screen between seasons.
  const owned = new Set(state.talismans);
  const pool = TALISMANS.filter((t) => !owned.has(t.id));
  state.draftChoices = [];
  while (state.draftChoices.length < 3 && pool.length) {
    const i = Math.floor(rng() * pool.length);
    state.draftChoices.push(pool.splice(i, 1)[0]);
  }
  if (!state.draftChoices.length) { state.coins += 150; startSeason(state.seasonN + 1); return; }
  state.mode = 'draft';
  sfx.draft();
  setMessage('Season quota met! Draft one talisman to carry into the next season.');
}

// Bank the season: once the quota is met the player may end the season
// immediately instead of idling out the clock. Leftover seconds convert
// to score, then the normal clear flow runs (draft, or the victory end).
function bankSeason() {
  if (state.mode !== 'play' || state.quotaEarned < state.quota) return;
  const bonus = Math.ceil(Math.max(0, state.seasonTime)) * BANK_TIME_BONUS;
  state.score += bonus;
  pushFeed(`Season banked early — +${bonus} time bonus`, '#ffd24d');
  seasonCleared();
}

function seasonFailed() {
  // The Blightstorm strips the field: every standing crop is lost.
  for (const b of state.beds) if (b.crop !== null) { state.stats.stripped++; clearBed(b); }
  endRun(false, `Quota missed in season ${state.seasonN} — the Blightstorm stripped the field.`);
}

// --- Economy actions -------------------------------------------------------------
function tryPlant(bed) {
  const crop = CROPS[state.selectedSeed];
  if (bed.crop !== null) return;
  if (state.coins < crop.seed) { setMessage(`Not enough coins for ${crop.name} seed (${crop.seed}).`); state.messageT = 2; return; }
  if (state.water < PLANT_WATER) { setMessage('The soil is dust — draw water at the well first.'); state.messageT = 2; return; }
  state.coins -= crop.seed;
  state.water -= PLANT_WATER;
  plantBed(bed, state.selectedSeed);
  bed.watered = Math.max(bed.watered, 5);
  state.stats.planted++;
  burst(bed.x + bed.w / 2, bed.y + bed.h / 2, '#8fe86b', 7, 80);
  sfx.plant();
}

function tryWater(bed) {
  if (bed.crop === null) return;
  if (state.water < WATER_COST) { setMessage('Not enough water — the well sells +40 for coins.'); state.messageT = 2; return; }
  state.water -= WATER_COST;
  bed.watered = 10;
  if (bed.frozen > 0) bed.frozen = 0;
  burst(bed.x + bed.w / 2, bed.y + 30, '#7fe8ff', 10, 90);
  sfx.water();
}

function tryWard(bed) {
  if (bed.warded) { bed.warded = false; return; }
  if (state.water < WARD_COST) { setMessage('A ward costs 12 water.'); state.messageT = 2; return; }
  state.water -= WARD_COST;
  bed.warded = true;
  state.stats.wards++;
  burst(bed.x + bed.w / 2, bed.y + bed.h / 2, '#bfefff', 12, 100);
  sfx.ward();
}

function harvest(bed) {
  const crop = CROPS[bed.crop];
  const mods = talismanMods();
  const mut = bed.mutation ? MUTATIONS[bed.mutation] : null;
  const mult = mut ? mut.mult : 1;
  const coinsGain = Math.round(crop.sell * mult * mods.sellMult);
  const quotaWasMet = state.quotaEarned >= state.quota;
  state.coins += coinsGain;
  state.quotaEarned += coinsGain;
  if (!quotaWasMet && state.quotaEarned >= state.quota && state.mode === 'play') {
    // The season is won the moment the quota lands — say so, and offer the
    // bank: end it now and turn the leftover clock into score.
    setBanner('QUOTA MET — BANK IT (B)!', '#ffd24d');
    pushFeed('Quota met! Click the WIN block or press B to bank the season.', '#ffd24d');
  }
  state.stats.coinsEarned += coinsGain;
  state.stats.harvested++;
  if (mut) {
    state.stats.mutated++;
    if (mut.id === 'prism') state.stats.prism++;
    state.score += SCORE.mutationBonus[mut.id];
  }
  // Harvest chain: quick successive harvests multiply the score.
  state.chain = state.chainTimer > 0 ? state.chain + 1 : 1;
  state.chainTimer = mods.chainWindow;
  state.stats.bestChain = Math.max(state.stats.bestChain, state.chain);
  const chainBonus = 1 + (state.chain - 1) * SCORE.chainStep * mods.chainMult;
  const gain = Math.round(coinsGain * SCORE.harvestBase * chainBonus / 10);
  state.score += gain;
  const cx = bed.x + bed.w / 2, cy = bed.y + 26;
  addFloat(cx, cy, `+${coinsGain}c`, mut ? mut.color : '#ffe9a8', !!mut);
  if (state.chain >= 3) addFloat(cx, cy + 30, `CHAIN x${state.chain}`, '#ffd24d', false);
  burst(cx, bed.y + bed.h / 2, mut ? mut.color : crop.color, mut ? 26 : 12, mut ? 190 : 120);
  if (mut) { setBanner(`${mut.name.toUpperCase()} x${mut.mult}!`, mut.color); sfx.mutate(mut.id); }
  else sfx.sell();
  // Harvests wound an active storm boss.
  if (state.storm && !state.storm.driven) {
    state.storm.hp -= coinsGain;
    state.score += Math.round(coinsGain * SCORE.stormHit / 10);
    if (state.storm.hp <= 0) driveStormOff();
  }
  clearBed(bed);
}

function driveStormOff() {
  const st = state.storm;
  st.driven = true;
  state.score += SCORE.stormDown;
  state.stats.stormsSurvived++;
  setBanner(st.name + ' DRIVEN OFF!', st.def.color);
  pushFeed(`${st.name} driven off by harvests! +${SCORE.stormDown}`, st.def.color);
  for (const b of state.beds) b.warded = false;
  state.storm = null;
  sfx.clear();
}

function tryWell() {
  const mods = talismanMods();
  const cost = mods.wellFree ? 0 : WELL_COST;
  if (state.water >= WATER_MAX - 1) { setMessage('The water bar is full.'); state.messageT = 2; return; }
  if (state.coins < cost) { setMessage(`The well wants ${WELL_COST} coins.`); state.messageT = 2; return; }
  state.coins -= cost;
  state.water = Math.min(WATER_MAX, state.water + 40);
  sfx.water();
}

// --- Simulation ---------------------------------------------------------------------
function growBeds(dt) {
  const mods = talismanMods();
  const phase = MOONPHASES[state.phaseIdx];
  const showerBoost = state.weather && state.weather.id === 'shower' ? 1.4 : 1;
  for (const bed of state.beds) {
    if (bed.watered > 0) bed.watered -= dt;
    if (bed.frozen > 0) bed.frozen -= dt;
    if (bed.blessed > 0) bed.blessed -= dt;
    if (bed.scorch > 0) bed.scorch -= dt;
    if (bed.crop === null) continue;
    if (bed.frozen > 0) continue;
    const crop = CROPS[bed.crop];
    let rate = (dt * phase * mods.growMult * showerBoost) / crop.grow;
    if (bed.watered > 0) rate *= 1.5;
    if (bed.scorch > 0) rate *= -0.6; // an imp's scorch eats growth back
    bed.growth = Math.max(0, Math.min(1, bed.growth + rate));
    if (bed.growth >= 1 && !bed.mutRolled) {
      bed.mutRolled = true;
      const m = rollMutation(rng, bed, mods);
      if (!m) {
        // A plain ripening still gets its moment: a gold burst over the bed
        // and a feed line, so the harvest window never opens silently.
        burst(bed.x + bed.w / 2, bed.y + 40, '#ffd24d', 10, 110);
        pushFeed(`${crop.name} is ripe — harvest it!`, '#ffd24d');
      }
      if (m) {
        bed.mutation = m;
        const mut = MUTATIONS[m];
        setBanner(`${mut.name.toUpperCase()} x${mut.mult}!`, mut.color);
        pushFeed(`${crop.name} ripened ${mut.name} x${mut.mult}`, mut.color);
        burst(bed.x + bed.w / 2, bed.y + 40, mut.color, 22, 170);
        sfx.mutate(m);
      }
    }
    // A ripe crop keeps re-rolling on weather ticks handled in rollWeatherNow;
    // a growing crop near ripe can also catch a late mutation from rain.
    if (!bed.mutation && bed.growth > 0.8 && state.weather && state.weather.id === 'prismrain' && rng() < dt * 0.05) {
      bed.mutation = 'prism';
      setBanner('PRISMRIPE x40!', MUTATIONS.prism.color);
      pushFeed(`${crop.name} caught Prism Rain — PRISMRIPE x40`, MUTATIONS.prism.color);
    }
  }
}

function rollWeatherNow() {
  state.weather = state.weatherNext || rollWeather(rng, state.seasonN);
  state.weatherNext = rollWeather(rng, state.seasonN);
  state.weatherTimer = 16 + rng() * 8;
  const w = state.weather;
  pushFeed(`Weather: ${w.name} — ${w.desc}`, w.color);
  if (w.id === 'shower') state.water = Math.min(WATER_MAX, state.water + 24);
  if (w.id === 'blightcreep') {
    state.blight = Math.min(100, state.blight + 10 * talismanMods().blightMult);
    state.pestTimer = Math.min(state.pestTimer, 2);
  }
  // Every weather change is a fresh mutation tick for near-ripe crops.
  const mods = talismanMods();
  for (const bed of state.beds) {
    if (bed.crop !== null && !bed.mutation && bed.growth > 0.55) {
      const m = rollMutation(rng, bed, mods);
      if (m) {
        bed.mutation = m;
        const mut = MUTATIONS[m];
        pushFeed(`${CROPS[bed.crop].name} turned ${mut.name} x${mut.mult} in the ${w.name}`, mut.color);
        burst(bed.x + bed.w / 2, bed.y + 40, mut.color, 16, 150);
      }
    }
  }
}

function updatePests(dt) {
  state.pestTimer -= dt;
  const cadence = state.storm ? 5 : 11;
  if (state.pestTimer <= 0) {
    state.pests.push(spawnPest(rng, state.beds, state.seasonN, state.storm ? state.storm.kind : null));
    state.pestTimer = cadence * (0.7 + rng() * 0.6);
  }
  for (let i = state.pests.length - 1; i >= 0; i--) {
    const p = state.pests[i];
    const bed = state.beds[p.targetBed];
    const tx = bed.x + bed.w / 2, ty = bed.y + bed.h / 2;
    const dx = tx - p.x, dy = ty - p.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 26) {
      p.x += (dx / d) * p.def.speed * dt;
      p.y += (dy / d) * p.def.speed * dt + Math.sin(state.time * 3 + p.phase) * 12 * dt;
      continue;
    }
    // Arrived: act once, by kind.
    if (!p.acted) {
      p.acted = true;
      if (p.kind === 'aphid' && bed.crop !== null) { bed.growth = Math.max(0, bed.growth - 0.25); pushFeed('Gloom Aphid drained a bed!', '#9ab86a'); }
      if (p.kind === 'locust' && isRipe(bed)) { clearBed(bed); state.stats.stripped++; pushFeed('Locust Scout stripped a ripe crop!', '#d8b84d'); burst(tx, ty, '#d8b84d', 14, 130); }
      if (p.kind === 'wisp') { state.blight = Math.min(100, state.blight + 7 * talismanMods().blightMult); pushFeed('Blight Wisp fed the blight bar!', '#b49aff'); }
      if (p.kind === 'sprite' && bed.crop !== null) { bed.frozen = 7; pushFeed('Frost Sprite froze a bed solid!', '#bfefff'); }
      if (p.kind === 'imp' && bed.crop !== null && bed.watered <= 0) { bed.scorch = 6; pushFeed('Ember Imp scorched a dry bed!', '#ff6a3d'); }
      if (p.kind === 'moth' && bed.crop !== null) { bed.blessed = 12; pushFeed('Prism Moth blessed a bed — rolls double!', '#ff7ae8'); }
    }
    p.dwell += dt;
    if (p.dwell > 2.5) state.pests.splice(i, 1);
  }
}

function updateStorm(dt) {
  const st = state.storm;
  if (!st || st.driven) return;
  st.timer -= dt;
  st.hitTimer -= dt;
  if (st.hitTimer <= 0) {
    st.hitTimer = st.def.hitEvery;
    st.strikes++;
    // The storm hunts unwarded beds, ripe first.
    const targets = state.beds.filter((b) => b.crop !== null && !b.warded);
    const ripe = targets.filter((b) => isRipe(b));
    const victim = (ripe.length ? ripe : targets)[Math.floor(rng() * Math.max(1, (ripe.length ? ripe : targets).length))];
    if (victim) {
      const loss = talismanMods().blightMult < 1 ? 0.3 : 0.55;
      if (isRipe(victim) && st.kind === 'locust') { clearBed(victim); state.stats.stripped++; pushFeed('The Locust Moon ate a ripe crop!', '#ffd24d'); }
      else { victim.growth = Math.max(0, victim.growth - loss); pushFeed(`${st.name} battered a bed!`, st.def.color); }
      burst(victim.x + victim.w / 2, victim.y + victim.h / 2, st.def.color, 18, 170);
      sfx.strike();
    }
    // Warded beds block the hit entirely and shake the storm.
    const warded = state.beds.filter((b) => b.warded);
    if (!targets.length && warded.length) { st.hp -= 60; if (st.hp <= 0) { driveStormOff(); return; } }
  }
  if (st.timer <= 0) {
    state.stats.stormsSurvived++;
    pushFeed(`${st.name} blew itself out. The field stands.`, st.def.color);
    for (const b of state.beds) b.warded = false;
    state.storm = null;
  }
}

function update(dt) {
  state.time += dt;
  if (state.banner && !state.shotMode) { state.banner.timer -= dt; if (state.banner.timer <= 0) state.banner = null; }
  for (let i = state.floats.length - 1; i >= 0; i--) {
    const f = state.floats[i];
    if (!state.shotMode) { f.t += dt; f.y -= 34 * dt; if (f.t > f.life) state.floats.splice(i, 1); }
  }
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt;
    if (p.t > p.life) state.particles.splice(i, 1);
  }
  for (const f of state.feed) f.t -= dt;
  if (state.mode !== 'play' || state.paused) return;

  state.seasonTime -= dt;
  state.weatherTimer -= dt;
  if (state.weatherTimer <= 0) rollWeatherNow();
  if (state.chainTimer > 0) { state.chainTimer -= dt; if (state.chainTimer <= 0) state.chain = 0; }

  // Water slowly returns from the dew; blight creeps with the season.
  const mods = talismanMods();
  state.water = Math.min(WATER_MAX, state.water + dt * 0.55 * mods.waterRegen);
  const blightRate = (state.seasonN >= 5 ? 0.22 : 0.12) * (state.diff.id === 'blight' ? 1.5 : 1) * mods.blightMult;
  state.blight = Math.min(100, state.blight + dt * blightRate * (state.storm ? 2.2 : 1));
  if (state.blight >= 100) {
    // Blight peak: it eats the weakest standing crop and recedes.
    const standing = state.beds.filter((b) => b.crop !== null);
    if (standing.length) { const v = standing[Math.floor(rng() * standing.length)]; clearBed(v); state.stats.stripped++; pushFeed('Blight peak consumed a crop!', '#b49aff'); }
    state.blight = 62;
  }

  growBeds(dt);
  updatePests(dt);
  updateStorm(dt);

  if (state.seasonTime <= 0) {
    if (state.quotaEarned >= state.quota) seasonCleared();
    else seasonFailed();
  }
}

// --- Input ----------------------------------------------------------------------------
function draftCardRect(i) {
  return { x: 196 + i * 308, y: 268, w: 280, h: 250 };
}

function handleTap(x, y) {
  initAudio();
  if (state.shotMode) return;
  if (state.mode === 'title') {
    // Difficulty chips on the title screen.
    for (let i = 0; i < 3; i++) {
      if (inRect(x, y, { x: 340 + i * 205, y: 596, w: 190, h: 52 })) { startRun(i); return; }
    }
    startRun(1);
    return;
  }
  if (state.mode === 'end') {
    if (state.victory && inRect(x, y, { x: 690, y: 596, w: 300, h: 54 })) {
      // Eternal Autumn: keep the farm, the talismans and the score.
      state.endless = true;
      startSeason(8);
      state.mode = 'play';
      return;
    }
    startRun(DIFFICULTIES.indexOf(state.diff));
    return;
  }
  if (state.mode === 'draft') {
    for (let i = 0; i < state.draftChoices.length; i++) {
      if (inRect(x, y, draftCardRect(i))) {
        state.talismans.push(state.draftChoices[i].id);
        state.stats.talismansDrafted++;
        pushFeed(`Talisman drafted: ${state.draftChoices[i].name}`, state.draftChoices[i].color);
        sfx.draft();
        startSeason(state.seasonN + 1);
        state.mode = 'play';
        return;
      }
    }
    return;
  }
  if (state.mode !== 'play' || state.paused) return;

  // A met quota turns the top-strip WIN block into the bank button.
  if (state.quotaEarned >= state.quota && inRect(x, y, BANK_RECT)) { bankSeason(); return; }
  // Pests first: a tap on a pest shoos it.
  for (let i = state.pests.length - 1; i >= 0; i--) {
    const p = state.pests[i];
    if (Math.hypot(p.x - x, p.y - y) < 30) {
      if (p.kind === 'moth') { setMessage('The Prism Moth is a friend — let it land!'); state.messageT = 2; return; }
      state.pests.splice(i, 1);
      state.score += SCORE.pestShoo;
      state.stats.pestsShooed++;
      addFloat(p.x, p.y, `+${SCORE.pestShoo}`, '#eaffd8', false);
      burst(p.x, p.y, p.def.color, 10, 120);
      sfx.shoo();
      return;
    }
  }
  if (inRect(x, y, PHASE_RECT)) {
    state.phaseIdx = (state.phaseIdx + 1) % MOONPHASES.length;
    setMessage(`Moonphase x${MOONPHASES[state.phaseIdx]} — growth runs ${MOONPHASES[state.phaseIdx]}x.`);
    state.messageT = 2;
    sfx.water();
    return;
  }
  if (inRect(x, y, WELL_RECT)) { tryWell(); return; }
  const si = seedAt(x, y);
  if (si >= 0) { state.selectedSeed = si; sfx.plant(); return; }
  const bi = bedAt(x, y);
  if (bi >= 0) {
    const bed = state.beds[bi];
    if (state.storm) { if (bed.crop !== null && !isRipe(bed)) { tryWard(bed); return; } if (isRipe(bed)) { harvest(bed); return; } }
    if (isRipe(bed)) { harvest(bed); return; }
    if (bed.crop === null) { tryPlant(bed); return; }
    tryWater(bed);
  }
}

attachInput(canvas, {
  onMove(x, y) { state.mouse = { x, y }; state.hoverBed = bedAt(x, y); },
  onTap: handleTap,
  onKey(code) {
    initAudio();
    if (state.shotMode) return;
    if (code === 'Enter' || code === 'Space') {
      if (state.mode === 'title') startRun(1);
      else if (state.mode === 'end') startRun(DIFFICULTIES.indexOf(state.diff));
      return;
    }
    if (state.mode !== 'play') return;
    if (code === 'KeyP') { state.paused = !state.paused; return; }
    if (code === 'KeyB') { bankSeason(); return; }
    if (code === 'KeyR') { startRun(DIFFICULTIES.indexOf(state.diff)); return; }
    if (code === 'KeyF') { state.phaseIdx = (state.phaseIdx + 1) % MOONPHASES.length; return; }
    if (code.startsWith('Digit')) {
      const n = parseInt(code.slice(5), 10);
      if (n >= 1 && n <= 6) state.selectedSeed = n - 1;
      return;
    }
    if (code === 'KeyW' && state.hoverBed >= 0) {
      const bed = state.beds[state.hoverBed];
      if (state.storm && bed.crop !== null && !isRipe(bed)) tryWard(bed);
      else tryWater(bed);
    }
  },
});

// --- Boot & shot scenes -------------------------------------------------------------------
const api = {
  startRun, startSeason, endRun, bankSeason,
  draftCardRect,
  plantShowcase(i, cropIdx, growth, mutation) {
    const bed = state.beds[i];
    plantBed(bed, cropIdx);
    bed.growth = growth;
    bed.mutation = mutation;
    bed.mutRolled = growth >= 1;
    return bed;
  },
  setBanner, pushFeed, addFloat,
};
if (!setupShotScene(state, api)) {
  state.mode = 'title';
}
window.__moonmelonApi = api;

let last = performance.now();
let shotFrame = 0;
const SHOT_FREEZE_FRAME = 90; // 1.5 simulated seconds, then the scene holds (fixed steps stay deterministic even on slow headless renderers)
function frame(now) {
  if (state.shotMode) {
    if (shotFrame < SHOT_FREEZE_FRAME) {
      shotFrame++;
      update(1 / 60);
      if (shotFrame === SHOT_FREEZE_FRAME) {
        state.particles = [];
        window.__shotReady = true;
      }
    }
    drawGame(ctx, state);
    updateHud(state);
    requestAnimationFrame(frame);
    return;
  }
  const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
  last = now;
  update(dt);
  drawGame(ctx, state);
  updateHud(state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
