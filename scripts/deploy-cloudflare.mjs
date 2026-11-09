import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const staging = await mkdtemp(join(tmpdir(), "asal-deploy-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
// Build with only basic system variables: local payment/database credentials
// must not be compiled into OpenNext's next-env.mjs or standalone output.
const buildEnv = Object.fromEntries(
  ["PATH", "HOME", "USERPROFILE", "SYSTEMROOT", "TEMP", "TMP", "TMPDIR"]
    .filter((key) => process.env[key] !== undefined)
    .map((key) => [key, process.env[key]]),
);
Object.assign(buildEnv, { CI: "true", NEXT_TELEMETRY_DISABLED: "1", WRANGLER_SEND_METRICS: "false" });
const deployEnv = {
  ...buildEnv,
  ...Object.fromEntries(
    ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_KEY", "CLOUDFLARE_EMAIL"]
      .filter((key) => process.env[key] !== undefined)
      .map((key) => [key, process.env[key]]),
  ),
};

function run(command, args, env = buildEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: staging, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Deployment command failed (${signal ?? code}).`));
    });
  });
}

try {
  // An allowlist includes current source edits, but excludes .env*, .dev.vars*,
  // credentials, local config/, Git history, and old generated bundles.
  for (const name of [
    "src", "public", "migrations", "package.json", "package-lock.json", "tsconfig.json",
    "next-env.d.ts", "next.config.ts", "open-next.config.ts", "wrangler.jsonc", "worker.js",
  ]) {
    await cp(join(root, name), join(staging, name), { recursive: true });
  }
  console.log("Building an isolated deployment without local environment files.");
  await run(npm, ["ci", "--no-audit", "--no-fund"]);
  await run(npm, ["run", "build:cloudflare"]);
  const compiledEnv = await readFile(join(staging, ".open-next/cloudflare/next-env.mjs"), "utf8");
  for (const mode of ["production", "development", "test"]) {
    if (!compiledEnv.includes(`export const ${mode} = {};`)) {
      throw new Error("Refusing deployment: unexpected environment values in the generated Worker.");
    }
  }
  console.log("Verified: no local environment values embedded. Deploying with existing Worker secrets.");
  // Only deployment receives the caller's Cloudflare authentication environment.
  await run(process.execPath, ["node_modules/@opennextjs/cloudflare/dist/cli/index.js", "deploy"], deployEnv);
} finally {
  await rm(staging, { recursive: true, force: true });
}
