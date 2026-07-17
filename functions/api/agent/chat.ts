/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cloudflare Pages Function — mirrors the local Express /api/agent/chat endpoint.
 * Runs on the Cloudflare edge (nodejs_compat) and reuses the exact same
 * orchestration logic as the local dev server via src/server/handleChat.ts.
 */

import { handleChat } from "../../../src/server/handleChat";

export async function onRequestPost(context: { request: Request; env?: Record<string, any> }) {
  // On Cloudflare Pages (Workers runtime) secrets/env vars arrive via context.env,
  // NOT process.env. Inject them as configuration so handleChat can read them.
  const envVars = context.env || {};
  try {
    const body = await context.request.json();
    const result = await handleChat(body, {
      MINIMAX_API_KEY: envVars.MINIMAX_API_KEY,
      MCP_REMOTE_URL: envVars.MCP_REMOTE_URL,
      USE_REMOTE_MCP: envVars.USE_REMOTE_MCP
    });
    return Response.json(result);
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error during chat reasoning." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
