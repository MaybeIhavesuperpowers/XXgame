"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "../..");
for (const suite of ["whitebox.cjs", "blackbox.cjs"]) {
  const result = spawnSync(process.execPath, [path.join(__dirname, suite)], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("MaaFramework full release suite passed.");
