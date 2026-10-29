#!/usr/bin/env bash
# Keep --no-invoker-iam-check on every browser or webhook called Cloud Run function after a deploy.
# The org policy forbids allUsers, and a redeploy can reset the setting. Each function does its own
# auth (ID token, bot key or webhook key), so this only lets the request reach the handler.
# Idempotent. Prints service names and the setting only, never secrets. Does not touch IAM policy.
# Run by the firebase.json functions postdeploy hook, or by hand: bash tools/post-deploy-invoker.sh
set -u

PROJECT="${PROJECT:-$(firebase use 2>/dev/null | tail -1)}"
REGION="us-central1"

# HTTPS functions (functions/index.js and functions/gmail-functions.js). gmailLink also serves the
# Gmail link callback (same function). Keep tests/invoker-test.js in sync when adding one.
# Not listed because they do not exist yet: events (ERP-3), meowWebhook (ERP-1). Add them with the function.
FUNCTIONS="backupAdmin patchDeals gmailLink csProjects followUpSweep jotformIntake seedJarvisBotGrant"
# Extra names for a one-off run: EXTRA_FUNCTIONS="events meowWebhook" bash tools/post-deploy-invoker.sh
FUNCTIONS="$FUNCTIONS ${EXTRA_FUNCTIONS:-}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "post-deploy-invoker: gcloud not found. Install it or run it by hand (see DEPLOY.md)." >&2
  exit 1
fi

failed=0
for fn in $FUNCTIONS; do
  svc="$(printf '%s' "$fn" | tr '[:upper:]' '[:lower:]')"
  if ! gcloud run services update "$svc" --region "$REGION" --project "$PROJECT" --no-invoker-iam-check --quiet >/dev/null 2>&1; then
    echo "FAIL  $svc: could not update (does the service exist in $REGION?)" >&2
    failed=$((failed + 1))
    continue
  fi
  # Verify: the service annotation must say the invoker IAM check is disabled.
  state="$(gcloud run services describe "$svc" --region "$REGION" --project "$PROJECT" --format='value(metadata.annotations."run.googleapis.com/invoker-iam-disabled")' 2>/dev/null || true)"
  if [ "$state" = "true" ] || [ "$state" = "True" ]; then
    echo "ok    $svc: invoker IAM check disabled"
  else
    echo "FAIL  $svc: invoker IAM check is not disabled after update (got '${state:-empty}')" >&2
    failed=$((failed + 1))
  fi
done

if [ "$failed" -gt 0 ]; then
  echo "post-deploy-invoker: $failed service(s) not set. Browser calls to them will get a Cloud Run 403." >&2
  exit 1
fi
echo "post-deploy-invoker: all services set."
