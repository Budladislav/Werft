import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconDirectory = path.join(rootDirectory, "public", "icons");
const regularSvg = await readFile(path.join(iconDirectory, "werft.svg"));
const maskableSvg = await readFile(path.join(iconDirectory, "werft-maskable.svg"));

await Promise.all([
  sharp(regularSvg).resize(192, 192).png().toFile(path.join(iconDirectory, "werft-192.png")),
  sharp(regularSvg).resize(512, 512).png().toFile(path.join(iconDirectory, "werft-512.png")),
  sharp(maskableSvg).resize(512, 512).png().toFile(path.join(iconDirectory, "werft-maskable-512.png")),
]);

console.log("Generated 192px, 512px and maskable PWA icons from the canonical SVG artwork.");
