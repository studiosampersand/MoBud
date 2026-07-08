# MoBud v0.000.005 beta setup

## 1. Upload to GitHub

Use the existing repository and upload all website files into:

`/beta-test/`

The result must be:

- `/beta-test/index.html`
- `/beta-test/app.js`
- `/beta-test/styles.css`
- `/beta-test/config.js`
- `/beta-test/manifest.json`
- `/beta-test/service-worker.js`
- `/beta-test/icon-192-v005.png`
- `/beta-test/icon-512-v005.png`
- `/beta-test/icon-maskable-512-v005.png`

Do not add an extra folder level inside `beta-test`.

Test URL before the custom domain is active:

`https://studiosampersand.github.io/MoBud/beta-test/`

After the domain is active:

`https://mobud.app/beta-test/`

## 2. GitHub Pages

Repository → Settings → Pages:

- Source: Deploy from a branch
- Branch: main
- Folder: /root

The production app remains in the repository root. The beta remains in `/beta-test/`.

## 3. Cloudflare Worker

Open Cloudflare → Compute → Workers & Pages → `vialego-api` → Edit code.

Replace the Worker code with `CLOUDFLARE-WORKER.js` from this ZIP and deploy it.

Required allowed origins are already included:

- `https://studiosampersand.github.io`
- `https://mobud.app`

Required Worker secret:

- `ORS_API_KEY`

Optional support integration:

- Secret: `GITHUB_TOKEN`
- Variable: `GITHUB_REPO` with a value such as `studiosampersand/MoBud`

The GitHub token should be fine-grained and limited to:

- Metadata: read-only
- Issues: read and write

## 4. Domain

In GitHub Pages, set the custom domain to `mobud.app`.

At the DNS provider, set the GitHub Pages A records for `@` and a CNAME for `www` pointing to `studiosampersand.github.io`.

Once GitHub validates the domain, enable Enforce HTTPS.

## 5. First test

1. Export a JSON backup from production.
2. Open the beta URL in a normal browser tab.
3. Add a recognisable beta-only trip.
4. Reopen production and confirm the beta trip is not visible there.
5. Add two vehicles of the same type and set one default.
6. Test vehicle type and powertrain filters.
7. Test quick commute, Edit, attachments, calendar, Garage, reports and reminders.
8. Replay the tutorial from FAQ and confirm each step navigates to and highlights the correct element.
9. Send one test feature request and one test bug report.
10. Install the beta PWA only after the browser test succeeds.

Google Drive remains optional and requires a valid Google OAuth client ID before real Drive authentication can work.
