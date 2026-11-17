// Deterministic screenshot scenes for MOONMELON ACRES, driven by the URL:
//   ?shot=boss&seed=7   season 7: the Locust Moon climax, mid-defence, full HUD
//   ?shot=draft&seed=7  the talisman draft (meta) screen after season 4
//   ?shot=title&seed=7  the dense title: how-to + bestiaries + difficulties
//   ?shot=end&seed=7    the victory end screen: rank S, full stats, recap
// Each scene is built from the game's own state with a fixed seed, then the
// main loop fixed-steps it and raises window.__shotReady. Without a ?shot
// param this module does nothing.

import { TALISMANS, PESTS, WEATHERS } from './config.js';

function pest(kind, x, y, targetBed, phase) {
  const def = PESTS.find((p) => p.id === kind) || PESTS[0];
  return { uid: 900 + targetBed, kind, def, x, y, vx: 0, vy: 0, phase, targetBed, dwell: 0, acted: false };
}

export function setupShotScene(state, api) {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return false;
  state.shotMode = shot;
  // Deterministic frames: the DOM HUD bars animate their width with a CSS
  // transition in live play; a screenshot must catch them settled, so shot
  // mode snaps them instantly.
  const snap = document.createElement('style');
  snap.textContent = '.barwrap span { transition: none !important; }';
  document.head.appendChild(snap);

  if (shot === 'title') {
    api.startRun(1);
    state.mode = 'title';
    state.best = 48750;
    state.score = 0;
  } else if (shot === 'boss') {
    api.startRun(1);
    api.startSeason(7);
    state.mode = 'play';
    // The Locust Moon at full fury: storm HP worn down by harvests, six
    // strikes landed, wards up on the beds that matter, a Prismripe melon
    // waiting under a banner, chain x6 still warm.
    state.coins = 1240; state.water = 46; state.blight = 58;
    state.score = 28450; state.quotaEarned = 3410;
    state.seasonTime = 96; state.weatherTimer = 9;
    state.weather = WEATHERS.prismrain; state.weatherNext = WEATHERS.blightcreep;
    state.talismans = ['chalice', 'prismlens', 'sickle', 'chainbell', 'blightward'];
    state.chain = 6; state.chainTimer = 5.5;
    state.stats.bestChain = 9; state.stats.mutated = 14; state.stats.prism = 3;
    const show = [
      [0, 0, 1, 'prism'], [1, 4, 1, 'frost'], [2, 5, 0.66, null],
      [3, 1, 1, 'ember'], [4, 2, 1, null], [5, 3, 0.72, null],
      [6, 5, 1, 'prism'], [7, 0, 0.45, null], [8, 4, 1, 'frost'],
    ];
    for (const [i, crop, growth, mut] of show) api.plantShowcase(i, crop, growth, mut);
    state.beds[0].warded = true; state.beds[4].warded = true; state.beds[6].warded = true;
    state.beds[1].blessed = 9; state.beds[3].watered = 6;
    state.stats.wards = 3;
    if (state.storm) {
      state.storm.hp = 620; state.storm.timer = 47; state.storm.strikes = 6; state.storm.hitTimer = 3;
    }
    state.pests = [
      pest('locust', 372, 196, 8, 1.2), pest('locust', 560, 330, 6, 3.4),
      pest('locust', 986, 208, 0, 5.1), pest('wisp', 1018, 452, 2, 2.2),
    ];
    state.pestTimer = 8;
    api.pushFeed('Void Orchid ripened PRISMRIPE x40', '#ff7ae8');
    api.pushFeed('LOCUST MOON — ward your beds!', '#ffd24d');
    api.pushFeed('Frostberry turned Frostbloom x15 in the Frostfall', '#7fe8ff');
    api.pushFeed('Weather: Prism Rain — Prismripe rolls triple', '#ff7ae8');
    api.setBanner('PRISMRIPE x40!', '#ff7ae8');
    const b0 = state.beds[0], b6 = state.beds[6], b4 = state.beds[4];
    api.addFloat(b0.x + b0.w / 2, b0.y + 20, '+10,400c', '#ff7ae8', true);
    api.addFloat(b6.x + b6.w / 2, b6.y + 20, '+6,720c', '#ff7ae8', true);
    api.addFloat(b4.x + b4.w / 2, b4.y + 24, 'CHAIN x6', '#ffd24d', false);
  } else if (shot === 'draft') {
    api.startRun(1);
    api.startSeason(4);
    state.storm = null;
    state.mode = 'draft';
    state.coins = 860; state.water = 64; state.blight = 22;
    state.score = 19850; state.quotaEarned = 1892;
    state.seasonTime = 41;
    state.talismans = ['chalice', 'sickle'];
    state.draftChoices = ['prismlens', 'moondial', 'chainbell'].map((id) => TALISMANS.find((t) => t.id === id));
    state.stats.talismansDrafted = 2; state.stats.seasonsCleared = 4;
    const show = [
      [0, 4, 0.7, null], [1, 2, 1, 'frost'], [3, 5, 0.5, null],
      [4, 0, 1, null], [6, 3, 0.62, null], [8, 1, 0.85, null],
    ];
    for (const [i, crop, growth, mut] of show) api.plantShowcase(i, crop, growth, mut);
    api.pushFeed('Season 4 quota met — the Blightstorm broke!', '#ffd24d');
    api.pushFeed('Prism Pumpkin turned Emberkissed x8', '#ff8a3d');
  } else if (shot === 'end') {
    api.startRun(1);
    api.startSeason(7);
    state.storm = null;
    state.score = 61240; state.best = 61240;
    state.coins = 2380; state.water = 58; state.blight = 31;
    state.quotaEarned = 5340;
    state.talismans = ['chalice', 'prismlens', 'sickle', 'chainbell', 'blightward', 'moondial'];
    state.stats = {
      planted: 148, harvested: 131, mutated: 29, prism: 6,
      coinsEarned: 21480, pestsShooed: 23, wards: 17, bestChain: 11,
      stormsSurvived: 2, seasonsCleared: 7, talismansDrafted: 6, stripped: 4,
    };
    const show = [
      [0, 0, 1, 'prism'], [2, 4, 1, 'frost'], [4, 5, 1, null],
      [6, 3, 0.8, null], [8, 1, 1, 'ember'],
    ];
    for (const [i, crop, growth, mut] of show) api.plantShowcase(i, crop, growth, mut);
    api.endRun(true, 'All seven seasons harvested. The Locust Moon fled your fields, and the Acres bloom under a quiet sky.');
    state.rank = 'S';
  } else {
    return false;
  }

  const msg = document.getElementById('msg');
  if (msg) msg.textContent = '';
  return true;
}
