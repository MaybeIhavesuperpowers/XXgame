"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const maa = require("@maaxyz/maa-node");

if (process.platform !== "win32") throw new Error("This MaaFramework Win32 black-box suite requires Windows.");

const root = path.resolve(__dirname, "../..");
const output = path.join(root, ".codex_tmp", "maafw-blackbox");
const titlePrefix = "\u50cf\u7d20\u7eaa\u5143\uff1a\u4e94\u57df\u8fdc\u5f81";
const baseResolution = [1264, 812];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = { suite: "MaaFramework Win32 black-box", maaVersion: maa.Global.version, screenshots: [], checks: [], bossPatterns: [], monsterSets: [] };
let server = null, launchedWindow = null, controller = null;

async function requestReady() {
  return new Promise(resolve => {
    const request = http.get("http://127.0.0.1:4173/index.html", response => { response.resume(); resolve(response.statusCode === 200); });
    request.setTimeout(600, () => { request.destroy(); resolve(false); }); request.on("error", () => resolve(false));
  });
}

async function ensureServer() {
  if (await requestReady()) return;
  server = spawn(process.execPath, [path.join(__dirname, "static-server.cjs")], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  for (let i = 0; i < 30; i++) { if (await requestReady()) return; await sleep(200); }
  throw new Error("Local game server did not start on port 4173");
}

function chromeExecutable() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  const found = candidates.find(fs.existsSync); if (!found) throw new Error("Chrome or Edge is required for Maa Win32 testing."); return found;
}

async function gameWindows() { return (await maa.Win32Controller.find() || []).filter(row => row[2].startsWith(titlePrefix)); }

async function launchGame() {
  const before = new Set((await gameWindows()).map(row => row[0]));
  const profile = path.join(output, `chrome-profile-${Date.now()}`);
  fs.mkdirSync(profile, { recursive: true });
  const url = `http://127.0.0.1:4173/index.html?qa=1&maa=${Date.now()}`;
  spawn(chromeExecutable(), [`--app=${url}`, `--user-data-dir=${profile}`, "--window-size=1280,820", "--window-position=0,0", "--force-device-scale-factor=1", "--no-first-run"], { cwd: root, detached: false, stdio: "ignore" }).unref();
  for (let i = 0; i < 60; i++) {
    const row = (await gameWindows()).find(candidate => !before.has(candidate[0]));
    if (row) { launchedWindow = row; return row; }
    await sleep(250);
  }
  throw new Error("MaaFramework could not discover the launched game window.");
}

async function runJob(job, label) { await job.wait(); assert.equal(job.succeeded, true, `${label} failed`); return typeof job.get === "function" ? job.get() : undefined; }
async function currentTitle() { return (await maa.Win32Controller.find() || []).find(row => row[0] === launchedWindow[0])?.[2] || ""; }
async function waitTitle(predicate, label, timeout = 6000) {
  const started = Date.now(); let title = "";
  while (Date.now() - started < timeout) { title = await currentTitle(); if (predicate(title)) return title; await sleep(100); }
  throw new Error(`${label}; last native title: ${title}`);
}

function probe(title) {
  const match = title.match(/scene=([^ ]+) inv=(\d+) g=(\d+) mat=(\d+) pot=(\d+) tab=([^ ]+) panel=([^ ]+) forge=(\d+) bgm=([^ ]+) last=(.*)$/);
  assert.ok(match, `Unparseable QA title: ${title}`);
  return { scene: match[1], inventory: Number(match[2]), gold: Number(match[3]), materials: Number(match[4]), potions: Number(match[5]), tab: match[6], panel: match[7], forgeRegion: Number(match[8]), bgm: match[9], last: match[10] };
}

function scaled(x, y) { const [width, height] = controller.resolution; return [Math.round(x / baseResolution[0] * width), Math.round(y / baseResolution[1] * height)]; }
async function click(x, y) { const [sx, sy] = scaled(x, y); await runJob(controller.post_click(sx, sy), `click ${sx},${sy}`); }
async function key(code) { await runJob(controller.post_click_key(code), `key ${code}`); }
async function screenshot(name) {
  const bytes = Buffer.from(await runJob(controller.post_screencap(), `screencap ${name}`));
  assert.ok(bytes.length > 20_000, `${name} screenshot is unexpectedly small`);
  const file = path.join(output, `${name}.png`); fs.writeFileSync(file, bytes);
  report.screenshots.push({ name, file, bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") });
}
const passed = (name, detail = {}) => report.checks.push({ name, ok: true, ...detail });

async function selectQaBiome(index) {
  await click(906, 550); await key(0x24); for (let i = 0; i < index; i++) await key(0x28); await key(0x0d);
  await click(1018, 550); await key(0x23); await key(0x0d);
  await click(1078, 550);
  await waitTitle(title => title.includes(`scene=expedition`) && title.includes(`last=stage:${index}:5`), `enter biome ${index}`);
}

async function closeWindow() {
  if (!controller) return;
  try { await runJob(controller.post_key_down(0x12), "Alt down"); await runJob(controller.post_click_key(0x73), "F4"); await runJob(controller.post_key_up(0x12), "Alt up"); } catch {}
}

(async () => {
  fs.mkdirSync(output, { recursive: true }); await ensureServer(); await launchGame();
  controller = new maa.Win32Controller(launchedWindow[0], maa.Win32ScreencapMethod.FramePool, maa.Win32InputMethod.SendMessage, maa.Win32InputMethod.SendMessage);
  await runJob(controller.post_connection(), "controller connection");
  await runJob(controller.post_screencap(), "initial screencap");
  for (let i = 0; i < 20 && !controller.resolution; i++) await sleep(100);
  assert.ok(controller.connected, "controller did not enter connected state"); assert.equal(controller.resolution?.length, 2, "controller resolution unavailable");
  await waitTitle(title => title.includes("| QA scene=title"), "QA title state");await sleep(1400);await runJob(controller.post_screencap(),"first painted frame");await screenshot("00-title");

  await click(969, 578);
  const fullSaveTitle=await waitTitle(title=>title.includes("scene=camp")&&title.includes("inv=4")&&title.includes("pot=99")&&title.includes("last=full-save-loaded"),"full unlock test save",7000);
  passed("full-unlock test save loads level, resources, potion cap and five legendary weapons",probe(fullSaveTitle));await screenshot("00b-full-unlock-save");

  await click(875, 578);
  const loadoutTitle = await waitTitle(title => title.includes("scene=camp") && title.includes("inv=68") && title.includes("last=loadout"), "QA loadout");
  const loadout = probe(loadoutTitle); assert.equal(loadout.materials, 1980); assert.equal(loadout.gold, 99999); passed("QA loadout and all material images/state loaded", loadout); await screenshot("01-camp-loadout");

  await key(0x42); await waitTitle(title => title.includes("panel=forge-panel"), "open forge"); await screenshot("02-forge-open");
  await click(248, 300); await key(0x24); await key(0x28); await key(0x28); await key(0x0d);
  await waitTitle(title => title.includes("forge=2") && title.includes("last=forge-select:2"), "select tundra forge recipe");
  await click(313, 373); await click(313, 410); await click(700, 550); await key(0x22); await key(0x22); await key(0x22); await screenshot("03-forge-recipe-core-rare");
  const beforeCraft = probe(await currentTitle()); await click(600, 603);
  const craftedTitle = await waitTitle(title => title.includes("last=craft-success:"), "forge completion", 8000);
  const afterCraft = probe(craftedTitle);
  assert.equal(afterCraft.inventory, beforeCraft.inventory + 1); assert.equal(afterCraft.gold, beforeCraft.gold - 85); assert.equal(afterCraft.materials, beforeCraft.materials - 13);
  assert.equal(afterCraft.forgeRegion, 2, "selected forge continent reset after crafting");
  assert.match(afterCraft.last, /^craft-success:r2:q\w+:a\d+:s[1-9]\d*$/); passed("forge preserves selected continent after crafting and charges its exact recipe", { beforeCraft, afterCraft }); await screenshot("04-forge-crafted");

  await key(0x1b); await waitTitle(title => !title.includes("panel=forge-panel"), "close forge"); await key(0x49);
  await waitTitle(title => title.includes("panel=character-panel") && title.includes("tab=equipment"), "open equipment inventory"); await screenshot("05-inventory-equipment");
  // The three inventory tabs occupy the right-hand column of the character modal.
  await click(780, 218); const materialsTitle = await waitTitle(title => title.includes("tab=materials"), "materials inventory tab"); passed("equipment/material inventory separation", probe(materialsTitle)); await screenshot("06-inventory-materials");
  await click(940, 218); const consumableTitle = await waitTitle(title => title.includes("tab=consumables"), "consumables inventory tab"); passed("consumables inventory tab", probe(consumableTitle)); await screenshot("07-inventory-consumables");
  await key(0x1b); await key(0x4d); await waitTitle(title => title.includes("panel=continent-panel"), "continent map"); await screenshot("08-continent-map"); passed("five-region continent map opens from camp");
  const continentPoints = [[390,330],[400,540],[710,300],[910,430],[750,600]];
  for (let biome = 0; biome < continentPoints.length; biome++) {
    const [x,y]=continentPoints[biome]; await click(x,y);
    await click(223,620);
    const mapEntry=await waitTitle(title=>title.includes("scene=expedition")&&title.includes(`last=map-enter:${biome}:1`),`full landmass hit target ${biome}`);
    assert.match(probe(mapEntry).bgm,new RegExp(`^${["forest","waste","tundra","peaks","abyss"][biome]}(?:-\\d+)?:`));
    await key(0x54); await waitTitle(title=>title.includes("scene=camp"),`return from map biome ${biome}`);
    if(biome<continentPoints.length-1){await key(0x4d);await waitTitle(title=>title.includes("panel=continent-panel"),`reopen map ${biome}`);}
  }
  passed("all five complete continent silhouettes are selectable");

  for (let biome = 0; biome < 5; biome++) {
    await selectQaBiome(biome); await screenshot(`10-biome-${biome}-boss-arena`);
    if(biome===0){await key(0x45);const emptyInteract=await waitTitle(value=>value.includes("last=interact:none"),"silent empty E interaction");passed("empty E interaction produces no portal warning",probe(emptyInteract));await click(969,605);await waitTitle(value=>value.includes("last=drops"),"quality-colored ground drops");await screenshot("11-world-drop-labels");}
    for (let pattern = 0; pattern < 4; pattern++) {
      await click(876, 605);
      const title = await waitTitle(value => value.includes(`last=boss:b${biome}:p${pattern}:`), `boss ${biome} pattern ${pattern}`);
      const match = title.match(/last=boss:b(\d+):p(\d+):fx(\d+):pr(\d+):tg(\d+):im(\d+)/); assert.ok(match); assert.ok(Number(match[3]) > 0, title);
      report.bossPatterns.push({ biome, pattern, boundFx: Number(match[3]), projectiles: Number(match[4]), telegraphs: Number(match[5]), impacts: Number(match[6]) });
      await sleep(90);
      await screenshot(`boss-b${biome}-p${pattern}`);
    }
    await click(1060, 578);
    const mobs = await waitTitle(value => value.includes(`last=mobs:b${biome}:a4:`), `monster skills biome ${biome}`);
    report.monsterSets.push({ biome, title: mobs }); await screenshot(`mobs-b${biome}`);
  }
  assert.equal(report.bossPatterns.length, 20); assert.equal(report.monsterSets.length, 5); passed("20 boss patterns all expose bound sprite VFX"); passed("five biomes expose four distinctive monster attacks each");

  await click(1060, 605); await waitTitle(title => title.includes("last=actions-complete"), "walk/run/attack/hurt sequence", 7000); await screenshot("20-player-action-sequence"); passed("player walk, four-frame run, attack and hurt sequence completed");
  await click(1060,632);await waitTitle(title=>title.includes("last=axe-spin"),"axe third-combo spin");await sleep(220);await screenshot("20b-axe-third-combo-spin");passed("axe third combo rotates layered player and weapon with steel-and-dust VFX");
  await key(0x54); const campTitle = await waitTitle(title => title.includes("scene=camp"), "return to camp"); assert.match(probe(campTitle).bgm, /^camp:(playing|loading)$/); passed("return-to-camp flow and camp BGM", probe(campTitle));
  await key(0x4c); await waitTitle(title => title.includes("panel=save-panel"), "save list"); await screenshot("21-save-list"); passed("save list opens from keyboard");

  const uniqueHashes = new Set(report.screenshots.map(item => item.sha256)); assert.ok(uniqueHashes.size >= Math.floor(report.screenshots.length * 0.75), "Too many identical black-box screenshots");
  report.passed = report.checks.length; report.resolution = controller.resolution; report.window = launchedWindow;
  const reportFile = path.join(root, ".codex_tmp", "maafw-blackbox-report.json"); fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`MaaFramework black-box passed: ${report.checks.length} flows, ${report.bossPatterns.length} boss patterns, ${report.screenshots.length} screenshots`); console.log(reportFile);
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(async () => {
  await closeWindow(); if (controller) controller.destroy(); if (server) server.kill();
});
