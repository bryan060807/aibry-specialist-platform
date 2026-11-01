// Type-only optional binding for the existing getDb guard; no runtime configuration.
declare module "cloudflare:workers" {
  export const env: { DB?: import("@cloudflare/workers-types").D1Database };
}
