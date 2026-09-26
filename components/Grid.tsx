"use client";

import { Fragment } from "react";
import type { Habit } from "@/lib/supabase";
import { cellStatus, dowMon0, isToggleable, todayYmd, type CellStatus } from "@/lib/status";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STYLE: Record<CellStatus, { bg: string; fg: string; symbol: string; label: string }> = {
  done: { bg: "#16a34a", fg: "#ffffff", symbol: "✓", label: "done" },
  pending: { bg: "#ca8a04", fg: "#1a1400", symbol: "○", label: "pending" },
  missed: { bg: "#b91c1c", fg: "#ffffff", symbol: "✕", label: "missed" },
  upcoming: { bg: "var(--future)", fg: "var(--muted)", symbol: "", label: "not due yet" },
  future: { bg: "var(--future)", fg: "var(--muted)", symbol: "", label: "upcoming day" },
  before: { bg: "transparent", fg: "var(--muted)", symbol: "", label: "before habit existed" },
};

export default function Grid({
  habits,
  dates,
  done,
  now,
  view,
  onToggle,
}: {
  habits: Habit[];
  dates: string[];
  done: Set<string>;
  now: Date;
  view: "week" | "month";
  onToggle: (habitId: string, date: string) => void;
}) {
  const today = todayYmd(now);
  const cols = `minmax(8rem, 20%) repeat(${dates.length}, minmax(0, 1fr))`;
  const month = view === "month";
  const symbolSize = month ? "clamp(0.6rem, 1.1vw, 1.3rem)" : "clamp(1.2rem, 2.6vw, 3rem)";

  return (
    <div className="flex h-full flex-col">
      <div className="grid items-end gap-1 pb-1" style={{ gridTemplateColumns: cols }}>
        <div />
        {dates.map((d) => {
          const isToday = d === today;
          return (
            <div
              key={d}
              className="rounded-md py-1 text-center leading-tight"
              style={{
                color: isToday ? "var(--text)" : "var(--muted)",
                background: isToday ? "rgba(255,255,255,0.10)" : "transparent",
                fontSize: month ? "clamp(0.55rem, 0.9vw, 0.9rem)" : "clamp(0.8rem, 1.4vw, 1.4rem)",
              }}
            >
              <div>{month ? DOW[dowMon0(d)][0] : DOW[dowMon0(d)]}</div>
              <div className="font-semibold">{Number(d.slice(8))}</div>
            </div>
          );
        })}
      </div>

      <div
        className="grid min-h-0 flex-1 gap-1 overflow-y-auto"
        style={{
          gridTemplateColumns: cols,
          gridAutoRows: "minmax(2.75rem, 7rem)",
          alignContent: "start",
        }}
      >
        {habits.map((h) => renderRow(h))}
      </div>
    </div>
  );

  // A plain render function (not a nested component) so cells are not remounted on every clock tick.
  function renderRow(habit: Habit) {
    return (
      <Fragment key={habit.id}>
        <div className="flex min-w-0 flex-col justify-center pr-2">
          <div className="truncate font-medium" style={{ fontSize: "clamp(0.95rem, 1.7vw, 1.9rem)" }}>
            {habit.name}
          </div>
          {habit.due_time && (
            <div style={{ color: "var(--muted)", fontSize: "clamp(0.7rem, 1vw, 1.1rem)" }}>
              {habit.due_time.slice(0, 5)}
            </div>
          )}
        </div>
        {dates.map((d) => {
          const status = cellStatus({
            date: d,
            startDate: habit.start_date,
            dueTime: habit.due_time,
            done: done.has(`${habit.id}|${d}`),
            now,
          });
          const st = STYLE[status];
          const canToggle = isToggleable(status);
          return (
            <button
              key={d}
              disabled={!canToggle}
              onClick={() => onToggle(habit.id, d)}
              aria-label={`${habit.name}, ${d}: ${st.label}`}
              className="flex items-center justify-center rounded-lg font-bold transition-transform enabled:active:scale-95"
              style={{
                background: st.bg,
                color: st.fg,
                fontSize: symbolSize,
                outline: d === today ? "2px solid rgba(255,255,255,0.18)" : "none",
                outlineOffset: "-2px",
                cursor: canToggle ? "pointer" : "default",
              }}
            >
              {st.symbol}
            </button>
          );
        })}
      </Fragment>
    );
  }
}
