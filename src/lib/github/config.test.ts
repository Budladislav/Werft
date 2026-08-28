import { describe, expect, it } from "vitest";

import {
  DEFAULT_GITHUB_REPOSITORIES,
  GITHUB_OWNER_ID,
  configuredGithubRepositories,
  githubRepositoryTargets,
  type GithubRuntimeConfig,
} from "./config";

describe("GitHub allowlist configuration", () => {
  it("includes exactly the five approved repositories by default", () => {
    expect(DEFAULT_GITHUB_REPOSITORIES).toEqual([
      "Flow",
      "Planer",
      "safe-play",
      "fitness-tracker",
      "ChronoAtlas",
    ]);
  });

  it("allows a canonicalized subset and rejects repositories outside the catalog", () => {
    expect(configuredGithubRepositories("flow,PLANER,flow")).toEqual(["Flow", "Planer"]);
    expect(() => configuredGithubRepositories("ren2gar")).toThrow(/allowlist/);
    expect(() => configuredGithubRepositories("Snake-game")).toThrow(/allowlist/);
  });

  it("binds MonoFocus to its custom changelog without changing owner identity", () => {
    const config: GithubRuntimeConfig = {
      appOrigin: "https://werft.example",
      clientId: "client",
      clientSecret: "secret",
      sessionSecret: Buffer.alloc(32).toString("base64url"),
      ownerLogin: "Budladislav",
      ownerId: GITHUB_OWNER_ID,
      repositories: ["Planer"],
    };
    expect(githubRepositoryTargets(config)).toEqual([{
      ownerLogin: "Budladislav",
      ownerId: GITHUB_OWNER_ID,
      name: "Planer",
      changelogPaths: ["CHANGELOG_MONOFOCUS.md", "CHANGELOG.md"],
    }]);
  });
});
