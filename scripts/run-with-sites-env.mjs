import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { projectRoot, sitesEnvironment } from "./sites-env.mjs";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("usage: node scripts/run-with-sites-env.mjs command [args...]");
  process.exit(64);
}

const packageBins = {
  vite: "node_modules/vite/bin/vite.js",
  vinext: "node_modules/vinext/dist/cli.js",
  eslint: "node_modules/eslint/bin/eslint.js",
  "drizzle-kit": "node_modules/drizzle-kit/bin.cjs",
};
const bin = packageBins[command];
if (!bin) {
  console.error(`Unsupported local command: ${command}`);
  process.exit(64);
}

const executable = resolve(projectRoot, bin);
if (!existsSync(executable)) {
  console.error(`${command} is unavailable. Run npm install before continuing.`);
  process.exit(69);
}

const child = spawn(process.execPath, [executable, ...args], {
  cwd: projectRoot,
  env: sitesEnvironment,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Could not start ${command}: ${error.message}`);
  process.exit(69);
});

child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
