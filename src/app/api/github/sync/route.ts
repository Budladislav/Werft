import { NextRequest } from "next/server";

import { GithubApiError, syncGithubProjects } from "@/lib/github/client";
import { getGithubRuntimeConfig } from "@/lib/github/config";
import {
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
    return privateJson({ error: "GitHub integration is not configured" }, { status: 503 });
  }
  if (!requestIsSameOrigin(request, config.appOrigin)) {
    return privateJson({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const session = githubSessionFromRequest(request, config);
  if (!session) {
    return privateJson({ error: "GitHub connection required" }, { status: 401 });
  }

  try {
    return privateJson(await syncGithubProjects(session.accessToken, config));
  } catch (error) {
    const status = error instanceof GithubApiError
      ? error.status === 429
        ? 429
        : error.status === 401 || error.status === 403
          ? 401
          : 502
      : 502;
    return privateJson({
      error: error instanceof GithubApiError
        ? error.message
        : "GitHub synchronization failed",
    }, { status });
  }
}
