#!/bin/sh
set -eu

: "${DATABASE_URL:?Set DATABASE_URL to the deployment PostgreSQL connection string}"

# No resets or --accept-data-loss: stop startup if a schema change could lose data.
bun run db:deploy

exec node node_modules/next/dist/bin/next start --hostname 0.0.0.0
