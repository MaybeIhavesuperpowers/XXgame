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
  "assets/sprites/effects-atlas.png": [5, 3],
  "assets/sprites/monster-effects-atlas.png": [5, 4],
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
  "assets/sprites/equipment-atlas-v2.png": [5, 5],
  "assets/sprites/treant-root-vfx-v2.png": [4, 1]
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

console.log(`project integrity passed: ${ids.length} DOM ids, ${localAssetReferences.size} images, ${enemyIds.length} enemy attacks, 20 boss patterns, 25 BGM tracks`);
