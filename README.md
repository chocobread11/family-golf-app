```markdown
# 🏌️‍♂️ Family Golf App

A premium, high-contrast fintech/iOS-styled golf scorecard and group flight tracker built for smooth mobile tracking and automated cloud syncing.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database ORM**: Prisma with PostgreSQL Native Client Driver
- **State Management**: Zustand Cache Engine
- **Media Engine**: Cloudflare R2 Bucket Object Storage via AWS S3 SDK
- **Styling**: Tailwind CSS v4 (Uniform `rounded-3xl` Bento System)
- **Deployment Platform**: Coolify Self-Hosted Container Engine

---

## 🛠️ Getting Started (Local Development)

### 1. Environment Configuration
Create a `.env` file in the root directory and add your local parameters:

```env
DATABASE_URL="postgresql://admin:admin123@localhost:5432/family_golf?schema=public"

R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_s3_access_key"
R2_SECRET_ACCESS_KEY="your_s3_secret_key"
R2_BUCKET_NAME="your_bucket_name"
R2_PUBLIC_DOMAIN="[https://your-custom-r2-subdomain.com](https://your-custom-r2-subdomain.com)"

```

### 2. Install Dependencies & Database Sync

Run the initialization sequence to bind your database and generate Prisma client mappings:

```bash
# Install core modules
bun install

# Pull schema structural layouts or push mutations to local DB
bunx prisma db push

# Run seed scripts to hydrate Course Templates and Flight Groups
bunx prisma db seed

```

### 3. Spin up the Development Engine

```bash
bun dev

```

Open [http://localhost:3000](http://localhost:3000) with your mobile browser inspector to check the layout.

---

## 📦 Production Deployment (Coolify Setup)

This app is built to automatically build and migrate inside isolated Coolify runtime containers.

### 1. Build Pack Engine Variable

Set this environment key inside Coolify to ensure the server uses Bun instead of falling back to NPM:

* `NIXPACKS_PKG_MANAGERS` = `bun`

### 2. Deployment Build & Start Orchestration

Configure these exact execution commands inside your Coolify App console:

* **Build Command**: `prisma generate && next build`
* **Start Command**: `prisma db push && prisma db seed && next start`

*(This automatically ensures migrations are synced and base templates are seeded on every single `git push` command without thread crashes).*