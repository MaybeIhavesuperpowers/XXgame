"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const maa = require("@maaxyz/maa-node");
const ForgeRules = require("../../src/forge/ForgeRules.js");

const root = path.resolve(__dirname, "../..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const exists = relative => fs.existsSync(path.join(root, relative));
const report = { suite: "MaaFramework white-box", maaVersion: maa.Global.version, checks: [] };
const check = (name, fn) => { fn(); report.checks.push({ name, ok: true }); };

check("official MaaFramework Node runtime is available", () => assert.match(maa.Global.version, /^v5\.12\./));

check("existing syntax, equipment and project-integrity suites pass", () => {
  const commands = [
    ["--check", path.join(root, "src/game.js")],
    ["--check", path.join(root, "src/forge/ForgeRules.js")],
    [path.join(root, "tests/equipment-system.test.cjs")],
    [path.join(root, "tests/project-integrity.test.cjs")]
  ];
  commands.forEach(args => {
    const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  });
});

check("forge plan charges exact base, rare and core costs without mutating input", () => {
  const biome = { primary: "wood", ore: "ore", rare: "rare", core: "core" };
  const balances = { gold: 100, materials: { wood: 20, ore: 20, rare: 5, core: 2 } };
  const frozen = JSON.stringify(balances);
  const plan = ForgeRules.createCraftPlan(0, biome, true, true);
  const result = ForgeRules.applyCraftPlan(plan, balances);
  assert.deepEqual(plan.materials, { wood: 6, ore: 4, rare: 2, core: 1 });
  assert.equal(result.gold, 65); assert.deepEqual(result.materials, { wood: 14, ore: 16, rare: 3, core: 1 });
  assert.equal(JSON.stringify(balances), frozen); assert.equal(result.ok, true);
});

check("forge validation distinguishes gold, base, rare and core failures", () => {
  const biome = { primary: "wood", ore: "ore", rare: "rare", core: "core" };
  const plan = ForgeRules.createCraftPlan(0, biome, true, true);
  const test = (gold, materials, reason) => assert.equal(ForgeRules.validateCraftPlan(plan, { gold, materials }).reason, reason);
  test(0, { wood: 99, ore: 99, rare: 99, core: 99 }, "gold");
  test(99, { wood: 5, ore: 99, rare: 99, core: 99 }, "base");
  test(99, { wood: 99, ore: 99, rare: 1, core: 99 }, "rare");
  test(99, { wood: 99, ore: 99, rare: 2, core: 0 }, "core");
});

check("production craft uses the shared rules and reports random/special affixes", () => {
  const source = read("src/game.js");
  assert.match(source, /ForgeRules\.createCraftPlan/); assert.match(source, /ForgeRules\.applyCraftPlan/);
  assert.match(source, /specialAffixes:item\.affixes\.filter/); assert.match(source, /craft-success:r/);
  assert.match(source, /new RNG\(Date\.now\(\)\+"craft"\)/);
});

check("all five bosses bind their patterns to sprite effects", () => {
  const source = read("src/game.js");
  assert.match(source, /monsterFx/); assert.match(source, /boundProjectiles/);
  assert.match(source, /boundTelegraphs/); assert.match(source, /boundImpacts/);
  assert.match(source, /drawMonsterTelegraphSprites/); assert.match(source, /drawBossFootFx/);
});

check("all image and BGM files have valid non-empty signatures", () => {
  const files = [];
  const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
    const target = path.join(directory, entry.name); entry.isDirectory() ? walk(target) : files.push(target);
  });
  walk(path.join(root, "assets"));
  const pngs = files.filter(file => file.endsWith(".png"));
  const audio = files.filter(file => /\.(mp3|ogg|wav)$/i.test(file));
  assert.ok(pngs.length >= 25); assert.ok(audio.length >= 8);
  pngs.forEach(file => { const data = fs.readFileSync(file); assert.ok(data.length > 100); assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", file); });
  audio.forEach(file => assert.ok(fs.statSync(file).size > 10_000, file));
});

check("new UI, map, BGM and forge modules are wired into the shipping page", () => {
  const html = read("index.html");
  ["data-inventory-tab=\"equipment\"", "data-inventory-tab=\"materials\"", "data-inventory-tab=\"consumables\"", "ForgeRules.js"].forEach(id => assert.ok(html.includes(id), id));
  assert.ok(!html.includes('id="interaction-guide"'), "oversized interaction guide must not return");
  const source = read("src/game.js");
  assert.match(source, /function drawWorldInteractionLabels\(/);
  assert.match(source, /forge-select:/);
  assert.match(source, /markQa\("interact:none"/);
  ["assets/world-map-five-realms-v1.png", "assets/sprites/helmet-directional-atlas-v3.png", "assets/sprites/monster-effects-atlas-v2.png"].forEach(file => assert.ok(exists(file), file));
});

check("settings, automatic aim, replayable depths and weapon combos are production-wired",()=>{
  const html=read("index.html"),source=read("src/game.js"),css=read("styles.css");
  ["settings-dock-btn","settings-panel","settings-music-toggle","bgm-volume","settings-save-summary","qa-combos"].forEach(id=>assert.ok(html.includes(`id="${id}"`),id));
  assert.ok(!html.includes('class="quickbar'));
  assert.match(source,/function autoAimTarget\(/);assert.match(source,/function hasAutoAimLine\(/);assert.ok(!source.includes("game.mouse"));
  assert.match(source,/data-depth=\"\$\{d\}\"/);assert.match(css,/\.depth-select\s*\{/);
  assert.match(source,/playerFx:\"swordWave\"/);assert.match(source,/radialFinisher=swing\.combo===3&&swing\.weaponType===\"axe\"/);assert.match(source,/thresholds=\[\.24,\.5,\.73\]/);assert.match(source,/function drawComboAttackEffect\(/);
  assert.match(source,/generateItem\(game\.biome, game\.depth, 0, new RNG\([^\n]+\), 3\)/);
});

check("potion cap, hidden helmet, sheathed weapon, axe spin and persistent full test save are wired",()=>{
  const html=read("index.html"),source=read("src/game.js"),rig=JSON.parse(read("data/characters/player-rig.json")),catalog=JSON.parse(read("data/equipment/equipment-catalog.json")),testSave=JSON.parse(read("data/saves/full-unlock-test-save.json"));
  assert.match(source,/const POTION_CAPACITY = 99/);assert.ok(!/potions\s*>=\s*8/.test(source));
  assert.match(source,/const SHOW_WORN_HELMETS = false/);assert.match(source,/function createFullUnlockTestSave\(/);assert.match(source,/function ensureFullUnlockTestSlot\(/);assert.match(source,/全解锁测试档（内置）/);
  assert.match(source,/character\.pose\.worldRotation = p\.swing\?\.weaponType === "axe"/);assert.match(source,/function axeSpinAngle\(/);
  assert.deepEqual(rig.anchors.animations.idle.frames[0].down.rightHandAnchor,{x:3,y:6});
  ["sword","spear","axe","staff","daggers"].forEach(type=>{const weapon=catalog.items.find(item=>item.id===`weapon_${type}`);assert.equal(weapon.carryOnBack,true);assert.equal(weapon.backPose.anchor,"backAnchor");});
  assert.equal(testSave.metadata.targetSlot,3);assert.equal(testSave.save.player.level,50);assert.equal(testSave.save.player.potions,99);assert.deepEqual(testSave.save.progress.completedDepths,[5,5,5,5,5]);
  assert.ok(html.includes('id="qa-full-save"'));assert.ok(html.includes('id="qa-axe-spin"'));assert.ok(html.includes('assets/sprites/player-hud-portrait-v1.png'));assert.ok(exists("assets/sprites/player-hud-portrait-v1.png"));
});

const output = path.join(root, ".codex_tmp", "maafw-whitebox-report.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ ...report, passed: report.checks.length }, null, 2));
console.log(`MaaFramework white-box passed: ${report.checks.length} checks`);
console.log(output);
