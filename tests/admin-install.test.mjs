import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(source("public/owner-app.webmanifest"));

test("owner app starts at the protected inbox with a stable private scope", () => {
  assert.equal(manifest.id, "/admin/orders");
  assert.equal(manifest.start_url, "/admin/orders");
  assert.equal(manifest.scope, "/admin/");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.prefer_related_applications, false);
  assert.doesNotMatch(JSON.stringify(manifest), /token|customer|receipt|password/i);
});

test("install icons have real PNG dimensions, including a maskable icon and iOS icon", () => {
  for (const icon of [...manifest.icons, { src: "/icons/owner-180.png", sizes: "180x180" }]) {
    const file = readFileSync(new URL(`../public${icon.src}`, import.meta.url));
    assert.equal(file.toString("ascii", 1, 4), "PNG");
    assert.equal(`${file.readUInt32BE(16)}x${file.readUInt32BE(20)}`, icon.sizes);
  }
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
});

test("installation has iOS guidance, an optional native prompt and no offline data storage", () => {
  const component = source("src/components/AdminInstall.tsx");
  assert.match(component, /beforeinstallprompt/);
  assert.match(component, /appinstalled/);
  assert.match(component, /display-mode: standalone/);
  assert.match(component, /Safari.*Share → Add to Home Screen/);
  assert.match(component, /does not enable background push/);
  assert.doesNotMatch(component, /serviceWorker\.register|caches\.open|localStorage|indexedDB/);
  const layout = source("src/app/admin/layout.tsx");
  assert.match(layout, /manifest: "\/owner-app.webmanifest"/);
  assert.match(layout, /appleWebApp: \{ capable: true/);
  assert.match(layout, /viewportFit: "cover"/);
  assert.doesNotMatch(layout, /userScalable: false|maximumScale: 1/);
});
