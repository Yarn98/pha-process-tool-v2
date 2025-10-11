# Cloudflare Pages — Deploy for pha-process-tool-v2 (Static SPA)

**What this repo looks like**
- Project contains `dist/`, `public/`, and `src/` with no runtime dependencies.
- We will deploy the **static build in `dist/`** to Cloudflare Pages.

## Dashboard settings
1. Framework preset: **None**
2. Build command: *(leave empty)* — or set to `:` (no-op) to be explicit.
3. Build output directory: **dist**
4. Environment variables: none required
5. (Optional) Add a custom domain under **Custom domains** after first deploy.

## SPA routing (no 404 on deep links)
This patch adds `_redirects` with:

```
/* /index.html 200
```

Put it in `public/` (for builds that copy public → dist) **and** in `dist/` (for direct-publish of dist).

## Local preview with Wrangler (optional)
This `wrangler.toml` sets a Pages output directory so you can run:

```bash
npx wrangler pages dev --local
```

> If your project later becomes a full Next.js app with SSR/ISR, switch to **Workers + OpenNext** instead of Pages.
