import assert from "node:assert/strict";
import test from "node:test";

const canonicalLink =
  /<link(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/specialists\.aibry\.shop\/?["'])[^>]*>/i;

test("renders production metadata and security headers", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.equal(response.headers.get("cache-control"), "public, max-age=0, must-revalidate");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.doesNotMatch(response.headers.get("content-security-policy") ?? "", /https?:\/\//);

  const html = await response.text();
  assert.match(html, canonicalLink);
  assert.match(html, /<meta(?=[^>]*\bproperty=["']og:title["'])[^>]*>/i);
  assert.match(html, /<meta(?=[^>]*\bname=["']twitter:card["'])(?=[^>]*\bcontent=["']summary["'])[^>]*>/i);
  assert.match(html, /<link(?=[^>]*\brel=["']manifest["'])[^>]*\bhref=["'](?:\/manifest\.webmanifest|https:\/\/specialists\.aibry\.shop\/manifest\.webmanifest)["'][^>]*>/i);
});
