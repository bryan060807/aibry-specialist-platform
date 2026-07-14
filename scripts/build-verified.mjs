import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot, sitesEnvironment } from "./sites-env.mjs";

function duration(value, name) {
  const match = /^(\d+)(ms|s|m|h)$/.exec(value);
  if (!match) throw new Error(`${name} must be a positive duration such as 30s or 3m`);
  const multiplier = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000 }[match[2]];
  return Number(match[1]) * multiplier;
}

const vinext = resolve(projectRoot, "node_modules/vinext/dist/cli.js");
if (!existsSync(vinext)) {
  console.error("vinext is unavailable. Run npm install before building.");
  process.exit(69);
}

const timeout = duration(process.env.SITES_BUILD_TIMEOUT ?? "3m", "SITES_BUILD_TIMEOUT");
const killAfter = duration(process.env.SITES_BUILD_KILL_AFTER ?? "10s", "SITES_BUILD_KILL_AFTER");
console.log("Running bounded vinext build...");
const child = spawn(process.execPath, [vinext, "build"], {
  cwd: projectRoot,
  env: sitesEnvironment,
  stdio: "inherit",
});

let timedOut = false;
let exited = false;
const terminateTimer = setTimeout(() => {
  timedOut = true;
  console.error(`vinext build exceeded ${process.env.SITES_BUILD_TIMEOUT ?? "3m"}; terminating.`);
  child.kill();
}, timeout);
const killTimer = setTimeout(() => {
  if (timedOut && !exited) child.kill("SIGKILL");
}, timeout + killAfter);

const result = await new Promise((resolveResult, reject) => {
  child.once("error", reject);
  child.once("exit", (code, signal) => resolveResult({ code, signal }));
});
clearTimeout(terminateTimer);
clearTimeout(killTimer);
exited = true;

if (timedOut || result.code !== 0 || result.signal) {
  process.exitCode = 1;
} else {
  try {
    await import(`${pathToFileURL(resolve(projectRoot, "scripts/validate-artifact.mjs")).href}?build=${Date.now()}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
