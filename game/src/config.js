// MOONMELON ACRES configuration: the moonlit farm, its six crop lines, the
// mutation lottery, eight talismans, seven seasons, six pest types and the
// two storm bosses. Everything the game claims in its title lives here as
// real data the simulation actually uses.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 46;

// The garden field: nine moonlit beds in a 3x3 plot, with a shop bar below
// and system panels left and right.
export const FIELD = { x: 252, y: 118, w: 776, h: 408 };
export const BED_COLS = 3;
export const BED_ROWS = 3;
export const BED_W = 224;
export const BED_H = 112;
export const BED_GAP_X = 52;
export const BED_GAP_Y = 36;
export const SHOP_Y = 556;
export const SHOP_H = 108;
export const MOONPHASES = [1, 3, 6]; // fast-forward speeds: Calm, Waxing, Full Moon

export function bedRect(i) {
  const col = i % BED_COLS;
  const row = Math.floor(i / BED_COLS);
  return {
    x: FIELD.x + col * (BED_W + BED_GAP_X),
    y: FIELD.y + row * (BED_H + BED_GAP_Y),
    w: BED_W, h: BED_H,
  };
}
export function shopRect(i) {
  return { x: 252 + i * 130, y: SHOP_Y + 8, w: 122, h: 92 };
}
export const PHASE_RECT = { x: 1060, y: SHOP_Y + 8, w: 168, h: 44 };
export const WELL_RECT = { x: 1060, y: SHOP_Y + 60, w: 168, h: 40 };

// --- Mutations: the lottery that makes the score --------------------------------
// A crop rolls its mutation table as it ripens and again on every weather
// tick while ripe-adjacent. A mutation multiplies the sell price.
export const MUTATIONS = {
  ember: { id: 'ember', name: 'Emberkissed', mult: 8, color: '#ff8a3d', glow: 'rgba(255,122,61,.55)' },
  frost: { id: 'frost', name: 'Frostbloom', mult: 15, color: '#7fe8ff', glow: 'rgba(127,232,255,.55)' },
  prism: { id: 'prism', name: 'Prismripe', mult: 40, color: '#ff7ae8', glow: 'rgba(255,122,232,.6)' },
};

// --- The six crop lines ------------------------------------------------------------
// grow = seconds from seed to ripe at moonphase x1 on a watered bed.
// mut = base chance (per ripen roll) for each mutation tier.
export const CROPS = [
  { id: 'melon', name: 'Moonmelon', seed: 12, sell: 40, grow: 16, color: '#8fe86b', dark: '#3f8a3d', fruit: 'melon',
    stages: ['seed', 'sprout', 'vine', 'ripe'], mut: { ember: 0.05, frost: 0.03, prism: 0.008 },
    blurb: 'The house crop. Fast, forgiving, loves moonlight.' },
  { id: 'pepper', name: 'Ember Pepper', seed: 20, sell: 58, grow: 21, color: '#ff6a3d', dark: '#a83a1f', fruit: 'pepper',
    stages: ['seed', 'sprout', 'blaze', 'ripe'], mut: { ember: 0.14, frost: 0.02, prism: 0.010 },
    blurb: 'Born for Emberwind. Kisses back, often.' },
  { id: 'berry', name: 'Frostberry', seed: 28, sell: 76, grow: 25, color: '#7fb8ff', dark: '#3d5aa8', fruit: 'berry',
    stages: ['seed', 'sprout', 'chill', 'ripe'], mut: { ember: 0.02, frost: 0.13, prism: 0.012 },
    blurb: 'Waits for Frostfall, then freezes gold.' },
  { id: 'turnip', name: 'Star Turnip', seed: 40, sell: 104, grow: 30, color: '#e8d88a', dark: '#8a7a3d', fruit: 'turnip',
    stages: ['seed', 'sprout', 'starleaf', 'ripe'], mut: { ember: 0.06, frost: 0.06, prism: 0.016 },
    blurb: 'Even odds, honest pay, a gambler root.' },
  { id: 'pumpkin', name: 'Prism Pumpkin', seed: 65, sell: 168, grow: 38, color: '#ffb347', dark: '#a86a1f', fruit: 'pumpkin',
    stages: ['seed', 'sprout', 'greatvine', 'ripe'], mut: { ember: 0.05, frost: 0.05, prism: 0.030 },
    blurb: 'Slow and huge. The prism magnet of the field.' },
  { id: 'orchid', name: 'Void Orchid', seed: 100, sell: 260, grow: 47, color: '#c99aff', dark: '#6a3da8', fruit: 'orchid',
    stages: ['seed', 'sprout', 'voidbloom', 'ripe'], mut: { ember: 0.07, frost: 0.07, prism: 0.022 },
    blurb: 'Drinks blight and blooms anyway. Top price.' },
];

// --- The eight talismans -------------------------------------------------------------
// Drafted 1-of-3 between seasons. Every effect is wired into the simulation.
export const TALISMANS = [
  { id: 'chalice', name: 'Dew Chalice', glyph: 'CH', color: '#7fe8ff', desc: 'Water refills +60% faster and the well is free.' },
  { id: 'embercharm', name: 'Ember Charm', glyph: 'EC', color: '#ff8a3d', desc: 'Emberkissed chance +6% on every crop.' },
  { id: 'frostlocket', name: 'Frost Locket', glyph: 'FL', color: '#bfefff', desc: 'Frostbloom chance +6% on every crop.' },
  { id: 'prismlens', name: 'Prism Lens', glyph: 'PL', color: '#ff7ae8', desc: 'Prismripe chance +1.5% on every crop.' },
  { id: 'sickle', name: 'Golden Sickle', glyph: 'GS', color: '#ffd24d', desc: 'Every sale pays +25% more coins.' },
  { id: 'moondial', name: 'Moon Dial', glyph: 'MD', color: '#ffe9a8', desc: 'All crops grow 20% faster, in every moonphase.' },
  { id: 'blightward', name: 'Blight Ward', glyph: 'BW', color: '#b49aff', desc: 'Blight builds 35% slower; storm hits cost half.' },
  { id: 'chainbell', name: 'Chain Bell', glyph: 'CB', color: '#8fe86b', desc: 'Harvest chain window +2s and chain bonus doubled.' },
];

// --- Weather ---------------------------------------------------------------------------
// Rolled ahead: the incoming panel always shows the NEXT weather and its ETA.
export const WEATHERS = {
  clear: { id: 'clear', name: 'Clear Moon', color: '#ffe9a8', desc: 'Steady growth under a clean sky.' },
  shower: { id: 'shower', name: 'Moonshower', color: '#7fe8ff', desc: 'Rain: +24 water, growth +40% while it falls.' },
  emberwind: { id: 'emberwind', name: 'Emberwind', color: '#ff8a3d', desc: 'Hot wind: Emberkissed rolls double.' },
  frostfall: { id: 'frostfall', name: 'Frostfall', color: '#bfefff', desc: 'Cold snap: Frostbloom rolls double.' },
  prismrain: { id: 'prismrain', name: 'Prism Rain', color: '#ff7ae8', desc: 'Rare rain: Prismripe rolls triple.' },
  blightcreep: { id: 'blightcreep', name: 'Blight Creep', color: '#b49aff', desc: 'Purple fog: blight +10, pests stir.' },
};
export const WEATHER_KEYS = ['clear', 'shower', 'emberwind', 'frostfall', 'prismrain', 'blightcreep'];

// --- Pests: six named actors with distinct behaviour -------------------------------------
export const PESTS = [
  { id: 'aphid', name: 'Gloom Aphid', color: '#9ab86a', desc: 'Crawls to a bed and drains its growth.', speed: 26 },
  { id: 'locust', name: 'Locust Scout', color: '#d8b84d', desc: 'Dives on ripe crops and strips them bare.', speed: 62 },
  { id: 'wisp', name: 'Blight Wisp', color: '#b49aff', desc: 'Haunts the field edge, feeding the blight bar.', speed: 18 },
  { id: 'sprite', name: 'Frost Sprite', color: '#bfefff', desc: 'Freezes one bed solid; growth stops cold.', speed: 34 },
  { id: 'imp', name: 'Ember Imp', color: '#ff6a3d', desc: 'Scorches dry beds; watered beds shake it off.', speed: 44 },
  { id: 'moth', name: 'Prism Moth', color: '#ff7ae8', desc: 'A friend: where it lands, mutation rolls double.', speed: 30 },
];

// --- Seasons -------------------------------------------------------------------------------
// quota = coins that must be EARNED (sold) inside the season. Storm seasons
// run a timed boss defence inside the season window.
export const SEASONS = [
  { n: 1, name: 'First Furrow', quota: 320, seconds: 150, storm: null },
  { n: 2, name: 'Ember Weeks', quota: 700, seconds: 160, storm: null },
  { n: 3, name: 'Frostmarket', quota: 1150, seconds: 170, storm: null },
  { n: 4, name: 'The Blightstorm', quota: 1750, seconds: 190, storm: 'blight' },
  { n: 5, name: 'Prism Harvest', quota: 2600, seconds: 180, storm: null },
  { n: 6, name: 'Void Blooming', quota: 3700, seconds: 190, storm: null },
  { n: 7, name: 'The Locust Moon', quota: 5200, seconds: 210, storm: 'locust' },
];
export const STORMS = {
  blight: { id: 'blight', name: 'BLIGHTSTORM', hp: 900, seconds: 90, hitEvery: 4.2, color: '#b49aff',
    desc: 'Spend water on wards to shield beds; harvests wound the storm.' },
  locust: { id: 'locust', name: 'LOCUST MOON', hp: 1500, seconds: 110, hitEvery: 3.4, color: '#ffd24d',
    desc: 'The swarm eats unwarded ripe crops first. Harvest to drive it off.' },
};

export const DIFFICULTIES = [
  { id: 'sprout', name: 'Sprout', quotaMult: 0.7, desc: 'Gentle quotas, kind weather.' },
  { id: 'harvest', name: 'Harvest', quotaMult: 1.0, desc: 'The intended Acres.' },
  { id: 'blight', name: 'Blight', quotaMult: 1.4, desc: 'Fat quotas, fast blight.' },
];

export const SCORE = {
  harvestBase: 10,     // score per coin of a plain sale, before chain bonus
  chainStep: 0.25,     // +25% score per chain link
  pestShoo: 45,        // squashing a pest
  stormHit: 6,         // score per point of storm hide burned by a harvest
  stormDown: 2500,     // driving a storm boss off
  seasonClear: 1200,   // per season quota met
  mutationBonus: { ember: 300, frost: 700, prism: 2000 }, // flat score per mutated harvest
};

export const START_COINS = 60;
export const START_WATER = 70;
export const WATER_MAX = 100;
export const PLANT_WATER = 4;    // water spent planting a seed
export const WATER_COST = 6;     // water spent watering one bed
export const WARD_COST = 12;     // water spent warding one bed in a storm
export const WELL_COST = 15;     // coins for +40 water at the well (free with Dew Chalice)
export const CHAIN_WINDOW = 3.5; // seconds to keep a harvest chain alive
