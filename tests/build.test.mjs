import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import config from "../open-next.config.ts";

const { scripts } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("the Git integration's default build creates the Cloudflare bundle", () => {
  assert.equal(scripts.build, "npm run build:cloudflare");
  assert.equal(scripts["build:cloudflare"], "opennextjs-cloudflare build");
});

test("OpenNext runs a separate Next.js build without recursing into itself", () => {
  assert.equal(config.buildCommand, "npm run build:next");
  assert.equal(scripts["build:next"], "next build");
});

test("production build scripts never deploy or run deployment lifecycle hooks", () => {
  for (const name of ["build", "build:cloudflare", "build:next"]) {
    assert.doesNotMatch(scripts[name] ?? "", /\bdeploy\b|\bpreview\b/);
    assert.equal(scripts[`pre${name}`], undefined);
    assert.equal(scripts[`post${name}`], undefined);
  }
});
