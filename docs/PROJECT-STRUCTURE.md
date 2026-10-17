# FixFlow AI project structure

The project keeps routing in `app/` and reusable UI in `components/`. Next.js
framework files stay in `app/`, while feature pages are selected through one
shared route.

```text
app/
  page.tsx                         Admin dashboard URL (/)
  [section]/page.tsx               Shared route for feature pages
  api/                              All API routes in one folder
  layout.tsx                        Root application layout
  providers.tsx                     Application providers
  globals.css                       Global stylesheet

components/
  pages/                           One UI file per page
    login.tsx
    tenant.tsx
    technician.tsx
    reports.tsx
    completed-tickets.tsx
  ui/admin/AdminSectionPage.tsx    Shared admin page UI
  layout/                          Shared headers and navigation

lib/                                Shared auth, Prisma, AI, and permissions
features/                           Validation schemas and domain types
prisma/                             Schema, migrations, and seed data
types/                              Global TypeScript declarations
docs/                               Project documentation
```

## API structure

All endpoints use the App Router format:

```text
app/api/dashboard/route.ts  ->  /api/dashboard
```

Static, dynamic, and authentication endpoints all live in the same App Router
folder. For example:

```text
app/api/tickets/[id]/status/route.ts  ->  /api/tickets/:id/status
```

Dynamic URLs use `[id]` folders under the same `app/api` tree. Each route file contains its own authentication, validation, and database handler.

## Common commands

```bash
npm run dev
npm run typecheck
npx prisma generate
npx prisma db push
npm run seed
```
