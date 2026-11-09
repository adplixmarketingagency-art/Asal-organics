// Reads the password only from stdin. Never pass it in a command-line argument.
// Example: a password-manager pipe | node scripts/set-owner-password.mjs owner@example.com
import { randomBytes, scryptSync } from "node:crypto";
import { spawn } from "node:child_process";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Provide the owner login email.");
let password = "";
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/\r?\n$/, "");
if (password.length < 12 || password.length > 256) throw new Error("Use a password between 12 and 256 characters.");
const salt = randomBytes(16).toString("hex");
const key = scryptSync(password, Buffer.from(salt, "hex"), 32, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
password = "";
const child = spawn(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "secret", "bulk"], { stdio: ["pipe", "inherit", "inherit"] });
child.stdin.end(JSON.stringify({ ADMIN_LOGIN_EMAIL: email, ADMIN_PASSWORD_HASH: `scrypt:32768:8:3:${salt}:${key.toString("hex")}` }));
child.on("exit", (code) => { process.exitCode = code ?? 1; });
