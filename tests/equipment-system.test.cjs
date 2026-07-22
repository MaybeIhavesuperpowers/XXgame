"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const pngSize = relative => {
  const data = fs.readFileSync(path.join(root, relative));
  assert.equal(data.toString("ascii", 1, 4), "PNG", `${relative} must be a PNG`);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};

global.window = global;
require(path.join(root, "src/equipment/SpriteSheet.js"));
require(path.join(root, "src/equipment/Equipment.js"));
require(path.join(root, "src/equipment/Character.js"));
require(path.join(root, "src/equipment/LayeredCharacterRenderer.js"));

const rig = readJson("data/characters/player-rig.json");
const catalogConfig = readJson("data/equipment/equipment-catalog.json");
require(path.join(root, "data/equipment/embedded-config.js"));
assert.deepEqual(PixelEquipment.EMBEDDED_CONFIG.rig, rig, "embedded rig snapshot must match JSON");
assert.deepEqual(PixelEquipment.EMBEDDED_CONFIG.catalog, catalogConfig, "embedded catalog snapshot must match JSON");
const catalog = new PixelEquipment.EquipmentCatalog(catalogConfig);
const registry = new PixelEquipment.SpriteSheetRegistry([
  ...rig.spriteSheets,
  ...catalogConfig.spriteSheets
].map(sheet => ({ ...sheet, src: sheet.src })));
const renderer = new PixelEquipment.LayeredCharacterRenderer({ registry, layerOrder: rig.layerOrder });

const expectedFrameCounts = { idle: 1, walk: 2, run: 4, attack: 3, hurt: 1 };
const armorFrames = catalogConfig.animationSets.forest_vanguard;
for (const [animation, count] of Object.entries(expectedFrameCounts)) {
  for (const direction of ["up", "down", "left", "right"]) {
    assert.equal(rig.animations[animation].directions[direction].length, count, `${animation}.${direction} body frame count`);
    assert.equal(armorFrames[animation][direction].length, count, `${animation}.${direction} clothing frame count`);
  }
}

for (let theme = 0; theme < 5; theme += 1) {
  const armor = catalog.getDefinition(`armor_${theme}`);
  assert.equal(armor.animationSet, "forest_vanguard");
  assert.equal(armor.parts.length, 1, `armor_${theme} must use one fitted animated overlay`);
  assert.equal(catalog.getDefinition(`helmet_${theme}`).parts[0].sheet, "wearable_equipment");
  assert.equal(catalog.getDefinition(`boots_${theme}`).animationSet, "forest_vanguard");
  assert.deepEqual(catalog.getDefinition(`boots_${theme}`).parts[0].source.subRect, [0, 0.72, 1, 0.28]);
}

const character = new PixelEquipment.Character({ id: "test", rig, direction: "down" });
character.setAnimation("walk", { restart: true }).update(0.16);
assert.equal(character.frameIndex, 1, "walk animation must advance to its second frame");
character.setAnimation("run", { restart: true }).update(0.09);
assert.equal(character.frameIndex, 1, "run animation must advance through four frames");
character.setAnimation("attack", { restart: true }).update(0.09);
assert.equal(character.frameIndex, 1, "attack animation must advance while the swing is active");
const armor = catalog.create("armor_0");
character.equip(armor);
const expectedSheets = {
  idle: ["armor_forest_directional", [0]],
  walk: ["armor_forest_walk", [0, 1]],
  run: ["armor_forest_run", [0, 1, 2, 3]],
  attack: ["armor_forest_directional", [2, 3, 4]],
  hurt: ["armor_forest_directional", [4]]
};
for (const [animation, [sheet, rows]] of Object.entries(expectedSheets)) {
  character.setAnimation(animation, { restart: true });
  rows.forEach((row, frameIndex) => {
    character.frameIndex = frameIndex;
    const commands = [];
    renderer.collectEquipment(commands, character, armor);
    assert.equal(commands.length, 1);
    assert.equal(commands[0].sheet, sheet);
    assert.deepEqual(commands[0].source, { col: 1, row, subRect: [0, 0, 1, 0.72] });
    assert.deepEqual(commands[0].size, [82, 73]);
  });
}

const boots = catalog.create("boots_3");
character.setAnimation("run", { restart: true });
character.frameIndex = 2;
const bootCommands = [];
renderer.collectEquipment(bootCommands, character, boots);
assert.equal(bootCommands[0].sheet, "armor_forest_run");
assert.deepEqual(bootCommands[0].source, { col: 1, row: 2, subRect: [0, 0.72, 1, 0.28] });
assert.deepEqual(bootCommands[0].offset, { x: 0, y: 36 });
assert.deepEqual(bootCommands[0].size, [82, 29]);

assert.deepEqual(pngSize("assets/sprites/hero-base-layered-atlas.png"), [328, 510]);
assert.deepEqual(pngSize("assets/sprites/armor-forest-overlay-directional-v1.png"), [328, 510]);
assert.deepEqual(pngSize("assets/sprites/hero-base-walk-atlas.png"), [328, 204]);
assert.deepEqual(pngSize("assets/sprites/armor-forest-overlay-walk-v1.png"), [328, 204]);
assert.deepEqual(pngSize("assets/sprites/hero-base-run-atlas.png"), [328, 408]);
assert.deepEqual(pngSize("assets/sprites/armor-forest-overlay-run-v1.png"), [328, 408]);
assert.deepEqual(pngSize("assets/sprites/wearable-equipment-atlas-v1.png"), [400, 240]);
assert.deepEqual(pngSize("assets/sprites/equipment-atlas-v2.png"), [400, 400]);

const activeSource = ["src/game.js", "styles.css", "index.html", "data/equipment/equipment-catalog.json"]
  .map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
for (const legacyName of [
  "equipment-atlas.png", "hero-atlas.png", "hero-directional-atlas.png",
  "hero-equipment-layers-v2.png", "hero-modular-parts-v3.png",
  "hero-run-atlas-v2.png", "hero-walk-atlas-v3.png"
]) assert.ok(!activeSource.includes(legacyName), `legacy asset reference remains: ${legacyName}`);

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(indexHtml.indexOf("embedded-config.js") < indexHtml.indexOf("EquipmentSystem.js"), "embedded config must load before EquipmentSystem");

console.log("equipment-system tests passed");
