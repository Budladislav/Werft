import { NextRequest } from "next/server";

import { getGithubRuntimeConfig } from "@/lib/github/config";
import { githubSessionFromRequest, privateJson } from "@/lib/github/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let config;
  try {
    config = getGithubRuntimeConfig();
  } catch {
    return privateJson({ configured: false, connected: false, repositories: [] });
  }

  const session = githubSessionFromRequest(request, config);
  return privateJson({
    configured: true,
    connected: Boolean(session),
    ...(session ? {
      owner: { id: session.ownerId, login: session.ownerLogin },
      expiresAt: new Date(session.expiresAt * 1_000).toISOString(),
    } : {}),
    repositories: config.repositories,
  });
}
