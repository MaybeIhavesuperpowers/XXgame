"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const rig = readJson("data/characters/player-rig.json");
const catalog = readJson("data/equipment/equipment-catalog.json");
const output = `"use strict";\n\n(() => {\n  const ns = window.PixelEquipment = window.PixelEquipment || {};\n  ns.EMBEDDED_CONFIG = Object.freeze(${JSON.stringify({ rig, catalog }, null, 2)});\n})();\n`;

fs.writeFileSync(path.join(root, "data/equipment/embedded-config.js"), output);
console.log("Synchronized data/equipment/embedded-config.js");
