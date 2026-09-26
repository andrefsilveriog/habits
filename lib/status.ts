// Pure date + status logic. No imports, so it can be tested with plain Node.
// All "days" are YYYY-MM-DD strings in the app time zone.

export const TZ = "America/Sao_Paulo";

export type Ymd = string;

function partsInTz(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    hm: `${get("hour")}:${get("minute")}`,
  };
}

export function todayYmd(now: Date): Ymd {
  return partsInTz(now).ymd;
}

export function nowHm(now: Date): string {
  return partsInTz(now).hm;
}

function toUtc(ymd: Ymd): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(d: Date): Ymd {
  return d.toISOString().slice(0, 10);
}

export function addDays(ymd: Ymd, n: number): Ymd {
  const d = toUtc(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

/** 0 = Monday ... 6 = Sunday */
export function dowMon0(ymd: Ymd): number {
  return (toUtc(ymd).getUTCDay() + 6) % 7;
}

export function mondayOf(ymd: Ymd): Ymd {
  return addDays(ymd, -dowMon0(ymd));
}

export function weekDates(anchor: Ymd): Ymd[] {
  const start = mondayOf(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function monthDates(anchor: Ymd): Ymd[] {
  const [y, m] = anchor.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return Array.from({ length: days }, (_, i) => `${y}-${mm}-${String(i + 1).padStart(2, "0")}`);
}

export function shiftMonth(anchor: Ymd, delta: number): Ymd {
  const [y, m] = anchor.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return fromUtc(d);
}

export type CellStatus =
  | "done" // completed
  | "pending" // today and due now (or no due time)
  | "upcoming" // today but its due time has not arrived yet (shown gray)
  | "missed" // past day, not completed
  | "future" // after today
  | "before"; // before the habit existed

export function cellStatus(input: {
  date: Ymd;
  startDate: Ymd;
  dueTime: string | null; // "HH:MM" or "HH:MM:SS"
  done: boolean;
  now: Date;
}): CellStatus {
  const { date, startDate, dueTime, done, now } = input;
  if (done) return "done";
  if (date < startDate) return "before";
  const today = todayYmd(now);
  if (date > today) return "future";
  if (date < today) return "missed";
  if (!dueTime) return "pending";
  return nowHm(now) >= dueTime.slice(0, 5) ? "pending" : "upcoming";
}

/** Whether a cell may be toggled by the user. */
export function isToggleable(status: CellStatus): boolean {
  return status !== "future" && status !== "before";
}
