# CLAUDE.md — Sistem Informasi Masjid Al Ikhlas

## Project Overview

Web app untuk Masjid Al Ikhlas (Magetan, Jawa Timur). Fitur: jadwal sholat real-time, pencatatan keuangan (jimpitan, hibah, zakat, sedekah, pengeluaran), laporan periodik, CMS sederhana (qurban tier, kegiatan), autentikasi pengurus, peta lokasi.

**Users**: Publik (jamaah) & Admin (pengurus masjid)

## Tech Stack & Constraints

| Layer | Technology |
|-------|-----------|
| Runtime | **Node.js 18.x / 20.x** (shared hosting, NO Bun/Deno) |
| Language | **TypeScript** (wajib untuk semua kode) |
| Backend | Hono (REST API + static serve) |
| Frontend | Preact + Vite (SPA, build ke `dist/`) |
| Database | **MySQL** (mysql2 driver, connection pool) |
| Auth | **Lucia Auth** + OAuth (Google, Apple) + bcrypt fallback |
| Package Manager | **pnpm** (hemat disk, cepat, cocok shared hosting) |
| Styling | CSS Modules + CSS Variables (design tokens) |
| Animation | **GSAP** + ScrollTrigger (entrance animations) + **CSS micro-animations** (hover, focus, transitions) |
| Icons | **Lucide** (tree-shakable SVG icons, `lucide-preact`) |

**Shared Hosting Rules**:
- Gunakan `pnpm` untuk install, build di local lalu upload `dist/`
- Build frontend ke `dist/`, Hono serve static dari folder tersebut
- Port dari env `PORT` atau default `3000`
- MySQL connection dari env: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`

## Project Structure

```
al-ikhlas-mosque/
├── src/
│   ├── server/          # Hono backend
│   │   ├── routes/      # API route handlers
│   │   ├── middleware/   # auth, validation, error handler
│   │   ├── db/          # database connection, models, migrations
│   │   └── index.ts     # entry point
│   ├── client/          # Preact frontend
│   │   ├── components/  # reusable UI components
│   │   ├── pages/       # route pages (landing, admin, login)
│   │   ├── hooks/       # custom hooks
│   │   ├── lib/         # gsap setup
│   │   ├── styles/      # global styles, design tokens, micro-animations
│   │   └── index.tsx    # entry point
│   └── shared/          # types & utils shared between server/client
│       └── types.ts     # TypeScript interfaces
├── dist/                # Vite build output (gitignored)
├── docs/                # PRD & requirements (gitignored, not pushed)
├── tsconfig.json
├── vite.config.ts
├── pnpm-lock.yaml
├── package.json
└── CLAUDE.md
```

## Setup & Run

```bash
pnpm install
pnpm dev             # concurrent: Hono API + Vite dev server
pnpm build           # build frontend to dist/
pnpm start           # production: Hono serves API + dist/
```

### Key Dependencies

```bash
# Backend
pnpm add hono @hono/node-server mysql2 bcryptjs
pnpm add lucia @lucia-auth/adapter-mysql @lucia-auth/oauth
pnpm add -D @types/bcryptjs

# Frontend
pnpm add preact preact-router lucide-preact gsap

# Dev & Build
pnpm add -D vite @preact/preset-vite typescript
```

## TypeScript Rules

- `tsconfig.json`: `"strict": true`, `"target": "ES2022"`, `"module": "ESNext"`
- **Dilarang**: `any`, `@ts-ignore`, non-null assertion `!` tanpa alasan jelas
- Semua API response wajib punya type/interface
- Database model pakai interface di `src/shared/types.ts`
- Component props wajib didefinisikan sebagai interface
- Gunakan `unknown` bukan `any` untuk data yang belum diketahui type-nya

```typescript
// Contoh type shared
interface Transaction {
  id: number;
  type: 'jimpitan' | 'hibah' | 'zakat' | 'sedekah' | 'pengeluaran';
  amount: number;
  date: string;
  donor_name: string | null;
  description: string;
  category: string | null;
  created_at: string;
}
```

## Security Guidelines

- **Auth**: Lucia Auth dengan MySQL adapter
  - **Google OAuth**: redirect ke Google → callback → buat session
  - **Apple OAuth**: redirect ke Apple → callback → buat session
  - **Username/Password**: fallback, hash dengan `bcrypt` (10 rounds)
  - Session disimpan di httpOnly cookie (secure di production)
- **Route Protection**: middleware `authGuard` untuk semua `/api/admin/*`
  - Cek session cookie, validasi dengan `Lucia.validateSession()`
  - Redirect ke `/login` jika session invalid/expired
- **Input Sanitasi**: validasi semua input user (XSS, SQL injection)
  - Gunakan parameterized queries (jangan string concatenation)
  - Escape HTML output di frontend
- **CORS**: restrict ke domain sendiri di production
- **Rate Limiting**: terapkan di endpoint login (`/api/login`, OAuth callbacks)
- **Environment Variables**: simpan di `.env` (gitignored):
  - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
  - `LUCIA_SECRET` (session encryption key)

## Frontend Design System

### Color Palette
```css
:root {
  --color-primary: #1C3B24;        /* hijau tua - navbar, buttons, borders */
  --color-primary-light: #2E6F40;   /* hijau muda - hover, links */
  --color-primary-muted: #3D8B5A;   /* hijau soft - badges, accents */
  --color-bg: #FEFEFE;             /* latar utama (off-white, bukan pure white) */
  --color-bg-secondary: #F7F8F7;   /* latar card, sections */
  --color-bg-warm: #FAFAF8;        /* latar hero, highlight sections */
  --color-text: #1A1A1A;           /* teks utama */
  --color-text-secondary: #5A5A5A; /* teks sekunder */
  --color-text-muted: #8A8A8A;     /* placeholder, captions */
  --color-border: #E8E8E8;         /* borders */
  --color-border-light: #F0F0F0;   /* dividers halus */
}
```

### Typography
- **Display/Heading**: `DM Serif Display` (elegant, editorial feel untuk judul besar)
- **Body/UI**: `DM Sans` (clean, geometric, pas untuk data & forms)
- Heading: 600 weight, body: 400
- Base size: 16px, scale ratio: 1.25 (minor third)
- Line height: 1.6 untuk body, 1.2 untuk heading

### Spacing & Layout
- Base unit: 4px (4, 8, 12, 16, 24, 32, 48, 64, 96)
- Grid: CSS Grid untuk layout utama, Flexbox untuk komponen
- Container max-width: 1200px, padding: 24px (mobile: 16px)
- Mobile-first responsive breakpoints: 480, 768, 1024, 1280

### Component Patterns
- Card: `border-radius: 12px`, `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`, hover: shadow lebih dalam
- Button primary: bg `--color-primary`, text white, hover `--color-primary-light`, `border-radius: 8px`
- Button ghost: transparent bg, border `--color-primary`, text `--color-primary`
- Input: `border-radius: 8px`, border `--color-border`, focus: ring `--color-primary-muted`
- Badge: `border-radius: 999px`, bg `--color-primary-muted` dengan opacity 15%

### Icons & Forms Rules (Anti AI-Slop)

**Icons**: SEMUA icon dari `lucide-preact`. Dilarang keras:
- SVG inline random
- Icon font (Font Awesome, Material Icons)
- Tailwind default icons
- Emoji sebagai icon

```typescript
// ✅ BENAR
import { Home, Calendar, Wallet, Loader2, ChevronDown, Search, Plus, Check } from 'lucide-preact';

// ❌ SALAH
<span class="icon">🏠</span>
<i class="fa fa-home"></i>
```

**Form Inputs**: Custom CSS, bukan framework defaults. Setiap input/textarea/select punya style sendiri:

```css
/* src/client/styles/forms.css */
.form-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  border-color: var(--color-primary-muted);
  box-shadow: 0 0 0 3px rgba(61, 139, 90, 0.12);
}

.form-input::placeholder {
  color: var(--color-text-muted);
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* custom chevron via Lucide SVG */
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}
```

**Spinner/Loading**: Gunakan Lucide `Loader2` dengan CSS spin, TIDAK perlu library tambahan:

```tsx
import { Loader2 } from 'lucide-preact';

// Inline spinner
<Loader2 size={20} class="spin" />

// Full-page loading
<div class="loading-overlay">
  <Loader2 size={32} class="spin" />
  <span>Memuat data...</span>
</div>
```

**Dropdown/Select**: Custom dropdown dengan Lucide `ChevronDown`, bukan `<select>` bawaan browser.
**Checkbox/Radio**: Custom CSS + Lucide `Check`/`Circle` icon, bukan input bawaan.
**Toast/Notification**: Lucide `Check` (success), `AlertCircle` (error), `Info` (info) dengan CSS slide-in animation.

### GSAP + ScrollTrigger Animations (Native Scroll)

GSAP ScrollTrigger bekerja dengan native scroll — tidak perlu smooth scroll library. Cukup register plugin dan pasang trigger:

```typescript
// src/client/lib/gsap.ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
```

Animasi entrance untuk landing page yang dinamis namun tetap minimalis:

```typescript
// src/client/hooks/useScrollReveal.ts
import { useEffect, useRef } from 'preact/hooks';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal(options?: { y?: number; delay?: number }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.from(ref.current!, {
        y: options?.y ?? 40,
        autoAlpha: 0,
        duration: 0.8,
        delay: options?.delay ?? 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current!,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return ref;
}
```

**Animation Rules**:
- Animasi harus **subtle** dan **purposeful**, bukan show-off
- Gunakan `ease: 'power2.out'` atau `'power3.out'` untuk natural feel
- Staggered reveals untuk lists: `stagger: 0.1`
- **Hindari**: animasi berlebihan, bounce, spin, atau efek yang mengganggu ibadah
- Hero section: fade-up + subtle parallax
- Cards/sections: scroll-triggered fade-up
- Prayer times: counter animation untuk waktu (opsional)
- Admin dashboard: **tanpa animasi scroll** (fokus efisiensi)

### CSS Micro-Animations

Tanpa library tambahan — pure CSS untuk hover, focus, transitions yang halus:

```css
/* src/client/styles/micro-animations.css */

/* Base transition untuk semua interactive elements */
.interactive {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Card hover - subtle lift */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(28, 59, 36, 0.08);
}

/* Button press effect */
.btn {
  transition: all 0.15s ease;
}
.btn:active {
  transform: scale(0.97);
}

/* Input focus ring */
.input {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input:focus {
  border-color: var(--color-primary-muted);
  box-shadow: 0 0 0 3px rgba(61, 139, 90, 0.15);
}

/* Fade-in entrance (配合 GSAP atau standalone) */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.5s ease forwards;
}

/* Staggered children */
.stagger > * {
  opacity: 0;
  animation: fadeInUp 0.4s ease forwards;
}
.stagger > *:nth-child(1) { animation-delay: 0.05s; }
.stagger > *:nth-child(2) { animation-delay: 0.1s; }
.stagger > *:nth-child(3) { animation-delay: 0.15s; }
.stagger > *:nth-child(4) { animation-delay: 0.2s; }
.stagger > *:nth-child(5) { animation-delay: 0.25s; }

/* Skeleton loading shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, var(--color-bg-secondary) 25%, var(--color-border-light) 50%, var(--color-bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

/* Smooth page transition */
.page-enter {
  animation: fadeInUp 0.3s ease forwards;
}

/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spin {
  animation: spin 0.8s linear infinite;
}
```

**Micro-Animation Rules**:
- Gunakan `transition` CSS untuk hover/focus states (GPU-accelerated, zero JS)
- `transform` dan `opacity` saja untuk performa (hindari animasi `width`, `height`, `margin`)
- Duration: 150-200ms untuk micro, 300-500ms untuk entrance
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (material ease-out) atau `ease`
- GSAP hanya untuk scroll-triggered animations (landing page)
- CSS handle semua sisanya (hover, focus, active, loading states)
- **Hindari**: animasi berlebihan, bounce, spin kecuali loading indicator

### Lucide Icons

Gunakan `lucide-preact` untuk icon yang ringan dan konsisten:

```typescript
// src/client/components/Navigation.tsx
import { h } from 'preact';
import { Home, Calendar, FileText, Menu, X, MapPin, Clock } from 'lucide-preact';

export function Navigation() {
  return (
    <nav class="navbar">
      <div class="nav-brand">
        <MapPin size={20} />
        <span>Masjid Al Ikhlas</span>
      </div>
      <ul class="nav-links">
        <li><Home size={18} /> Beranda</li>
        <li><Calendar size={18} /> Jadwal</li>
        <li><FileText size={18} /> Laporan</li>
      </ul>
    </nav>
  );
}
```

**Icon Rules**:
- Import spesifik (tree-shaking): `import { Home } from 'lucide-preact'`
- Ukuran: `size={18}` untuk inline text, `size={20}` untuk buttons, `size={24}` untuk standalone
- Color: inherit dari parent (`currentColor`)
- Stroke width: default (2px), sesuaikan dengan `strokeWidth={1.5}` untuk look lebih halus
- Icon yang sering digunakan:
  - Navigasi: `Home`, `Menu`, `X`, `ArrowLeft`, `ChevronRight`
  - Keuangan: `Wallet`, `TrendingUp`, `TrendingDown`, `Receipt`
  - Waktu: `Clock`, `Calendar`, `Sun`, `Moon`
  - Lokasi: `MapPin`, `Navigation`
  - Actions: `Plus`, `Edit`, `Trash2`, `Download`, `Search`, `Filter`
  - Status: `Check`, `AlertCircle`, `Info`

## Frontend Patterns (Preact + TypeScript)

### Component Structure
```typescript
// src/client/components/PrayerTimes.tsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Clock, Sun, Loader2 } from 'lucide-preact';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface PrayerTime {
  name: string;
  time: string;
  icon: typeof Sun;
}

interface Props {
  city?: string;
}

export function PrayerTimes({ city = 'Magetan' }: Props) {
  const [times, setTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useScrollReveal();

  useEffect(() => {
    fetch(`/api/prayer-times?city=${city}`)
      .then(r => r.json())
      .then(setTimes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city]);

  if (loading) return (
    <div class="prayer-skeleton">
      <Loader2 size={24} class="spin" />
      <span>Mengambil jadwal...</span>
    </div>
  );

  return (
    <section ref={sectionRef} class="prayer-section">
      <h2><Clock size={20} /> Jadwal Sholat Hari Ini</h2>
      <ul class="prayer-list">
        {times.map(t => (
          <li key={t.name} class="prayer-item">
            <t.icon size={18} />
            <span class="prayer-name">{t.name}</span>
            <span class="prayer-time">{t.time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### Rules
- Gunakan `h` dari preact (bukan React.createElement)
- Hooks dari `preact/hooks` (bukan react)
- Icons dari `lucide-preact` (import spesifik, tree-shaking)
- State management: `useState` + `useEffect` (cukup untuk app ini, tidak perlu Redux)
- API calls: `fetch` dengan custom hook `useApi<T>(url)` untuk reusable fetching
- Animations: `useScrollReveal()` hook untuk scroll-triggered entrance (GSAP)
- Hover/focus: CSS transitions di `micro-animations.css` (tanpa library)
- Routing: `preact-router` atau file-based routing via Vite

### Hooks Pattern

```typescript
// src/client/hooks/useApi.ts
import { useState, useEffect } from 'preact/hooks';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(res => setData(res.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, [url]);

  return { data, loading, error, refetch: fetchData };
}
```

### Admin vs Landing Page Rules
- **Landing page**: Native scroll + GSAP ScrollTrigger entrance + CSS micro-animations (clean, purposeful)
- **Admin dashboard**: Native scroll, CSS transitions only (hover/focus), fokus efisiensi dan data density
- **Shared**: Lucide icons, CSS variables, TypeScript types, CSS micro-animations

## Database Patterns (MySQL)

- Driver: `mysql2` dengan connection pool
- Connection: pool dari env `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
- ORM: gunakan `drizzle-orm` (mysql2 driver) atau raw query dengan prepared statements
- Migration: file SQL di `src/server/db/migrations/`
  - Tabel Lucia Auth: `users` (id, username, email, password_hash, provider, provider_id, role, created_at), `sessions` (id, user_id, expires_at)
  - Tabel bisnis: `transactions`, `qurban_tiers`, `activities`
- Seed: file `src/server/db/seed.ts` untuk admin default
- Query: **parameterized only**, never concatenate user input

```typescript
// src/server/db/connection.ts
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

```typescript
// Contoh parameterized query (AMAN)
const [rows] = await pool.execute(
  'SELECT * FROM transactions WHERE type = ? AND date BETWEEN ? AND ?',
  [type, startDate, endDate]
);
```

## API Conventions

- Format response: `{ success: boolean, data?: T, error?: string }`
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error
- Pagination: `?page=1&limit=20` dengan response `{ data: T[], total: number, page: number }`
- Error: return `{ success: false, error: "pesan error" }`

## External APIs

- **Jadwal Sholat**: `https://api.aladhan.com/v1/timingsByCity?city=Magetan&country=Indonesia&method=2`
- Fallback: tampilkan pesan "Sedang mengambil data" + tombol reload jika API gagal
- Cache: 1 jam (proxy di backend, bukan di frontend)

## Deployment (Shared Hosting)

```bash
pnpm build              # build frontend ke dist/
# Upload seluruh folder ke shared hosting (kecuali node_modules, docs, .git)
# Install di hosting: pnpm install --prod (atau npm install --prod jika pnpm tidak tersedia)
# Jalankan: node src/server/index.js
# atau: pnpm start
```

- Set env di hosting: `PORT`, `LUCIA_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Pastikan MySQL database sudah dibuat di hosting panel
- Jalankan migration SQL manual via phpMyAdmin atau CLI hosting
