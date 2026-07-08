# MoBud v0.000.007 deployment

## Beta
Upload the complete contents of the beta ZIP directly into `/beta-test/`.

## Production
Upload the complete contents of the production ZIP directly into the repository root.

Keep `CLOUDFLARE-WORKER.js` out of the public site if preferred; deploy its contents in Cloudflare Workers.

Before production deployment, export a JSON backup from both the current production app and beta.
