# Habits: project memory / handoff

Read this first. It summarizes the planning chat and the state of the repo when work moved from claude.ai to Claude Code.

## Goal
A habit-tracking **web app** shown all day on an old wall laptop (16:9, 1366x768 but must look good at any size). Ridiculously simple MVP, improved later. Owner: Andre, Caxias do Sul, Brazil (America/Sao_Paulo, UTC-3).

## Decisions made
- Stack: Next.js (App Router, TypeScript) + Tailwind v4 + Supabase (Postgres + Auth) + GitHub + Vercel. Plain client-side app, no middleware.
- Auth: email + password, single user. **Google OAuth skipped for now** (add later).
- Used from both the wall laptop and a phone (same responsive page).
- Views: week (Mon to Sun, left to right) and month. Habits top to bottom.
- Cell colours: green check = done, yellow = pending, red X = missed, dim gray = future.
- **Per-habit optional due time**: a habit with a due time stays gray today until that time, then turns yellow. Red only after the day is over. No due time means yellow from 00:00.
- Days before a habit existed (`start_date`) render blank, never red.
- Status is computed from dates, never stored (`lib/status.ts`).
- Actions: create, rename, archive (keeps history), delete (deletes history), set due time. Click any past or today cell to toggle; future cells are locked.
- Wall behaviour: refetch every 3 min (also keeps free Supabase from auto-pausing after 7 idle days), clock tick every 30 s, follows "today" across midnight.
- Deliberately NOT in the MVP: streaks, stats, reminders, non-daily schedules, skip state, reordering, categories, notes, Google login.

## Infrastructure (already created)
- Supabase project `habits`, ref/id `yhqitpzfcimiilzvaejh`, region sa-east-1, URL `https://yhqitpzfcimiilzvaejh.supabase.co`.
  Publishable key (browser-safe): `sb_publishable_qoWtX5vjBxwb5vSdlgk7kw_6uQVB8Ip`. Env var names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`).
- Schema applied: `supabase/migrations/20260925_create_habits_and_completions.sql`. Tables `habits` (id, user_id, name, due_time, start_date, archived_at, created_at) and `completions` (habit_id, date, user_id; PK habit_id+date). RLS on, owner-only policies. Security advisor was clean.
- Andre's other Supabase project "Callpal" is unrelated and paused. Do not touch it.
- GitHub repo: https://github.com/andrefsilveriog/habits (public), branch `main`. The Claude GitHub App was installed on it.
- Vercel: **not created yet.** The Vercel API refused to link the repo until Andre adds a GitHub Login Connection (Vercel Account Settings, Authentication). No Vercel team exists, so the project goes on his personal account.

## Code map
- `lib/status.ts`: pure date and status logic (TZ constant `America/Sao_Paulo`). `scripts/status.test.ts` tests it (`npm test`, plain Node, passes).
- `lib/supabase.ts`: lazy Supabase client and the `Habit` type.
- `app/page.tsx`: session gate. `components/LoginForm.tsx`, `Dashboard.tsx` (header, data loading, toggling), `Grid.tsx`, `ManagePanel.tsx`.

## State when handed off
- The code was written by hand in a cloud sandbox that could not reach npm, so **it has never been installed, type-checked or built**. Expect small type or build errors on first `npm install && npm run build`. It has also never been viewed in a browser, so check the layout at 1366x768.
- Sandbox check of status logic passed; nothing else was verified.

## Next steps
1. `npm install`, `npm run build`, fix any errors, `npm run dev` with `.env.local` copied from `.env.example`.
2. Sign up once through the login page ("First time? Create account"), then in the Supabase dashboard turn off "Allow new users to sign up" (and optionally "Confirm email").
3. Check the week and month grids at 1366x768 and on a phone.
4. Deploy: connect GitHub in Vercel, import the repo, set the two env vars **before the first build** (NEXT_PUBLIC vars are inlined at build time), deploy.
5. Wall laptop: log in once, keep the tab open, disable OS sleep and lid-close suspend.
6. Later: Google OAuth, then whatever Andre asks for.

Vercel note: the Hobby plan is for personal, non-commercial use only, which fits this.
