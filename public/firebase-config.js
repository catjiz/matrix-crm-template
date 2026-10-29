/* Matrix CRM: Firebase web config. Paste the values from Firebase console > Project settings > Your apps.
   Access control is Firestore rules + ALLOWLIST below. */
window.MATRIX_FIREBASE = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR-PROJECT-ID.firebaseapp.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-PROJECT-ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
/* Lowercase emails only. Must match firestore.rules allowedEmail(). */
window.MATRIX_ALLOWLIST = [
  "you@example.com",
  "teammate@example.com"
];
/* A Hosting preview channel reads and writes workspace/staging; production and localhost use workspace/main. */
window.MATRIX_ENV = /^[a-z0-9-]+--[a-z0-9-]+\.(web\.app|firebaseapp\.com)$/i.test(location.hostname) ? "staging" : "production";
window.MATRIX_FIRESTORE_STATE_PATH = window.MATRIX_ENV === "staging" ? "workspace/staging" : "workspace/main";
/* Filled in at deploy time by tools/build-public.py --stamp. */
window.MATRIX_BUILD = { commit: "dev", builtAt: "" };
