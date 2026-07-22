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
  const helmetPart=catalog.getDefinition(`helmet_${theme}`).parts[0];
  assert.equal(helmetPart.sheet, "helmet_directional");
  assert.deepEqual(helmetPart.size, [48, 48], `helmet_${theme} must render the normalized cell at 1:1 scale`);
  assert.deepEqual([helmetPart.directions.right.source.row,helmetPart.directions.down.source.row,helmetPart.directions.left.source.row,helmetPart.directions.up.source.row],[0,1,2,3],`helmet_${theme} must provide four directional sprites`);
  assert.equal(catalog.getDefinition(`boots_${theme}`).animationSet, "forest_vanguard");
  assert.deepEqual(catalog.getDefinition(`boots_${theme}`).parts[0].source.subRect, [0, 0.72, 1, 0.28]);
}

const expectedWeaponOrigins={sword:{x:.33,y:.58},spear:{x:.31,y:.63},axe:{x:.27,y:.59},staff:{x:.16,y:.60},daggers:{x:.34,y:.54}};
for (const type of ["sword", "spear", "axe", "staff", "daggers"]) {
  const weapon = catalog.getDefinition(`weapon_${type}`);
  assert.equal(weapon.rotationMode, "weapon");
  assert.equal(weapon.rotation, 45, `${type} source art must rotate +45 degrees onto the aim axis`);
  assert.equal(weapon.carryOnBack, true, `${type} must be sheathed outside attack animations`);
  assert.equal(weapon.backPose.anchor, "backAnchor", `${type} back pose must use the rig back socket`);
  assert.equal(weapon.backPose.layer, "body", `${type} back pose must render behind the body`);
  assert.deepEqual(weapon.parts[0].origin,expectedWeaponOrigins[type],`${type} grip pivot must land on the animated hand socket`);
}

const character = new PixelEquipment.Character({ id: "test", rig, direction: "down" });
character.setAnimation("idle", { restart:true });
assert.deepEqual(character.getAnchor("rightHandAnchor"),{x:12,y:-13,rotation:0,scaleX:1,scaleY:1},"idle weapon socket must sit on the visible down-facing hand");
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
assert.deepEqual(pngSize("assets/sprites/helmet-directional-atlas-v3.png"), [240, 192]);
assert.deepEqual(pngSize("assets/sprites/player-hud-portrait-v1.png"), [128, 128]);
assert.deepEqual(pngSize("assets/sprites/equipment-atlas-v2.png"), [400, 400]);
assert.deepEqual(Object.fromEntries(["right","down","left","up"].map(direction=>[direction,rig.anchors.default[direction].headAnchor])),{
  right:{x:12,y:-38},down:{x:6,y:-38},left:{x:-6,y:-38},up:{x:-8,y:-38}
},"idle helmet sockets must follow the actual head centers in the base body sheet");
assert.deepEqual(rig.anchors.animations.walk.frames.map(frame=>frame.down.headAnchor),[{x:-6,y:-4},{x:-7,y:-16}],"walk helmet sockets must follow both source frames");
assert.deepEqual(rig.anchors.animations.run.frames.map(frame=>frame.down.headAnchor),[{x:-5,y:-4},{x:-6,y:-9},{x:-6,y:-7},{x:-6,y:-13}],"run helmet sockets must follow all four source frames");
for(const animation of ["walk","run","attack","hurt"]){
  rig.anchors.animations[animation].frames.forEach((frame,index)=>{
    for(const direction of ["right","down","left","up"])assert.ok(frame[direction]?.rightHandAnchor,`${animation} frame ${index} ${direction} must define a hand socket`);
  });
}
character.setAnimation("attack",{restart:true}).setDirection("right");character.frameIndex=1;
assert.deepEqual(character.getAnchor("rightHandAnchor"),{x:32,y:-21,rotation:0,scaleX:1,scaleY:1},"attack weapon socket must reach the extended right hand");

const sword = catalog.create("weapon_sword");
const idleWeaponCommands = [];
character.setAnimation("idle",{restart:true}).setDirection("down");
renderer.collectEquipment(idleWeaponCommands,character,sword);
assert.equal(idleWeaponCommands[0].anchor,"backAnchor","idle weapon must be mounted on the back");
assert.equal(idleWeaponCommands[0].layer,"body","sheathed weapon must render behind the character");
assert.equal(idleWeaponCommands[0].rotationMode,"anchor","sheathed weapon must not track the attack aim angle");
const attackWeaponCommands = [];
character.setAnimation("attack",{restart:true}).setDirection("right");
renderer.collectEquipment(attackWeaponCommands,character,sword);
assert.equal(attackWeaponCommands[0].anchor,"rightHandAnchor","attacking weapon must move to the hand socket");
assert.equal(attackWeaponCommands[0].layer,"weapon","drawn weapon must return to the weapon layer");
assert.equal(attackWeaponCommands[0].rotationMode,"weapon","drawn weapon must track the attack angle");

const activeSource = ["src/game.js", "styles.css", "index.html", "data/equipment/equipment-catalog.json"]
  .map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
for (const legacyName of [
  "equipment-atlas.png", "hero-atlas.png", "hero-directional-atlas.png",
  "hero-equipment-layers-v2.png", "hero-modular-parts-v3.png",
  "hero-run-atlas-v2.png", "hero-walk-atlas-v3.png",
  "helmet-directional-atlas-v1.png"
]) assert.ok(!activeSource.includes(legacyName), `legacy asset reference remains: ${legacyName}`);

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(indexHtml.indexOf("embedded-config.js") < indexHtml.indexOf("EquipmentSystem.js"), "embedded config must load before EquipmentSystem");

console.log("equipment-system tests passed");
