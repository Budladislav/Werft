import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildGeneratedReleaseModule, readReleaseSource } from "./release-lib.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDirectory, "src", "lib", "release-history.generated.ts");
const releases = await readReleaseSource(rootDirectory);
await writeFile(outputPath, buildGeneratedReleaseModule(releases), "utf8");
console.log(`Generated ${path.relative(rootDirectory, outputPath)} with ${releases.length} release(s).`);
