[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w6-moonmelon-acres/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w6-moonmelon-acres/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# MOONMELON ACRES

**MOONMELON ACRES — plant, mutate, harvest: 7 seasons, 6 crop lines, 9 beds, 8 talismans, 2 storm bosses, the Locust Moon.**

An idle-mutation garden sim on a 2D canvas — no libraries, no build step, no network. Open
`game/index.html` from any static server and play.

## The game

Buy seeds and plant them in **9 moonlit beds**. Crops grow in real time through four stages
(seed → sprout → bloom → ripe), faster when watered and faster still under a waxing
**moonphase** fast-forward (×1 / ×3 / ×6). Weather rolls in on a forecast you can always see
coming — Clear Moon, Moonshower, Emberwind, Frostfall, Prism Rain, Blight Creep — and every
weather change rolls the **mutation lottery** for near-ripe crops: **Emberkissed ×8,
Frostbloom ×15, Prismripe ×40**. A mutated harvest is where the money is. Harvest quickly to
build a **chain** that multiplies score into the tens of thousands.

- **7 seasons**, each with a coin quota and a clock. **WIN:** meet the quota. **LOSE:** the
  clock dies first and the Blightstorm strips every standing crop.
- **6 crop lines** — Moonmelon, Ember Pepper, Frostberry, Star Turnip, Prism Pumpkin, Void
  Orchid — each with its own seed price, sell price, grow time, four growth stages and its
  own mutation table.
- **8 talismans** with real effects (Dew Chalice, Ember Charm, Frost Locket, Prism Lens,
  Golden Sickle, Moon Dial, Blight Ward, Chain Bell), drafted **1-of-3 between seasons** —
  the draft is the meta screen.
- **6 pest actors** with distinct behaviour: the Gloom Aphid drains growth, the Locust Scout
  strips ripe crops, the Blight Wisp feeds the blight bar, the Frost Sprite freezes a bed,
  the Ember Imp scorches dry beds, and the Prism Moth is a friend who doubles mutation rolls
  where it lands. Click pests to shoo them.
- **2 storm bosses**: the **Blightstorm** (season 4) and the **Locust Moon** (season 7) —
  timed defences where you spend water on **wards** to shield beds while every harvest
  wounds the storm.
- **3 difficulties** (Sprout ×0.7, Harvest ×1.0, Blight ×1.4 quotas) and, after season 7,
  the **Eternal Autumn** endless mode with scaling quotas and alternating storms.
- HUD with explicit WIN/LOSE, water and blight bars, a season quota bar, the incoming
  weather panel, the talisman panel, the mutation feed, the harvest chain and floating
  sell numbers, mutation banners and particles over a textured procedural garden.

## Controls

- **Mouse / touch:** click a seed card, then a bed to plant. Click a growing crop to water
  it, a ripe crop to harvest it, a pest to shoo it. In a storm, click a growing bed to
  ward it. Click the moonphase dial to fast-forward, the well to buy water.
- **1–6:** pick a seed. **F:** cycle moonphase. **W:** water/ward the hovered bed.
- **Enter / Space / click:** start, advance, restart. **R:** new run. **P:** pause.

## Screens

`screenshots/` holds four real renders of the game itself, in order: the Locust Moon
storm-boss climax at full HUD mid-defence, the talisman draft screen after season 4, the
dense title screen (how-to, crop and pest bestiaries, difficulties and the endless mode),
and the victory end screen with its letter rank, twelve run stats and talisman recap.

## Layout

- `game/index.html` — the page and HUD strip.
- `game/src/config.js` — the farm: crops, mutations, talismans, weather, pests, seasons, storms, scoring.
- `game/src/world.js` — beds, the mutation lottery, weather rolling, pest spawning, storm bosses.
- `game/src/render.js` — all canvas art and screens: textured garden, crops, HUD panels, title / draft / end.
- `game/src/main.js` — the game loop and state: economy, growth, chains, storms, seasons, win / lose.
- `game/src/hud.js`, `game/src/input.js`, `game/src/audio.js` — HUD strip, controls, WebAudio synth blips.
- `game/src/shots.js` — deterministic `?shot=` scenes used to render the screenshots.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` out and writes the dossier.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Hand in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node serve.ts        # or any static server over game/, to play it
```

MIT licensed — see `LICENSE`.
