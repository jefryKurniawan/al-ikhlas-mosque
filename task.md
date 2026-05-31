# Task — Al Ikhlas Mosque

## Backend & Database

- [x] Project scaffolding (package.json, tsconfig, vite.config)
- [x] Shared TypeScript types (branded types, interfaces)
- [x] MySQL connection pool (mysql2)
- [x] Database migrations (users, sessions, transactions, qurban_tiers, activities)
- [x] Database queries (CRUD transactions, qurban tiers, activities, reports)
- [x] Database seed (admin user, sample data)
- [x] Hono server entry point (CORS, logger, static serve)
- [x] Error handler middleware
- [x] Auth guard middleware (Lucia session validation)
- [x] Request body validation middleware
- [x] Public routes (prayer-times, qurban-tiers, activities, reports)
- [x] Auth routes (login, logout, me)
- [x] Admin routes (transactions CRUD, qurban tiers CRUD, activities CRUD, reports)
- [x] Lucia Auth setup (MySQL adapter, session management)
- [x] Password hashing (bcryptjs)
- [x] Environment config (.env.example)

## Frontend (Belum)

- [ ] Preact entry point + routing
- [ ] Landing page (hero, prayer times, qurban tiers, activities, map)
- [ ] Login page (username/password + Google/Apple OAuth buttons)
- [ ] Admin dashboard layout (sidebar, header)
- [ ] Admin: transactions page (CRUD table + modal form)
- [ ] Admin: qurban tiers page
- [ ] Admin: activities page
- [ ] Admin: reports page (generate + download)
- [ ] CSS design system (tokens, forms, micro-animations)
- [ ] GSAP ScrollTrigger animations (landing page entrance)
- [ ] Lucide icons integration
- [ ] Custom form components (input, select, checkbox, radio)
- [ ] Loading spinner (Lucide Loader2)
- [ ] Toast notifications

## Auth OAuth (Belum)

- [ ] Google OAuth integration (butuh credentials)
- [ ] Apple OAuth integration (butuh credentials)

## Export (Belum)

- [ ] PDF report generation
- [ ] Excel/CSV export

## Deployment (Belum)

- [ ] Production build script
- [ ] Shared hosting deployment guide
