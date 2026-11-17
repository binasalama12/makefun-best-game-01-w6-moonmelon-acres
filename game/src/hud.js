// DOM HUD for MOONMELON ACRES: the strip across the top of the stage shows
// the season, coins, quota progress, score, and the water and blight bars.
// The canvas draws a second, richer HUD (panels, feed, chain) so a single
// frame of the game explains itself.

const el = (id) => document.getElementById(id);

export function updateHud(state) {
  const season = state.seasonDef;
  el('h-season').textContent = state.endless
    ? `Eternal ${state.seasonN - 6}`
    : (season ? `${season.n} / 7` : '–');
  el('h-coins').textContent = `${Math.floor(state.coins)}`;
  el('h-quota').textContent = `${Math.floor(state.quotaEarned)}/${state.quota}`;
  el('h-score').textContent = `${Math.floor(state.score)}`;
  el('waterbar').style.width = `${Math.max(0, Math.min(100, state.water))}%`;
  el('blightbar').style.width = `${Math.max(0, Math.min(100, state.blight))}%`;
}

export function setMessage(text) {
  el('msg').textContent = text || '';
}
