import { readFile } from "node:fs/promises";
import path from "node:path";

const RELEASE_HEADING = /^##\s+\[?v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\]?\s*(?:—|-)\s*(\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})(?:\s+(?:—|-)\s+(.+?))?\s*$/;

function normalizeReleaseDate(value) {
  const legacy = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return legacy ? `${legacy[3]}-${legacy[2]}-${legacy[1]}` : value;
}

export async function readReleaseSource(rootDirectory) {
  const changelog = await readFile(path.join(rootDirectory, "CHANGELOG.md"), "utf8");
  return parseReleaseHistory(changelog);
}

export function parseReleaseHistory(changelog) {
  const releases = [];
  let currentRelease = null;
  let currentSection = null;

  for (const rawLine of changelog.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    const release = line.match(RELEASE_HEADING);
    if (release) {
      currentRelease = {
        version: release[1],
        releasedAt: normalizeReleaseDate(release[2]),
        title: release[3]?.trim() || null,
        sections: [],
      };
      releases.push(currentRelease);
      currentSection = null;
      continue;
    }
    if (line.startsWith("## ")) {
      currentRelease = null;
      currentSection = null;
      continue;
    }
    if (!currentRelease) continue;

    const section = line.match(/^###\s+(.+)$/);
    if (section) {
      currentSection = { title: section[1].trim(), items: [] };
      currentRelease.sections.push(currentSection);
      continue;
    }
    const item = line.match(/^[-*]\s+(.+)$/);
    if (item) {
      if (!currentSection) {
        currentSection = { title: "Изменено", items: [] };
        currentRelease.sections.push(currentSection);
      }
      currentSection.items.push(item[1].trim());
    }
  }

  if (!releases.length) throw new Error("CHANGELOG.md does not contain a dated semantic release");
  return releases;
}

export function buildGeneratedReleaseModule(releases) {
  return `/* This file is generated from CHANGELOG.md. Do not edit it manually. */
export type AppReleaseHistoryEntry = {
  version: string;
  releasedAt: string;
  title: string | null;
  sections: Array<{ title: string; items: string[] }>;
};

export const APP_RELEASE_HISTORY: AppReleaseHistoryEntry[] = ${JSON.stringify(releases, null, 2)};
`;
}
