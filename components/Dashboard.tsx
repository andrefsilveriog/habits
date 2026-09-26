"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase, type Habit } from "@/lib/supabase";
import { addDays, mondayOf, monthDates, shiftMonth, todayYmd, weekDates } from "@/lib/status";
import Grid from "@/components/Grid";
import ManagePanel from "@/components/ManagePanel";

type View = "week" | "month";

const REFRESH_MS = 3 * 60 * 1000; // also keeps the free Supabase project from pausing
const TICK_MS = 30 * 1000; // keeps "today" and due-time colours current

function fmt(ymd: string, opts: Intl.DateTimeFormatOptions) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts }).format(new Date(Date.UTC(y, m - 1, d)));
}

export default function Dashboard() {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState<string | null>(null); // null = follow today
  const [now, setNow] = useState(() => new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [manageOpen, setManageOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const today = todayYmd(now);
  const effectiveAnchor = anchor ?? today;
  const dates = useMemo(
    () => (view === "week" ? weekDates(effectiveAnchor) : monthDates(effectiveAnchor)),
    [view, effectiveAnchor],
  );
  const first = dates[0];
  const last = dates[dates.length - 1];

  const load = useCallback(async () => {
    const sb = getSupabase();
    const [h, c] = await Promise.all([
      sb.from("habits").select("id,name,due_time,start_date,archived_at,created_at").is("archived_at", null).order("created_at"),
      sb.from("completions").select("habit_id,date").gte("date", first).lte("date", last),
    ]);
    if (h.error || c.error) {
      setError((h.error ?? c.error)!.message);
      return;
    }
    setError(null);
    setHabits(h.data as Habit[]);
    setDone(new Set((c.data ?? []).map((r) => `${r.habit_id}|${r.date}`)));
    setLoaded(true);
  }, [first, last]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Reload once when the day rolls over so a following view lands on the new week/month.
  const lastToday = useRef(today);
  useEffect(() => {
    if (lastToday.current !== today) {
      lastToday.current = today;
      load();
    }
  }, [today, load]);

  async function toggle(habitId: string, date: string) {
    const key = `${habitId}|${date}`;
    const wasDone = done.has(key);
    setDone((prev) => {
      const next = new Set(prev);
      if (wasDone) next.delete(key);
      else next.add(key);
      return next;
    });
    const sb = getSupabase();
    const { error: err } = wasDone
      ? await sb.from("completions").delete().eq("habit_id", habitId).eq("date", date)
      : await sb.from("completions").insert({ habit_id: habitId, date });
    if (err) {
      setError(err.message);
      load(); // resync with the server
    }
  }

  function step(dir: -1 | 1) {
    const base = effectiveAnchor;
    const next = view === "week" ? addDays(mondayOf(base), 7 * dir) : shiftMonth(base, dir);
    const isCurrent = view === "week" ? next === mondayOf(today) : next.slice(0, 7) === today.slice(0, 7);
    setAnchor(isCurrent ? null : next); // back on the current period: follow today again
  }

  const title =
    view === "week"
      ? `${fmt(first, { day: "numeric", month: "short" })} – ${fmt(last, { day: "numeric", month: "short", year: "numeric" })}`
      : fmt(first, { month: "long", year: "numeric" });

  const btn = "rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-white/10";

  return (
    <div className="flex h-screen w-screen flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-2 text-xl font-semibold" style={{ fontSize: "clamp(1.1rem, 1.8vw, 2rem)" }}>
          {title}
        </h1>
        <div className="flex items-center gap-1.5">
          <button className={btn} style={{ borderColor: "var(--line)" }} onClick={() => step(-1)} aria-label="Previous">
            ‹
          </button>
          <button className={btn} style={{ borderColor: "var(--line)" }} onClick={() => setAnchor(null)}>
            Today
          </button>
          <button className={btn} style={{ borderColor: "var(--line)" }} onClick={() => step(1)} aria-label="Next">
            ›
          </button>
        </div>
        <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: "var(--line)" }}>
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                setAnchor(null);
              }}
              className={`px-3 py-1.5 text-sm capitalize ${view === v ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {error && (
            <span className="text-sm" style={{ color: "var(--missed)" }}>
              {error}
            </span>
          )}
          <button className={btn} style={{ borderColor: "var(--line)" }} onClick={() => setManageOpen(true)}>
            Manage habits
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        {loaded && habits.length === 0 ? (
          <div className="flex h-full items-center justify-center" style={{ color: "var(--muted)" }}>
            No habits yet. Open “Manage habits” to add one.
          </div>
        ) : (
          <Grid habits={habits} dates={dates} done={done} now={now} view={view} onToggle={toggle} />
        )}
      </main>

      {manageOpen && <ManagePanel onClose={() => setManageOpen(false)} onChanged={load} />}
    </div>
  );
}
