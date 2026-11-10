# Family Golf

A mobile golf scorecard built with Next.js 16, Prisma 7, PostgreSQL, and Zustand.

## Try it locally

Run the database in Docker and the app on your machine. The local Compose file uses its own persistent volume and port **55432**, separate from the deployment database.

For a fresh checkout, install dependencies with `bun install` and copy `.env.example` to `.env`. If `.env` already exists, keep the other settings and set:

```env
DATABASE_URL="postgresql://golf:golf_local@127.0.0.1:55432/family_golf?schema=public"
```

Then run:

```sh
bun run db:up
bun run db:setup
bun run db:demo
bun dev
```

Open [localhost:3000](http://localhost:3000). The optional demo command adds two sample rounds to the local database only. Re-running it preserves edits to existing demo rounds.

`bun run db:down` stops the database without deleting saved data. Start it again with `bun run db:up`. Restart the app after changing its database connection or regenerating the Prisma client.

## Manage records

The existing Saved Matches section includes Matches, Courses, and Groups controls:

- Start a new match, view a scorecard, edit round details and individual scores, or delete a match. In the history editor, add or replace a photo from your device, or remove it; photo changes apply when you save.
- Add, edit, and delete course layouts with 9 or 18 par values.
- Add, edit, and delete saved player groups with 1–8 players.

Edits save to PostgreSQL. Deletion requires confirmation. A course used by a saved match cannot be deleted; remove or reassign its matches first. Each match keeps a snapshot of its par values when the course layout changes. Renaming a course updates its display name in history.

An unfinished round stays on the device. Use **Save & exit** to return to the dashboard and resume later. **Finish** clears the active round only after the database confirms it was saved. A failed save keeps the round available for retry.

Play, setup, scorecards, and history use the same responsive page width.

Course templates use 3, 4, and 5 buttons to enter pars in hole order, with tap feedback, an undo button, and a running hole count and par total. Save at 9 or 18 holes. New match lineups and player groups start empty: **Add player** opens a focused name field and stays below the list. You can also load a saved group into match setup. The play screen shows pill progress as you move through the round.

Photos are optional. To enable Cloudflare R2 uploads, configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_PUBLIC_DOMAIN`, and allow the local app origin in the bucket's CORS settings. The app works without these settings. History photo uploads go through the app server, so they do not require browser upload CORS. Setup uses direct uploads and still needs the bucket CORS setting.

Replacing or removing a photo also deletes its R2 file once no saved match uses it. Deleting a match follows the same rule. A persistent cleanup queue keeps failed deletions retryable; use **Retry photo cleanup** in history if that message appears. Canceling the editor leaves the saved photo unchanged.

## Validation

With the local database and app running:

```sh
bun run lint
bunx tsc --noEmit
bunx playwright install chromium
bun run test:e2e
bun run build
```

The integration tests cover CRUD, validation, course deletion protection, score snapshots, failed-save recovery, direct scorecard loading, mobile overflow, and dialog confirmation/focus. Tests create and clean up their own records. When R2 settings are present, the photo test uploads small test images to the configured bucket and verifies their replacement and deletion; it cleans up its own images afterward. To use another app address, set `GOLF_TEST_URL` when running the tests.

## Deployment

The local database uses `compose.local.yml`; the existing `docker-compose.yml` is separate. Configure the deployment's own `DATABASE_URL` and optional R2 variables.

The Docker image listens on port 3000 and applies the schema and missing default templates at startup before serving requests. It stops if a schema update requires accepting data loss. Local `.env` files and development database credentials are excluded from the build context; provide the deployment environment in Coolify.

```sh
# Build
bun run build
# Apply the additive schema changes, seed missing defaults, and run
bunx prisma db push
bunx prisma db seed
bun start
```

Seed operations add missing courses and groups without overwriting edited templates or deleting history. Existing deployments need the updated Prisma schema applied before serving this version.

### Healthcheck in Coolify

Enable the application's healthcheck with method **GET**, scheme **http**, host **127.0.0.1**, path **/api/health**, port **3000**, and expected status **200**. Use the application's internal HTTP port; HTTPS can remain on the public proxy. The Docker image includes `curl`, which [Coolify's HTTP healthchecks require](https://coolify.io/docs/applications/configuration/health-checks). Save and redeploy after enabling the check.

The endpoint returns `{ "status": "ok", "timestamp": "..." }` with `Cache-Control: no-store`. It checks that the application is responding and does not query PostgreSQL or R2. Database and photo-storage errors remain visible through their normal application requests.

### Database connection errors in Coolify

Set `DATABASE_URL` in the application's **runtime** environment to the database's Internal URL when both resources share a destination network. The hostname must resolve from the app container; `localhost` refers to the app container itself. Recreate or redeploy the app after changing its environment.

For the bundled Compose stack, the default connection uses the `db` service on port 5432. Set `POSTGRES_PASSWORD` to the existing database password, or override `DATABASE_URL` with the complete connection string. For passwords with special characters, use a correctly URL-encoded connection string. Changing the PostgreSQL container's environment does not rotate a password already stored in its existing data volume.

The API distinguishes rejected credentials (`DATABASE_AUTH_FAILED`), an unreachable host (`DATABASE_UNREACHABLE`), and missing schema updates (`DATABASE_SCHEMA_OUTDATED`). For the last case, run `bun run db:deploy` in the app container, then restart it. The current Docker entrypoint already runs this command; preserve that entrypoint when configuring Coolify's startup command.

If troubleshooting is still needed, check the application logs around `Database request failed`. Share the error code and a connection string with its password removed; do not share actual credentials.
