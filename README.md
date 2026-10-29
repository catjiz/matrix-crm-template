# Matrix CRM (template)

A single-page CRM and production tracker for a small molding / manufacturing shop: leads, quotes,
design, prototyping, tooling and floor operations boards, tasks, KPIs, plus optional Firebase Cloud
Functions (Gmail sync, lead intake webhook, backups, bot write API).

**All data in this repo is fictional example data.** Companies, people, emails and numbers in
`tools/seed-example.mjs` and `seed-data.js` are made up for training.

## Layout
- `index.html`, `app.js`, `styles.css`, `matrix-cloud.js`, `migrate-v12.js`, `sw.js`: the app.
- `firebase-config.js`: your Firebase web config and email allowlist (edit this).
- `firestore.rules`: security rules with the same allowlist (edit this).
- `seed-data.js`: board structure plus example deals (local use only).
- `public/`: what Hosting serves. Built by `python3 tools/build-public.py` (strips deals from the seed).
- `functions/`: optional Cloud Functions (Node 22).
- `tools/seed-example.mjs`: loads ~8 fictional companies and 12 fictional deals.

## Setup
1. **Create a Firebase project** at https://console.firebase.google.com (Blaze plan is needed only for Functions).
2. **Auth**: Build > Authentication > Get started > Sign-in method > enable **Google**.
   Add your Hosting domain under Authentication > Settings > Authorized domains if it is not listed.
3. **Firestore**: Build > Firestore Database > Create database (production mode).
4. **Web app config**: Project settings > General > Your apps > Add web app. Copy the config values into
   `firebase-config.js` (`window.MATRIX_FIREBASE`).
5. **Allowlist**: replace `you@example.com` / `teammate@example.com` with your team's Google emails
   (lowercase) in BOTH `firebase-config.js` (`window.MATRIX_ALLOWLIST`) and `firestore.rules`
   (`allowedEmail()`). The rules also name one owner email for admin-only actions; search
   `firestore.rules` and `functions/index.js` (`ADMIN_EMAILS`) for `you@example.com`.
   Other placeholders to search for: `YOUR-PROJECT-ID`, `sales@example.com`, `bot@example.com`.
6. **CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   cp .firebaserc.example .firebaserc   # then put your project id in it
   firebase use YOUR-PROJECT-ID
   ```
7. **Build and deploy**:
   ```bash
   python3 tools/build-public.py
   firebase deploy --only hosting,firestore:rules,firestore:indexes
   ```
   Open `https://YOUR-PROJECT-ID.web.app` and sign in with an allowlisted Google account.

## Example data
```bash
node tools/seed-example.mjs --local      # puts example deals in ./seed-data.js
python3 -m http.server 8000              # open http://localhost:8000 and use Admin > Reload seed
# or write straight to Firestore:
(cd functions && npm install)
gcloud auth application-default login
GCLOUD_PROJECT=YOUR-PROJECT-ID node tools/seed-example.mjs --firestore
```
If Firestore `workspace/main` is empty, the app also uploads the local seed on first sign-in.

## Functions (optional)
```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```
Secrets are read with `defineSecret`; set the ones you use before deploying:
```bash
firebase functions:secrets:set GMAIL_OAUTH_CLIENT_ID       # Gmail sync (optional)
firebase functions:secrets:set GMAIL_OAUTH_CLIENT_SECRET
firebase functions:secrets:set JOTFORM_WEBHOOK_SECRET      # lead intake webhook (optional)
firebase functions:secrets:set LEAD_ALERT_WEBHOOK_URL      # new-lead alerts (optional)
firebase functions:secrets:set LEAD_ALERT_WEBHOOK_KEY
```
Gmail OAuth: in Google Cloud console create an OAuth client (Web application), add
`https://YOUR-PROJECT-ID.web.app/api/gmailLink` as a redirect URI, enable the Gmail API, and set
the mailbox list in `app.js` (`GMAIL_MAILBOXES`) and `functions/gmail-functions.js`.

If your organization blocks public invokers, browser-called functions may need
`gcloud run services update <service> --region us-central1 --no-invoker-iam-check`.

Backups (`functions/backup.js`) expect a private bucket named `YOUR-PROJECT-ID-backups`.

## Notes
Never commit service-account keys, `.env` files or real customer data. `.firebaserc` is gitignored.
