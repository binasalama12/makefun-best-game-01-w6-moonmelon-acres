// MOONMELON ACRES — world building: the nine beds, weather rolling, the
// mutation lottery, pest spawning and the two storm bosses. All randomness
// flows through the seeded rng handed in by main, so a seed always grows
// the same farm.

import { CROPS, MUTATIONS, WEATHERS, WEATHER_KEYS, PESTS, STORMS, bedRect } from './config.js';
import { pick } from './rng.js';

export function makeBeds() {
  const beds = [];
  for (let i = 0; i < 9; i++) {
    const r = bedRect(i);
    beds.push({
      id: i, x: r.x, y: r.y, w: r.w, h: r.h,
      crop: null,        // index into CROPS once planted
      growth: 0,         // 0..1 toward ripe
      mutation: null,    // key into MUTATIONS once the lottery lands
      mutRolled: false,  // the ripen roll has happened
      watered: 0,        // seconds of watered growth boost left
      frozen: 0,         // seconds frozen by a Frost Sprite
      blessed: 0,        // seconds of Prism Moth blessing (rolls double)
      warded: false,     // storm shield is up
      scorch: 0,         // seconds of Ember Imp scorch damage
    });
  }
  return beds;
}

export function plantBed(bed, cropIdx) {
  bed.crop = cropIdx;
  bed.growth = 0;
  bed.mutation = null;
  bed.mutRolled = false;
  bed.frozen = 0;
  bed.scorch = 0;
}

export function clearBed(bed) {
  bed.crop = null;
  bed.growth = 0;
  bed.mutation = null;
  bed.mutRolled = false;
  bed.watered = 0;
  bed.frozen = 0;
  bed.blessed = 0;
  bed.scorch = 0;
}

export function cropStage(bed) {
  if (bed.crop === null) return -1;
  if (bed.growth >= 1) return 3;
  if (bed.growth >= 0.62) return 2;
  if (bed.growth >= 0.28) return 1;
  return 0;
}

export function isRipe(bed) {
  return bed.crop !== null && bed.growth >= 1;
}

// The mutation lottery. Chances come from the crop's own table, then the
// weather, talismans and a Prism Moth blessing bend them. Highest tier wins.
export function rollMutation(rng, bed, mods) {
  const crop = CROPS[bed.crop];
  let ember = crop.mut.ember + (mods.emberBonus || 0);
  let frost = crop.mut.frost + (mods.frostBonus || 0);
  let prism = crop.mut.prism + (mods.prismBonus || 0);
  if (mods.weather === 'emberwind') ember *= 2;
  if (mods.weather === 'frostfall') frost *= 2;
  if (mods.weather === 'prismrain') prism *= 3;
  if (bed.blessed > 0) { ember *= 2; frost *= 2; prism *= 2; }
  const roll = rng();
  if (roll < prism) return 'prism';
  if (roll < prism + frost) return 'frost';
  if (roll < prism + frost + ember) return 'ember';
  return null;
}

export function rollWeather(rng, seasonN) {
  // Prism Rain stays rare; Blight Creep leans in as the seasons darken.
  const bag = ['clear', 'clear', 'shower', 'shower', 'emberwind', 'frostfall', 'prismrain'];
  if (seasonN >= 3) bag.push('blightcreep');
  if (seasonN >= 5) bag.push('blightcreep', 'emberwind', 'frostfall');
  return WEATHERS[pick(rng, bag)] || WEATHERS.clear;
}

export function nextWeatherKey(rng, seasonN) {
  const bag = [...WEATHER_KEYS, 'clear', 'shower'];
  if (seasonN < 3) return pick(rng, bag.filter((k) => k !== 'blightcreep'));
  return pick(rng, bag);
}

// --- Pests ---------------------------------------------------------------------
let pestSeq = 1;
export function spawnPest(rng, beds, seasonN, stormKind) {
  // Locust Moon breeds Locust Scouts; Blight Creep breeds Wisps.
  let pool = PESTS.map((p) => p.id);
  if (stormKind === 'locust') pool = ['locust', 'locust', 'aphid', 'imp', 'moth'];
  else if (stormKind === 'blight') pool = ['wisp', 'wisp', 'aphid', 'sprite', 'moth'];
  else if (seasonN <= 1) pool = ['aphid', 'moth', 'sprite'];
  const def = PESTS.find((p) => p.id === pick(rng, pool)) || PESTS[0];
  const fromLeft = rng() < 0.5;
  const target = beds[Math.floor(rng() * beds.length)];
  return {
    uid: pestSeq++, kind: def.id, def,
    x: fromLeft ? 210 : 1070, y: 130 + rng() * 360,
    vx: 0, vy: 0, phase: rng() * 6.28,
    targetBed: target ? target.id : 0, dwell: 0, acted: false,
  };
}

// --- Storm bosses ------------------------------------------------------------------
export function makeStorm(kind) {
  const def = STORMS[kind];
  if (!def) return null;
  return {
    kind, def, name: def.name,
    hp: def.hp, maxHp: def.hp,
    timer: def.seconds, hitTimer: 3,
    strikes: 0, driven: false,
  };
}
