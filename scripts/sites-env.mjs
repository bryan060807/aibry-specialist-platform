import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeRoot = resolve(process.env.SITES_RUNTIME_ROOT ?? `${projectRoot}/.sites-runtime`);

for (const directory of ["home", "npm-cache", "xdg-config", "tmp", "wrangler/logs"]) {
  mkdirSync(resolve(runtimeRoot, directory), { recursive: true });
}

export const sitesEnvironment = {
  ...process.env,
  SITES_ENV_READY: "1",
  SITES_PROJECT_ROOT: projectRoot,
  HOME: resolve(runtimeRoot, "home"),
  XDG_CONFIG_HOME: resolve(runtimeRoot, "xdg-config"),
  TMPDIR: resolve(runtimeRoot, "tmp"),
  WRANGLER_WRITE_LOGS: "false",
  WRANGLER_LOG_PATH: resolve(runtimeRoot, "wrangler/logs"),
  MINIFLARE_REGISTRY_PATH: resolve(runtimeRoot, "wrangler/registry"),
  npm_config_cache: resolve(runtimeRoot, "npm-cache"),
  npm_config_audit: "false",
  npm_config_fund: "false",
  npm_config_update_notifier: "false",
};

delete sitesEnvironment.NPM_CONFIG_CACHE;
delete sitesEnvironment.npm_config_proxy;
delete sitesEnvironment.npm_config_http_proxy;
delete sitesEnvironment.npm_config_https_proxy;
delete sitesEnvironment.NPM_CONFIG_PROXY;
delete sitesEnvironment.NPM_CONFIG_HTTP_PROXY;
delete sitesEnvironment.NPM_CONFIG_HTTPS_PROXY;

export { projectRoot, runtimeRoot };
