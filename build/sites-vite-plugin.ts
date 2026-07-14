import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export function sites(): Plugin {
  let root = process.cwd();
  let outDir = "dist";

  return {
    name: "sites-hosting-manifest",
    enforce: "post",
    configResolved(config) {
      root = config.root;
      outDir = config.build.outDir;
    },
    async closeBundle() {
      const manifest = resolve(root, ".openai/hosting.json");
      const destination = resolve(root, outDir, ".openai/hosting.json");
      await mkdir(resolve(root, outDir, ".openai"), { recursive: true });
      await copyFile(manifest, destination);
    },
  };
}
