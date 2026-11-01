import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
const root = "packages/asos-kernel/dist";
rmSync(root, { recursive: true, force: true });
execFileSync(
  "node",
  ["node_modules/typescript/bin/tsc", "-p", "tsconfig.kernel.json"],
  { stdio: "inherit" },
);
function rewrite(dir) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) rewrite(path);
    else if (path.endsWith(".js") || path.endsWith(".d.ts")) {
      let source = readFileSync(path, "utf8");
      source = source.replace(
        /(from\s+["'])(\.\.?\/[^"']+)(["'])/g,
        (_, a, b, c) => `${a}${b.endsWith(".js") ? b : b + ".js"}${c}`,
      );
      writeFileSync(path, source);
    }
  }
}
rewrite(root);
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
writeFileSync(
  join(root, "provenance.json"),
  JSON.stringify({
    repository: "bryan060807/aibry-specialist-platform",
    sourceCommit,
    contractVersion: "0.2.0-proposed.1",
  }) + "\n",
);
console.log(
  "Built actual ASOS domain, kernel and application service package.",
);

const sourceDirty = Boolean(
  execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], {
    encoding: "utf8",
  }).trim(),
);
const provenance = {
  repository: "bryan060807/aibry-specialist-platform",
  sourceCommit,
  sourceDirty,
  contractVersion: "0.2.0-proposed.1",
};
writeFileSync(
  join(root, "public/provenance.js"),
  `export const kernelProvenance=Object.freeze(${JSON.stringify(provenance)});\n`,
);
