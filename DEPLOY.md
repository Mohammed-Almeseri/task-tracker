# Deploying Task Tracker to Vercel

## Prerequisites

| Tool | Purpose |
|------|---------|
| [Node.js 18+](https://nodejs.org) | Runtime |
| [Vercel CLI](https://vercel.com/docs/cli) | Deploy from terminal |
| Supabase project | Auth + PostgreSQL database |

---

## Step 1 — Create the database tables

1. Open your Supabase dashboard → **SQL Editor**
2. Paste the contents of `supabase-schema.sql` and **Run**
3. Verify the four tables exist: `goals`, `tasks`, `timer_sessions`, `notes`

---

## Step 2 — Get your Service Role Key

1. Supabase dashboard → **Settings → API**
2. Copy the **service_role** key (the secret one, NOT the anon key)

---

## Step 3 — Add environment variables

Add the following to your `.env` file (for local dev) **and** to Vercel (for deployment):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...       # already set
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # from Step 2
```

---

## Step 4 — Migrate existing data (optional)

If you have data in `data.json` that you want to keep:

```bash
node migrate-data.js
```

This reads `data.json`, maps each user's email to their Supabase user ID, and inserts everything into the database.

---

## Step 5 — Test locally

```bash
npm start
```

Open `http://localhost:3000`, log in, and verify your goals/tasks/notes appear.

---

## Step 6 — Deploy to Vercel

### Option A: Vercel CLI

```bash
npx vercel            # preview deploy
npx vercel --prod     # production deploy
```

### Option B: Git integration

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add the three environment variables above in the Vercel project settings
4. Deploy

---

## Environment Variables Reference

| Variable | Where | Required |
|----------|-------|----------|
| `SUPABASE_URL` | `.env` + Vercel | ✅ |
| `SUPABASE_ANON_KEY` | `.env` + Vercel | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` + Vercel | ✅ |
| `PORT` | `.env` only | ❌ (defaults to 3000) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **500 on every API call** | Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly |
| **Tables not found** | Run `supabase-schema.sql` in the SQL Editor |
| **Data missing after deploy** | Run `node migrate-data.js` to move data.json → Supabase |
| **Static files 404** | Verify `public/` folder is included (`vercel.json` has `includeFiles`) |

---

## Future Updates

When you make changes to your code in the future and want to deploy those updates, follow these exact steps in your terminal:

**1. Stage your changes:**
```bash
git add .
```

**2. Commit your changes:**
```bash
git commit -m "Describe what you changed here"
```

**3. Push to GitHub:**
```bash
git push
```

**4. Deploy to Vercel (Production):**
```bash
npx vercel --prod
```
*(Note: If you have linked your Vercel project to GitHub, pushing to the `main` branch will automatically trigger a Vercel deployment. In this case, step 4 is not strictly necessary!)*
