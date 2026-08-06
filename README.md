# EasyDoc — Full-Stack AI Document Generation Platform

EasyDoc is a production-ready document generation platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (Auth, Postgres, RLS, Storage)**, **Prisma ORM**, and a provider-agnostic **AI Service Engine** supporting OpenAI, Anthropic Claude, and Google Gemini.

---

## Key Features

- **Multi-Model AI Service Layer:** Dynamically select between OpenAI (`gpt-4o-mini`), Anthropic (`claude-3-5-sonnet`), and Google Gemini (`gemini-1.5-flash`) via environment-configured API keys.
- **Supabase Authentication & Row-Level Security:** Email/password auth, cookie-based sessions with `@supabase/ssr`, automatic Postgres user profile creation trigger (`handle_new_user`), and strict RLS policies isolating user data.
- **Prisma ORM Integration:** Type-safe database management connected to Supabase Postgres via pooled and direct connection strings.
- **Client & Server Exporters:**
  - **PDF Export:** Clean HTML-to-PDF serverless exporter preserving typography, custom callouts, tables, and branding.
  - **DOCX Export:** Word document generator utilizing the `docx` library.
- **Dual Dashboard Architecture:**
  - **User App (`/dashboard`, `/generate`, `/templates`, `/history`, `/profile`):** Document Studio, template gallery, document editing, notification dropdown, export actions.
  - **Admin Console (`/admin/users`, `/admin/analytics`, `/admin/templates`, `/admin/logs`):** User role management (User <-> Admin), AI request latency analytics, template manager, and system audit logs. Server-side role protection enforced via layout guards.
- **Modern Typography & Design System:**
  - Sora (Headings & Brand), Inter (Body & UI), IBM Plex Mono (Code & Export Metadata).
  - Royal Blue `#1D4ED8`, Deep Navy `#0B1B33`, Surface `#F5F8FC`, Borders `#DCE6F5`.
  - Signature "Paper Stack" visual motif on document cards.

---

## Folder Structure

```
├── app/
│   ├── (auth)/             # Auth pages: login, signup, forgot-password, reset-password
│   ├── (user)/             # User application: dashboard, generate, templates, history, profile
│   ├── (admin)/admin/      # Admin console: users, analytics, templates, logs
│   ├── api/                # Next.js Route Handlers (App Router)
│   │   ├── auth/           # Login, Register, Forgot-password
│   │   ├── documents/      # Document CRUD & PDF/DOCX Export
│   │   ├── templates/      # Template listing & details
│   │   ├── ai/generate/    # AI document synthesis & request logging
│   │   ├── profile/        # Profile & settings update
│   │   └── admin/          # Admin user management, analytics, system logs
│   ├── auth/callback/     # Supabase Auth code exchange handler
│   ├── globals.css         # Tailwind directives & design tokens
│   ├── layout.tsx          # Root layout with Sora, Inter, IBM Plex Mono Google Fonts
│   └── page.tsx            # Marketing Landing Page
├── lib/
│   ├── ai/                 # Multi-provider AI service (OpenAI, Anthropic, Gemini)
│   ├── export/             # PDF & DOCX binary exporters
│   ├── supabase/           # Server, Client, and Service-Role Admin Supabase clients
│   ├── auth.ts             # getCurrentProfile() server helper
│   ├── prisma.ts           # Prisma client singleton
│   └── types.ts            # Shared TypeScript type definitions
├── prisma/
│   └── schema.prisma       # Prisma schema (Profile, Document, Template, AIRequest, Notification)
├── supabase/
│   └── migrations/         # RLS SQL policies & handle_new_user Postgres trigger
├── middleware.ts           # Route protection & cookie session refresh
└── tailwind.config.ts      # Design tokens & color system
```

---

## Local Development Setup

### 1. Prerequisites
- Node.js 18+ installed
- npm or yarn

### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (Pooled database string for Prisma query runtime)
- `DIRECT_URL` (Direct connection string for Prisma migrations)
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`

### 3. Database & RLS Setup

1. **Run Prisma Migrations / Sync:**
   ```bash
   npx prisma db push
   ```

2. **Apply Row-Level Security (RLS) & Auth Triggers:**
   Execute the raw SQL script located at `supabase/migrations/01_rls_and_triggers.sql` inside your **Supabase SQL Editor** or via Supabase CLI (`supabase db push`).

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Enterprise E2E Test Automation Framework (1200 Test Cases)

EasyDoc includes a production-ready, enterprise-grade test automation suite with **1200 total test cases** across 4 core domains:

1. **Selenium Web E2E (300 Test Cases):** Route discovery, POM, form validations, UI controls, navigation, and document workflows.
2. **Appium Mobile E2E (300 Test Cases):** Mobile POM, Flutter widget finders, gesture utilities (tap, swipe, scroll), and screen navigation.
3. **Vulnerability & Security (300 Test Cases):** OWASP Top 10 injection, XSS, auth security, CORS/CSP headers, sensitive data exposure, rate limiting.
4. **Load & Performance (300 Test Cases):** Latency (p50/p95/p99), RPS throughput, API route benchmarks, heavy document processing, spike testing.

### Running Test Automation Locally

- **Execute All 1200 Test Cases:**
  ```bash
  npm run test:all
  ```
- **Execute Individual Suites:**
  ```bash
  npm run test:selenium
  npm run test:appium
  npm run test:vulnerability
  npm run test:load-suite
  ```

### Enterprise Reports Generated

- **Excel Reports (`reports/excel/`):**
  - `E2E_Comprehensive_Report.xlsx` (Master consolidated report with 4 detailed sheets: `Summary`, `Test Cases`, `Failed Tests`, `Execution Logs`)
  - `E2E_Report.xlsx` (Selenium Web)
  - `Mobile_E2E_Report.xlsx` (Appium Mobile)
  - `Vulnerability_Report.xlsx` (OWASP Security)
  - `Load_Report.xlsx` (Performance Benchmarks)
- **HTML Dashboard (`reports/index.html`):** Executive summary dashboard with execution statistics and pass rates.
- **Winston Execution Logs (`logs/app.log`):** Detailed structured logs with timestamps.

---

## Vercel Deployment Guide

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Configure all variables listed in `.env.example` under **Project Settings → Environment Variables**.
4. In Supabase Dashboard under **Authentication → URL Configuration**, add `https://<your-vercel-domain>.vercel.app/auth/callback` to the Redirect URLs allowlist.
5. Deploy! Vercel automatically builds and deploys Next.js App Router serverless functions for all `app/api/*` routes.

