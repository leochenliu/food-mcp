<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dee89d7d-7446-4459-acef-b9796574a70d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `MINIMAX_API_KEY` in [.env.local](.env.local) to your MiniMax API key (model: `MiniMax-M3`, domain `api.minimaxi.com`)
3. Run the app:
   `npm run dev`

---

## Deploy to Cloudflare Pages (production)

The full-stack app (React frontend + the MiniMax chat API) is deployed to Cloudflare Pages:

- **Live site:** https://food-mcp-app.pages.dev
- **API endpoint:** https://food-mcp-app.pages.dev/api/agent/chat
- **MCP backend (Worker):** https://mcd-mcp-server.leochenliu.workers.dev/mcp

Deployment steps:
1. `npm run build` (builds the static frontend into `dist/`)
2. `npx wrangler pages project create food-mcp-app --production-branch main` (one-time)
3. `npx wrangler pages secret put MINIMAX_API_KEY --project-name food-mcp-app` (sets the model key)
4. `npx wrangler pages deploy dist --project-name food-mcp-app`

The API is served by a Cloudflare Pages Function (`functions/api/agent/chat.ts`) that reuses the exact same orchestration logic as the local dev server (`src/server/handleChat.ts`), so cloud and local behavior stay identical. The Pages project config lives in the root `wrangler.toml`.
