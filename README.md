# Habits

Wall-display habit grid. Next.js (App Router) + Tailwind v4 + Supabase, deployed on Vercel.

## Setup
1. Copy `.env.example` to `.env.local` (values are the project URL and publishable key; both are safe to expose to the browser).
2. `npm install && npm run dev`
3. `npm test` runs the status-logic tests (plain Node, no dependencies).

Schema lives in `supabase/migrations/`. Status (done / pending / missed / future) is computed from dates, never stored.
