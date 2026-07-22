"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const stripQuery = value => value.split("?")[0];
const exists = relative => fs.existsSync(path.join(root, stripQuery(relative)));
const pngSize = relative => {
  const data = fs.readFileSync(path.join(root, stripQuery(relative)));
  assert.equal(data.toString("ascii", 1, 4), "PNG", `${relative} must be a PNG`);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};

const html = read("index.html");
const css = read("styles.css");
const game = read("src/game.js");

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, "index.html contains duplicate ids");
const dynamicIds = [...game.matchAll(/\bid=\\?"([^"]+)\\?"/g)].map(match => match[1]);
const idSet = new Set([...ids, ...dynamicIds]);
for (const match of game.matchAll(/\$\("([^"]+)"\)/g)) {
  assert.ok(idSet.has(match[1]), `src/game.js references missing #${match[1]}`);
}

const localAssetReferences = new Set();
for (const source of [html, css, game, read("data/characters/player-rig.json"), read("data/equipment/equipment-catalog.json")]) {
  for (const match of source.matchAll(/(?:\.\.\/\.\.\/)?assets\/[A-Za-z0-9_./-]+\.png(?:\?[^'"\s)]*)?/g)) {
    localAssetReferences.add(match[0].replace(/^\.\.\/\.\.\//, ""));
  }
}
for (const asset of localAssetReferences) assert.ok(exists(asset), `missing referenced asset: ${asset}`);

const grids = {
  "assets/sprites/forest-atlas.png": [5, 2],
  "assets/sprites/waste-atlas.png": [5, 2],
  "assets/sprites/tundra-atlas.png": [5, 2],
  "assets/sprites/peaks-atlas.png": [5, 2],
  "assets/sprites/abyss-atlas.png": [5, 2],
  "assets/sprites/effects-atlas-transparent-v2.png": [5, 3],
  "assets/sprites/monster-effects-atlas-v2.png": [5, 4],
  "assets/sprites/materials-atlas.png": [5, 4],
  "assets/sprites/elite-loot-atlas.png": [5, 2],
  "assets/sprites/terrain-atlas.png": [5, 2],
  "assets/sprites/hero-base-layered-atlas.png": [4, 5],
  "assets/sprites/hero-base-walk-atlas.png": [4, 2],
  "assets/sprites/hero-base-run-atlas.png": [4, 4],
  "assets/sprites/armor-forest-overlay-directional-v1.png": [4, 5],
  "assets/sprites/armor-forest-overlay-walk-v1.png": [4, 2],
  "assets/sprites/armor-forest-overlay-run-v1.png": [4, 4],
  "assets/sprites/wearable-equipment-atlas-v1.png": [5, 3],
  "assets/sprites/helmet-directional-atlas-v3.png": [5, 4],
  "assets/sprites/equipment-atlas-v2.png": [5, 5],
  "assets/sprites/treant-root-vfx-transparent-v2.png": [4, 1]
};
for (const [asset, [columns, rows]] of Object.entries(grids)) {
  assert.ok(exists(asset), `missing atlas: ${asset}`);
  const [width, height] = pngSize(asset);
  assert.equal(width % columns, 0, `${asset} width ${width} is not divisible by ${columns}`);
  assert.equal(height % rows, 0, `${asset} height ${height} is not divisible by ${rows}`);
}

assert.match(game, /function preloadArt\(/, "game must preload required art before startup");
assert.match(game, /game\.save\.equipment\.inventory/, "inventory logic is missing");
assert.match(game, /spawnGroundDrop\("equipment"/, "equipment drop logic is missing");
assert.match(game, /spawnGroundDrop\("potion"/, "potion drop logic is missing");
assert.match(game, /function renderSavePanel\(/, "save-slot UI is missing");
assert.match(game, /function renderWorldMap|function drawWorldMap/, "map UI is missing");
assert.match(game, /function bossSpecial\(/, "boss patterns are missing");
assert.match(game, /specialFx==="treantRoots"/, "treant root effect binding is missing");
assert.match(game, /function drawMonsterTelegraphSprites/, "boss telegraph sprite renderer is missing");
assert.match(game, /function spawnTelegraphMonsterImpacts/, "boss impact sprite binding is missing");
assert.match(game, /boundTelegraphs:game\.telegraphs\.filter\(t=>t\.monsterFx\)/, "boss QA must expose bound telegraph sprites");
assert.ok(!html.includes('id="interaction-guide"'), "obsolete full-screen interaction guide must stay removed");
assert.match(game, /function drawWorldInteractionLabels\(/, "nearby world labels are missing");
assert.match(game, /qualityById\(d\.item\.quality\).*q\.color/, "equipment drop labels must inherit quality colors");
assert.doesNotMatch(game, /drawWorldHint\(d\.x,labelY,`E ·/, "pickup labels above ground items must not show the E key");
assert.match(game, /if\(!e\.boss\).*spawnGroundDrop\("material"/, "normal monsters must drop field materials");
assert.match(game, /markQa\("interact:none"/, "empty E interaction must be silent and QA-observable");
assert.equal((html.match(/data-inventory-tab=/g)||[]).length,3,"inventory must have three category tabs");
assert.ok(html.includes('world-map-five-realms-v1.png'),"five-realm continent map is missing");
assert.match(game, /clip-path:var\(--shape\)|setProperty\("--shape"/, "continent selection must use full landmass polygons");
assert.match(css, /continent-hotspot:hover[^}]*drop-shadow/, "selected landmass must expose an outline glow");
assert.match(css, /\.player-card,\.world-card,\.quest-card\s*\{\s*background:none;border:0/, "top HUD cards must be frameless");
assert.ok(html.includes('id="settings-dock-btn"')&&html.includes('id="settings-panel"'), "icon settings entry or settings panel is missing");
assert.ok(html.includes('id="settings-music-toggle"')&&html.includes('id="bgm-volume"'), "BGM switch and volume slider must live in settings");
assert.ok(html.includes('id="settings-save-summary"')&&html.includes('id="settings-save-list-btn"'), "settings must expose save summaries and the save list");
assert.ok(!html.includes('id="music-toggle-btn"'), "obsolete standalone music button must stay removed");
assert.ok(!html.includes('class="quickbar'), "bottom persistent key guide must stay removed");
assert.match(css,/\.menu-dock button\s*\{[^}]*background:transparent;\s*box-shadow:none/,"HUD menu buttons must be frameless icons");
assert.match(css,/\.menu-dock button::after\s*\{\s*content:attr\(data-tooltip\)/,"HUD icons must reveal their labels on hover");
assert.match(css,/\.tooltip\s*\{[^}]*z-index:180;/,"equipment details must render above z-index 120 modal windows");
assert.match(game,/itemTooltipCard\(item,"背包装备"\).*itemTooltipCard\(equipped,"当前穿戴"\)/,"inventory hover must compare backpack gear with the currently equipped item");
assert.match(game,/x=clamp\(x,6,W-tipWidth-6\);y=clamp\(y,6,H-tipHeight-6\)/,"equipment detail panels must remain inside the game viewport");
assert.ok(html.includes('id="hud-portrait"'),"player HUD portrait is missing");
assert.ok(html.includes('assets/sprites/player-hud-portrait-v1.png'),"player HUD must use the dedicated front-facing portrait asset");
assert.deepEqual(pngSize("assets/sprites/player-hud-portrait-v1.png"),[128,128],"player HUD portrait must be a normalized square image");
assert.match(css,/\.portrait\s*\{[^}]*object-fit:cover;[^}]*object-position:center;/,"player portrait must stay centered without an angled sprite crop");
assert.match(game, /if\(!game\.save\.settings\.music\).*bgm\.pause/, "music-off state must pause the media element");
assert.match(game, /dataset\.bgmState="muted"/, "music-off state must be externally testable");
assert.match(game, /localStorage\.setItem\(MUSIC_PREF_KEY/, "music preference must survive new games and reloads");
assert.match(game, /localStorage\.setItem\(MUSIC_VOLUME_PREF_KEY/, "BGM volume must survive reloads");
assert.match(game, /game\.save\.settings\.music=readMusicPreference\(\)/, "loading a save must preserve the global muted preference");
assert.match(game,/function autoAimTarget\(/,"automatic target selection is missing");
assert.match(game,/function hasAutoAimLine\(/,"automatic targeting must reject targets behind walls");
assert.ok(!game.includes("game.mouse"),"mouse aim state must stay removed");
assert.doesNotMatch(game,/canvas\.addEventListener\("pointerdown"[^\n]*attack\(/,"mouse clicks must not attack");
assert.match(game,/data-depth=\"\$\{d\}\"/,"continent map must expose per-depth selection");
assert.match(css,/\.depth-select\s*\{/,"depth selector styling is missing");
assert.match(game,/generateItem\(game\.biome, game\.depth, 0, new RNG\([^\n]+\), 3\)/,"normal monsters must cap equipment drops below legendary");
assert.match(game,/function stripQualityPrefix\(/,"legacy duplicated quality prefixes must be normalized");
assert.doesNotMatch(game,/name:\s*`\$\{qi >= 3/,"generated equipment names must not embed their quality twice");
assert.match(game,/playerFx:\"swordWave\"/,"sword combo three must launch a bound sword wave");
assert.match(game,/weaponType === \"spear\" && p\.combo === 3[^\n]*p\.dash/,"spear combo three must charge player and spear together");
assert.match(game,/radialFinisher=swing\.combo===3&&swing\.weaponType===\"axe\"/,"axe combo three must use radial damage");
assert.match(game,/thresholds=\[\.24,\.5,\.73\]/,"dagger combo three must execute three separate hit stages");
assert.match(game,/function drawComboAttackEffect\(/,"weapon combo effects must be bound per weapon and combo");
assert.match(game,/const POTION_CAPACITY = 99/,"potion storage capacity must be 99");
assert.doesNotMatch(game,/potions\s*>=\s*8/,"legacy eight-potion cap must be removed");
assert.match(game,/const SHOW_WORN_HELMETS = false/,"worn helmet visuals must remain disabled until the art is replaced");
assert.match(game,/function axeSpinAngle\(/,"axe combo three must have a complete body spin curve");
assert.match(game,/character\.pose\.worldRotation = p\.swing\?\.weaponType === "axe"/,"axe combo three must rotate the layered character and weapon together");
assert.match(game,/function createFullUnlockTestSave\(/,"full-unlock test save generator is missing");
const fullUnlockSave=JSON.parse(read("data/saves/full-unlock-test-save.json"));
assert.equal(fullUnlockSave.version,4,"committed full-unlock save must use the current format");
assert.equal(fullUnlockSave.metadata.targetSlot,3,"committed test save must target manual slot 3");
assert.equal(fullUnlockSave.save.player.level,50,"committed test save must use the level-50 character");
assert.equal(fullUnlockSave.save.player.potions,99,"committed test save must include the 99-potion cap");
assert.deepEqual(fullUnlockSave.save.progress.completedDepths,[5,5,5,5,5],"committed test save must unlock all 25 depths");
assert.deepEqual([fullUnlockSave.save.equipment.equipped.weapon,...fullUnlockSave.save.equipment.inventory].map(item=>item.weaponType),["sword","spear","axe","staff","daggers"],"committed test save must contain all five legendary weapons");
assert.ok([fullUnlockSave.save.equipment.equipped.weapon,...fullUnlockSave.save.equipment.inventory].every(item=>item.quality==="gold"),"every test-save weapon must be legendary");
assert.match(game,/function ensureFullUnlockTestSlot\(/,"manual slot 3 bootstrap is missing");
assert.match(game,/localStorage\.getItem\(SLOT_SAVE_KEYS\[2\]\)\) return false/,"manual slot 3 bootstrap must preserve an existing save");
assert.match(game,/全解锁测试档（内置）/,"save list must always expose the built-in full-unlock test save");
assert.match(game,/dataset\.weaponMount = resolvedWeapon\?\.anchor/,"weapon mount state must be externally testable");
assert.match(game,/p\.swing \|\| p\.weaponDrawn > 0 \? "attack"/,"attacks and weapon skills must draw the weapon into the hand");
assert.ok(html.includes('id="qa-full-save"'),"QA panel must expose the full-unlock test save generator");
assert.ok(html.includes('id="qa-axe-spin"'),"QA panel must expose the axe spin visual regression case");

const attackBlock = game.slice(game.indexOf("const ENEMY_ATTACKS"), game.indexOf("const QUALITIES"));
const enemyIds = [...attackBlock.matchAll(/id:\s*"([A-Za-z0-9]+)"/g)].map(match => match[1]);
assert.ok(enemyIds.length >= 20, `expected at least 20 enemy attack definitions, got ${enemyIds.length}`);
assert.equal(new Set(enemyIds).size, enemyIds.length, "enemy attack ids must be unique");
for (const id of enemyIds) assert.ok(game.includes(`id==="${id}"`), `enemy attack ${id} has no execution branch`);

const tracksMatch = game.match(/const STAGE_TRACK_NAMES = (\[[\s\S]*?\n  \]);/);
assert.ok(tracksMatch, "stage music table is missing");
const stageTracks = JSON.parse(tracksMatch[1]);
assert.equal(stageTracks.length, 5, "expected five biome music groups");
stageTracks.forEach((tracks, biome) => assert.equal(tracks.length, 5, `biome ${biome} must have five depth tracks`));
assert.equal(new Set(stageTracks.flat()).size, 25, "all 25 stage tracks must have distinct names");

const bossBlock = game.slice(game.indexOf("function bossSpecial"), game.indexOf("function pointSegmentDistance"));
assert.match(bossBlock,/const circle = \(\.\.\.args\) => addCircle\(\.\.\.args, bossFx\)/,"boss circles must carry monsterFx");
assert.match(bossBlock,/const line = \(\.\.\.args\) => addLine\(\.\.\.args, null, bossFx\)/,"boss lines must carry monsterFx");
assert.match(bossBlock,/const cone = \(\.\.\.args\) => addCone\(\.\.\.args, bossFx\)/,"boss cones must carry monsterFx");
for (let pattern = 0; pattern < 4; pattern += 1) {
  const branches = bossBlock.match(new RegExp(`pattern === ${pattern}`, "g")) || [];
  assert.equal(branches.length, 5, `boss pattern ${pattern} must be implemented for all five biomes`);
}

const equipmentCatalog = JSON.parse(read("data/equipment/equipment-catalog.json"));
for (const type of ["sword", "spear", "axe", "staff", "daggers"]) {
  const weapon = equipmentCatalog.items.find(item => item.id === `weapon_${type}`);
  assert.ok(weapon, `missing visual definition for ${type}`);
  assert.equal(weapon.rotationMode, "weapon");
  assert.equal(weapon.rotation, 45, `${type} must align its diagonal source art to the aim axis`);
}

const bgmFiles=[...game.matchAll(/src:"(assets\/audio\/bgm\/[^"]+\.(?:mp3|ogg))"/g)].map(match=>match[1]);
assert.equal(bgmFiles.length,8,"title, camp, five biomes and boss require eight external BGM tracks");
assert.equal(new Set(bgmFiles).size,8,"BGM track files must be unique");
for(const file of bgmFiles)assert.ok(exists(file),`missing BGM file: ${file}`);

console.log(`project integrity passed: ${ids.length} DOM ids, ${localAssetReferences.size} images, ${enemyIds.length} enemy attacks, 20 boss patterns, ${bgmFiles.length} external BGM tracks`);
