import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildGeneratedReleaseModule, readReleaseSource } from "./release-lib.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageManifest = JSON.parse(await readFile(path.join(rootDirectory, "package.json"), "utf8"));
const releases = await readReleaseSource(rootDirectory);
const expectedVersion = releases[0].version;
const problems = [];

if (packageManifest.version !== expectedVersion) {
  problems.push(`package.json version ${packageManifest.version} does not match CHANGELOG.md ${expectedVersion}`);
}

const domain = await readFile(path.join(rootDirectory, "src", "lib", "domain.ts"), "utf8");
const appVersion = domain.match(/export const APP_VERSION = "([^"]+)"/)?.[1];
if (appVersion !== expectedVersion) {
  problems.push(`APP_VERSION ${appVersion ?? "missing"} does not match CHANGELOG.md ${expectedVersion}`);
}

const serviceWorker = await readFile(path.join(rootDirectory, "public", "sw.js"), "utf8");
const cacheVersions = [...serviceWorker.matchAll(/"werft-(?:static|routes)-v([^"]+)"/g)].map((match) => match[1]);
if (cacheVersions.length < 2 || cacheVersions.some((version) => version !== expectedVersion)) {
  problems.push(`service worker caches ${cacheVersions.join(", ") || "missing"} do not match CHANGELOG.md ${expectedVersion}`);
}

const generatedPath = path.join(rootDirectory, "src", "lib", "release-history.generated.ts");
let generated = "";
try {
  generated = await readFile(generatedPath, "utf8");
} catch {
  problems.push("generated in-app release history is missing; run npm run release:generate");
}
if (generated && generated !== buildGeneratedReleaseModule(releases)) {
  problems.push("in-app release history is stale; run npm run release:generate");
}

if (problems.length) {
  console.error(problems.map((problem) => `- ${problem}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Release metadata is synchronized at ${expectedVersion}.`);
}
