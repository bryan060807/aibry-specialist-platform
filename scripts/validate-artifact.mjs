import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "./sites-env.mjs";

const workerPath = resolve(projectRoot, "dist/server/index.js");
const hostingPath = resolve(projectRoot, "dist/.openai/hosting.json");

for (const [path, label] of [[workerPath, "Sites Worker entry"], [hostingPath, "packaged Sites manifest"]]) {
  try {
    await access(path, constants.F_OK);
  } catch {
    console.error(`Missing ${label}: ${path.slice(projectRoot.length + 1)}`);
    process.exit(66);
  }
}

JSON.parse(await readFile(hostingPath, "utf8"));
const workerUrl = pathToFileURL(workerPath);
workerUrl.searchParams.set("sites-validation", `${process.pid}-${Date.now()}`);
const worker = await import(workerUrl.href);
if (!worker.default || typeof worker.default.fetch !== "function") {
  throw new Error("dist/server/index.js must have an ESM default export with fetch(request, env, ctx)");
}

console.log("Validated Sites artifact: ESM Worker default.fetch and hosting manifest are present.");
