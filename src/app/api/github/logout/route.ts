import { NextRequest, NextResponse } from "next/server";

import { revokeGithubOAuthToken } from "@/lib/github/client";
import { GITHUB_SESSION_COOKIE, getGithubRuntimeConfig } from "@/lib/github/config";
import {
  clearGithubCookies,
  githubSessionFromRequest,
  privateJson,
  requestIsSameOrigin,
} from "@/lib/github/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let config;
  try {
    config = getGithubRuntimeConfig();
  } catch {
    const response = privateJson({ ok: true });
    response.cookies.set(GITHUB_SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return response;
  }
  if (!requestIsSameOrigin(request, config.appOrigin)) {
    return privateJson({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const session = githubSessionFromRequest(request, config);
  if (session) {
    await revokeGithubOAuthToken(session.accessToken, config).catch(() => undefined);
  }
  const response: NextResponse = privateJson({ ok: true });
  clearGithubCookies(response);
  return response;
}
