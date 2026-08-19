# EasyDoc Deployment Guide — Vercel (Frontend) + Supabase (Backend/Database/Auth/Storage)

This document provides complete instructions for deploying the **EasyDoc Frontend** to **Vercel** and linking it with your active **Supabase** backend instance (`vupbdftdcpwvzxnfigdt`).

---

## 1. Architecture Split

| Component | Host / Provider | Description |
| :--- | :--- | :--- |
| **Frontend & API Routes** | **Vercel** | Next.js 14 App Router, Server Components, Route Handlers (`app/api/*`), Tailwind CSS UI |
| **Database & ORM** | **Supabase Postgres** | Postgres DB host (`db.vupbdftdcpwvzxnfigdt.supabase.co`), Prisma ORM runtime |
| **Authentication & RLS** | **Supabase Auth** | Email/Password Auth, `@supabase/ssr` cookies, Row-Level Security isolation |
| **Storage Buckets** | **Supabase Storage** | Public storage buckets (`documents`, `avatars`) |
| **Database Triggers** | **Supabase Engine** | `handle_new_user` Postgres trigger auto-creating profiles on signup |

---

## 2. Deploying Frontend to Vercel

### Option A: Deploy via Vercel Dashboard (GitHub Integration)

1. Push your repository code to GitHub:
   ```bash
   git add .
   git commit -m "Deploy EasyDoc to Vercel"
   git push origin main
   ```

2. Open the [Vercel Dashboard](https://vercel.com/new).
3. Click **Import Project** and select your GitHub repository.
4. Set Framework Preset: **Next.js** (Root Directory: `./`).
5. Open **Environment Variables** and enter the following values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vupbdftdcpwvzxnfigdt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cGJkZnRkY3B3dnp4bmZpZ2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NjM3MTEsImV4cCI6MjEwMTMzOTcxMX0.oFPnpXpqs_KguS90fBcE9kTW9uwPSQaZtvLV3pEnrj8
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DATABASE_URL=postgresql://postgres:<your-db-password>@db.vupbdftdcpwvzxnfigdt.supabase.co:6543/postgres?pgboiler=true
DIRECT_URL=postgresql://postgres:<your-db-password>@db.vupbdftdcpwvzxnfigdt.supabase.co:5432/postgres
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-flash-latest
OPENAI_API_KEY=<optional-openai-key>
NEXT_PUBLIC_SITE_URL=https://<your-vercel-project-name>.vercel.app
```

6. Click **Deploy**. Vercel will build Next.js App Router and deploy serverless functions for all `app/api/*` routes.

---

### Option B: Deploy via Vercel CLI

Run the following inside `e:\Naveen-pdd`:

```bash
npx vercel --prod
```

---

## 3. Configuring Supabase Auth Redirects

After Vercel assigns your production domain (e.g. `https://easydoc-app.vercel.app`):

1. Open your **Supabase Dashboard → Authentication → URL Configuration**.
2. Update **Site URL** to `https://<your-vercel-domain>.vercel.app`.
3. Add `https://<your-vercel-domain>.vercel.app/auth/callback` to the **Redirect URLs** list.
deff
---

## 4. Database & Storage Verification (Already Applied via Supabase MCP)

All database tables (`Profile`, `Document`, `Template`, `AIRequest`, `Notification`), triggers (`handle_new_user`), functions (`is_admin`), RLS security policies, and storage buckets (`documents`, `avatars`) have already been deployed and verified on your live Supabase project (`vupbdftdcpwvzxnfigdt`) using Supabase MCP tools.
