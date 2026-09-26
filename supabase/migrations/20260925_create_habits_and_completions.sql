create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  due_time time,
  start_date date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.completions (
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (habit_id, date)
);

create index habits_user_id_idx on public.habits (user_id);
create index completions_user_date_idx on public.completions (user_id, date);

alter table public.habits enable row level security;
alter table public.completions enable row level security;

create policy "habits: owner select" on public.habits
  for select to authenticated using (user_id = (select auth.uid()));
create policy "habits: owner insert" on public.habits
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "habits: owner update" on public.habits
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "habits: owner delete" on public.habits
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "completions: owner select" on public.completions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "completions: owner insert" on public.completions
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );
create policy "completions: owner delete" on public.completions
  for delete to authenticated using (user_id = (select auth.uid()));
