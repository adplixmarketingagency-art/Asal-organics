// Run locally: node --experimental-strip-types scripts/generate-brand-assets.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { brandLetterPaths, brandFlourishPath, oilDropPath } from "../src/content/brand-artwork.ts";

const root = new URL("../", import.meta.url);
const output = (path) => fileURLToPath(new URL(`public/${path}`, root));
const green = "#153e35";
const cream = "#fffdf8";
const gold = "#a47b31";
const lightGold = "#c9ae70";
const vector = (body, width, height) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
);
const lettering = (x, y, width, ink, accent) =>
  `<svg x="${x}" y="${y}" width="${width}" height="${width * 1110 / 3040}" viewBox="0 0 3040 1110"><g fill="${ink}">${brandLetterPaths.map((d) => `<path d="${d}"/>`).join("")}</g><g fill="${accent}"><path d="${oilDropPath}"/><path d="${brandFlourishPath}"/></g></svg>`;

async function textOverlay(text, font, file, size, color, top, canvasWidth) {
  const { data, info } = await sharp({ text: {
    text: `<span foreground="${color}">${text}</span>`,
    font: `${font} ${size}`,
    fontfile: fileURLToPath(new URL(`public/fonts/${file}`, root)),
    rgba: true, dpi: 72,
  } }).png().toBuffer({ resolveWithObject: true });
  return { input: data, top, left: Math.round((canvasWidth - info.width) / 2) };
}

await sharp(vector(`<rect width="600" height="240" fill="${cream}"/>${lettering(85, 12, 430, green, gold)}`, 600, 240))
  .composite([await textOverlay("Asal Iyarkai Angadi", "DM Sans", "dm-sans-500.ttf", 26, green, 196, 600)])
  .png().toFile(output("images/asal-logo.png"));

await sharp(vector(`<rect width="1200" height="630" fill="${green}"/><rect x="28" y="28" width="1144" height="574" rx="12" fill="none" stroke="${lightGold}" stroke-width="2"/>${lettering(350, 70, 500, cream, lightGold)}`, 1200, 630))
  .composite([
    await textOverlay("Asal Iyarkai Angadi", "Fraunces", "fraunces-400.ttf", 60, cream, 302, 1200),
    await textOverlay("Oils &amp; traditional foods", "DM Sans", "dm-sans-400.ttf", 28, "#d7dec8", 402, 1200),
    await textOverlay("asaliyarkaiangadi.in", "DM Sans", "dm-sans-400.ttf", 24, "#d7dec8", 518, 1200),
  ])
  .png().toFile(output("images/asal-social.png"));

// Include Next's file-based icons, which otherwise keep serving the old mark.
// At icon sizes use the same oil-drop device, without illegible miniature text.
for (const [path, size] of [
  ["public/brand-icon.png", 96],
  ["public/apple-touch-icon.png", 180],
  ["src/app/icon.png", 512],
  ["src/app/apple-icon.png", 180],
]) {
  await sharp(vector(`<rect width="96" height="96" rx="19" fill="${green}"/><svg x="26" y="13" width="44" height="68" viewBox="2383 10 156 240"><path fill="${lightGold}" d="${oilDropPath}"/></svg>`, 96, 96))
    .resize(size, size).png().toFile(fileURLToPath(new URL(path, root)));
}
console.log("Generated logo, social card and icons from the shared Tamil artwork.");
