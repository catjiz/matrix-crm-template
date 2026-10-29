# Getting Started with Matrix CRM

This guide is for people who are not developers. Follow the steps in order. Plan on about an hour.
Everything in this repo is fake example data, so you can't break anything real.

You will need:
- A Google account (Gmail or Google Workspace)
- A computer running Mac, Windows or Linux
- A credit card, but only if you want the optional Cloud Functions (see step 3)

---

## 1. Create a GitHub account
1. Go to https://github.com and click **Sign up**.
2. Pick a username, enter your email and a password, then verify your email.

## 2. Get your own copy of the code
Pick one of these:
- **Use the template (recommended).** Open https://github.com/catjiz/matrix-crm-template, click
  **Use this template**, then **Create a new repository**. Name it and choose **Private**.
- **Fork it.** Click **Fork** on the same page. A fork stays linked to the original repo.

Next, download your copy to your computer:
1. On your repo page, click the green **Code** button and copy the URL.
2. Install Git from https://git-scm.com if you don't have it yet.
3. Open a terminal (Mac: Terminal app. Windows: "Git Bash", which installs with Git) and run:
   ```bash
   git clone PASTE-YOUR-URL-HERE
   cd YOUR-REPO-NAME
   ```
   Run every later command from inside this folder.

## 3. Create a Firebase project
1. Go to https://console.firebase.google.com and sign in with Google.
2. Click **Create a project**, give it a name and finish the steps. Google Analytics is optional.
3. Write down your **Project ID**, which looks like `my-shop-crm-1a2b3`. You'll need it later.
4. **Billing note:** Hosting, Auth and Firestore work on the free **Spark** plan. Cloud Functions
   (Gmail sync, lead webhooks, backups) need the pay-as-you-go **Blaze** plan. Click **Upgrade** in
   the bottom left of the console to switch. Small shops usually stay within the free usage, but
   it's a good idea to set a budget alert.

## 4. Turn on Google sign-in
1. In the console, open **Build > Authentication** and click **Get started**.
2. Under **Sign-in method**, click **Google**, switch it on, pick a support email and click **Save**.

## 5. Create the database (Firestore)
1. Open **Build > Firestore Database** and click **Create database**.
2. Pick a location near you (for example `us-central1`) and choose **production mode**.

## 6. Put your web config into firebase-config.js
1. Click the gear icon, then **Project settings**.
2. Under **Your apps**, click the web icon (`</>`), enter a nickname and click **Register app**.
   You can skip "Firebase Hosting setup" here.
3. You'll see a block called `firebaseConfig`. Open `firebase-config.js` in a text editor (VS Code
   is free at https://code.visualstudio.com) and copy each value into the matching field of
   `window.MATRIX_FIREBASE`: `apiKey`, `authDomain`, `projectId`, `storageBucket`,
   `messagingSenderId` and `appId`.

This web config is meant to be public. Your data is protected by the allowlist in the next step.

## 7. Decide who can sign in (the allowlist)
List the same emails in all three places. Use lowercase.
1. `firebase-config.js`: edit `window.MATRIX_ALLOWLIST`. Replace `you@example.com` and
   `teammate@example.com` with real Google emails.
2. `firestore.rules`: edit the list inside `allowedEmail()`. Also replace the other
   `you@example.com` lines in that file with the owner's email. The owner is the person allowed
   to run admin-only actions.
3. `functions/index.js`: set `ADMIN_EMAILS` to the owner's email.

Tip: use your editor's "Find in files" to search for `example.com` and `YOUR-PROJECT-ID`, and
replace anything you need.

## 8. Install Node.js and the Firebase CLI
1. Install the **LTS** version of Node.js from https://nodejs.org.
2. In the terminal, run:
   ```bash
   npm install -g firebase-tools
   ```
   On Mac, if you get a permissions error, run `sudo npm install -g firebase-tools` instead.
3. Check that it worked: `firebase --version` should print a number.
4. You also need Python 3 to build the site. Macs and Linux usually have it already. On Windows,
   install it from https://python.org.

## 9. Log in and pick your project
```bash
firebase login
cp .firebaserc.example .firebaserc
firebase use YOUR-PROJECT-ID
```
`firebase login` opens a browser window. Sign in with the same Google account you used in step 3.

## 10. Deploy
Build the site, then send the site, rules and indexes to Firebase:
```bash
python3 tools/build-public.py
firebase deploy --only hosting,firestore:rules,firestore:indexes
```
If you are on the Blaze plan and want the Cloud Functions too:
```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```
The functions run fine without the optional secrets. See the README if you want Gmail sync or
lead webhooks.

When the deploy finishes, it prints your site address: `https://YOUR-PROJECT-ID.web.app`.

## 11. Load the fake example data
The repo includes 8 made-up companies and 12 made-up deals. Here are two ways to load them.

**Option A (simplest):** if your database is still empty, the app uploads the example data the
first time you sign in. Just go on to step 12.

**Option B (from your computer):**
```bash
cd functions && npm install && cd ..
gcloud auth application-default login
GCLOUD_PROJECT=YOUR-PROJECT-ID node tools/seed-example.mjs --firestore
```
This needs the Google Cloud CLI (https://cloud.google.com/sdk). It won't overwrite existing data
unless you add `--force`.

## 12. First login
1. Open `https://YOUR-PROJECT-ID.web.app`.
2. Click sign in and choose a Google account from your allowlist.
3. You should see the boards. If you get an error, see Troubleshooting below.

## 13. Quick tour
The left menu has four areas. Click an area name to open or close it.

- **CRM**
  - **Cold Leads**, **Inbound Leads** and **Partner Leads** hold leads, meaning people who might
    buy.
  - **Quotes** follows a deal through quoting, from "needs quotation" through follow-up,
    invoicing and "won, awaiting payment".
- **Pre-Production:** Design, Prototyping, Tooling, Raw Material Sampling and Logistics boards
  for won work.
- **Operations:** Scheduling, Raw Materials, Processes, QC, Packaging and Shop Needs for work on
  the floor.
- **KPI's:** sales and pipeline numbers built from your deals.

Working with deals:
- Each card is a deal (in Pre-Production and Operations, cards are called projects).
- Drag a card to another column to change its stage. Click a card to open its details: notes,
  follow-up date, contact and files.
- You can rename, reorder, add or remove stages and boards from inside the app.

**Tasks board:** open **Tasks** at the top of the left menu. Tasks are sorted into four boxes:
- **Do:** personal and urgent
- **Decide:** put off until a due date
- **Delegate:** hand off to a teammate (you can edit the list of teammates)
- **Delete:** dismiss it (it doesn't count as done)

**Admin** has backups, Gmail linking (optional) and data tools.

---

## Troubleshooting

**"auth/unauthorized-domain" when signing in**
Open Authentication > Settings > **Authorized domains** and add your site address, for example
`YOUR-PROJECT-ID.web.app`. Add `localhost` too if you test on your own computer.

**"Missing or insufficient permissions" or "permission denied"**
Your email isn't on the allowlist, or the rules weren't deployed. Check that the email is
lowercase and appears in both `firebase-config.js` and `firestore.rules`. Then run
`python3 tools/build-public.py` and `firebase deploy --only hosting,firestore:rules`.

**Functions deploy says the project must be on the Blaze plan**
Upgrade to Blaze (step 3), wait a minute and deploy again. Hosting and Firestore don't need it.

**A feature returns 401 or 403 (Cloud Run "unauthenticated")**
Cloud Functions run on Cloud Run. Some Google Workspace organizations have a policy that blocks
public access ("allUsers"), so calls from the browser get rejected. Fixes:
- If you are allowed to, give the service public invoker access in the Cloud Run console
  (Permissions > Add principal `allUsers`, role "Cloud Run Invoker").
- If your org policy blocks `allUsers`, turn off the invoker check for that service instead.
  The functions still check your sign-in themselves:
  ```bash
  gcloud run services update SERVICE-NAME --region us-central1 --project YOUR-PROJECT-ID --no-invoker-iam-check
  ```
  Find SERVICE-NAME in the Cloud Run console (it's the function name in lowercase). A new
  functions deploy can undo this setting, so run it again after each deploy.

**The page looks old after a deploy**
Hard-refresh the page (Ctrl+Shift+R, or Cmd+Shift+R on Mac).

Want a walkthrough? Book time with Hans: calendly.com/hans-stuffmfg/30min
