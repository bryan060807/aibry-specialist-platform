const DEFAULT_SITE_URL = "https://specialists.aibry.shop";
const REQUEST_TIMEOUT_MS = 15_000;

function configuredSiteUrl() {
  const value = process.env.SITE_URL?.trim() || DEFAULT_SITE_URL;
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("SITE_URL must be an absolute http(s) URL.");
  }

  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("SITE_URL must be an origin-only http(s) URL without credentials, a query, or a fragment.");
  }

  return url;
}

const SECURITY_HEADERS = {
  "content-security-policy": "default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "permissions-policy": "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

async function request(baseUrl, path, accept) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(new URL(path, baseUrl), {
      redirect: "manual",
      signal: controller.signal,
      headers: { accept, "user-agent": "aibry-specialist-platform-smoke-check/1.0" },
    });
  } catch (error) {
    const reason = error?.name === "AbortError" ? "timed out" : "network request failed";
    throw new Error(`${path}: ${reason}`);
  } finally {
    clearTimeout(timeout);
  }
}

function expect(condition, message, failures) {
  if (!condition) failures.push(message);
}

async function checkRoute(baseUrl, { path, status, accept = "*/*", inspect }, failures) {
  const response = await request(baseUrl, path, accept);
  console.log(`${path}: ${response.status}`);
  expect(response.status === status, `${path}: expected ${status}, received ${response.status}`, failures);
  await inspect?.(response, failures);
}

async function main() {
  const baseUrl = configuredSiteUrl();
  const failures = [];

  console.log(`Production smoke check: ${baseUrl.origin}`);
  await checkRoute(baseUrl, {
    path: "/",
    status: 200,
    accept: "text/html",
    inspect: async (response, routeFailures) => {
      const html = await response.text();
      expect(/<link(?=[^>]*\brel=["']canonical["'])[^>]*>/i.test(html), "/: canonical link is missing", routeFailures);
      expect(/<meta(?=[^>]*\bname=["']description["'])[^>]*>/i.test(html), "/: description metadata is missing", routeFailures);
      expect(/<meta(?=[^>]*\bproperty=["']og:title["'])[^>]*>/i.test(html), "/: Open Graph title metadata is missing", routeFailures);
      for (const [name, expected] of Object.entries(SECURITY_HEADERS)) {
        expect(response.headers.get(name) === expected, `/: ${name} does not match the Worker security-header contract`, routeFailures);
      }
    },
  }, failures);
  await checkRoute(baseUrl, { path: "/robots.txt", status: 200 }, failures);
  await checkRoute(baseUrl, { path: "/sitemap.xml", status: 200 }, failures);
  await checkRoute(baseUrl, { path: "/manifest.webmanifest", status: 200 }, failures);
  await checkRoute(baseUrl, {
    path: "/__aibry_smoke_check_missing__",
    status: 404,
    accept: "text/html",
    inspect: async (response, routeFailures) => {
      const html = await response.text();
      expect(response.headers.get("content-type")?.toLowerCase().startsWith("text/html"), "/__aibry_smoke_check_missing__: expected an HTML 404 response", routeFailures);
      expect(html.includes("404 / NOT FOUND") && html.includes("That page is outside the platform."), "/__aibry_smoke_check_missing__: custom 404 content is missing", routeFailures);
    },
  }, failures);

  if (failures.length) {
    console.error("Production smoke check failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log("Production smoke check passed.");
}

main().catch((error) => {
  console.error(`Production smoke check failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 1;
});
