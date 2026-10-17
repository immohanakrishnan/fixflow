# FixFlow AI

AI-powered property maintenance operations platform for managing resident requests, technician dispatch, service tickets, and property portfolios.

FixFlow AI turns an incoming maintenance complaint into a structured, auditable workflow:

```text
Resident request -> AI triage -> Admin review -> Technician assignment -> Resolution -> Billing -> Closure
```

This project is a portfolio application built with fictional Riyadh property data. It demonstrates production-minded full-stack patterns including role-based access, server-side validation, audit trails, soft deletion, ticket history, and a MySQL-backed data model.

## Highlights

- Admin operations dashboard with portfolio, property, tenant, technician, request, and ticket views
- Separate tenant and technician portals
- AI-assisted issue categorization and priority recommendation with deterministic fallback rules
- Request-to-ticket conversion with administrator-controlled assignment and SLA date
- Technician skill matching and availability-aware assignment workflow
- Ticket lifecycle with assignment, comments, status history, billing completion, and closure rules
- Soft deletion for master records with inactive-state visibility
- Audit logging for create, update, and delete actions
- Protected API endpoints with role-based authorization
- Responsive interface with reusable layouts, modal editors, confirmation dialogs, toasts, filters, and pagination
- Prisma ORM with MySQL and seed data for a realistic demo environment

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 15, React 19, TypeScript |
| Database | MySQL, Prisma ORM |
| Authentication | Auth.js / NextAuth credentials flow |
| Validation | Zod |
| AI | Gemini-compatible triage integration with server-side fallback |
| Visualization | Recharts |
| UI | Project CSS, Lucide icons, Sonner toasts |

## Architecture

```text
app/                         Next.js pages and API route entry points
components/                 Reusable page, layout, and UI components
app/api/                     API route entry points required by Next.js
lib/                         Prisma, authentication, permissions, audit, and AI helpers
features/                    Domain validation schemas
prisma/                      Schema, migrations, and seed data
docs/                        Architecture and API documentation
```

API endpoints live under `app/api` using Next.js `route.ts` conventions. Dynamic endpoints such as `/api/tickets/:id/status` use nested folders because the folder names define the URL parameters.

## Requirements

- Node.js 20 or newer
- MySQL 8 or newer
- npm
- Optional: Gemini API key for live AI triage

## Local setup

1. Create a MySQL database:

```sql
CREATE DATABASE fixflow_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Create the environment file:

```bash
copy .env.example .env     # Windows
cp .env.example .env      # macOS/Linux
```

3. Update `DATABASE_URL`, `AUTH_SECRET`, and the optional `GEMINI_API_KEY` in `.env`.

4. Install dependencies, generate Prisma Client, apply the schema, and seed demo data:

```bash
npm install
npx prisma generate
npx prisma db push
npm run seed
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

The seed script creates fictional accounts for local development only. All seeded demo users use the password `demo1234`.

- Administrator: `admin@fixflow.demo`
- Tenants: `tenant1@fixflow.demo` through `tenant12@fixflow.demo`
- Technicians: `tech1@fixflow.demo` through `tech8@fixflow.demo`

Never use these credentials in a real deployment.

## Useful commands

```bash
npm run dev          # Start development server
npm run typecheck    # Run strict TypeScript validation
npm run build        # Create production build
npm run start        # Run production build
npm run seed         # Populate demo data according to prisma/seed.ts
```

## Verification

Before opening a pull request, run:

```bash
npm run typecheck
npm run build
```

If Prisma reports a Windows `EPERM` error while replacing its query engine, stop running Next.js/Node processes and run `npx prisma generate` again.

## Resume summary

**FixFlow AI — AI-Powered Property Maintenance Platform**

Built a full-stack property maintenance platform with Next.js, TypeScript, Prisma, MySQL, and Auth.js. Implemented role-based tenant, technician, and administrator workflows; AI-assisted request triage; technician assignment; ticket lifecycle and SLA tracking; soft deletion; audit logging; server-side validation; and responsive operational dashboards.

## Project status

This is a portfolio/demo application using fictional data. Production deployment would additionally require managed secrets, automated tests, observability, rate limiting, email/SMS integrations, and a formal migration deployment pipeline.
