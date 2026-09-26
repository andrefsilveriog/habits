import assert from "node:assert/strict";
import {
  addDays,
  cellStatus,
  dowMon0,
  isToggleable,
  monthDates,
  mondayOf,
  nowHm,
  shiftMonth,
  todayYmd,
  weekDates,
} from "../lib/status.ts";

// 2026-09-25 is a Friday. 15:30 in Sao Paulo (UTC-3) = 18:30Z.
const now = new Date("2026-09-25T18:30:00Z");

// --- time zone handling
assert.equal(todayYmd(now), "2026-09-25");
assert.equal(nowHm(now), "15:30");
// 23:30 local is 02:30Z the next UTC day: must still be the 25th locally.
assert.equal(todayYmd(new Date("2026-09-26T02:30:00Z")), "2026-09-25");
// Local midnight rollover: 03:00Z is 00:00 local on the 26th.
assert.equal(todayYmd(new Date("2026-09-26T03:00:00Z")), "2026-09-26");
assert.equal(nowHm(new Date("2026-09-26T03:00:00Z")), "00:00");

// --- date helpers
assert.equal(dowMon0("2026-09-25"), 4); // Friday
assert.equal(mondayOf("2026-09-25"), "2026-09-21");
assert.equal(mondayOf("2026-09-27"), "2026-09-21"); // Sunday belongs to the week ending on it
assert.deepEqual(weekDates("2026-09-25"), [
  "2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27",
]);
assert.equal(addDays("2026-09-30", 1), "2026-10-01");
assert.equal(addDays("2026-01-01", -1), "2025-12-31");
assert.equal(monthDates("2026-09-25").length, 30);
assert.equal(monthDates("2028-02-10").length, 29);
assert.equal(monthDates("2026-09-25")[0], "2026-09-01");
assert.equal(shiftMonth("2026-12-15", 1), "2027-01-01");
assert.equal(shiftMonth("2026-01-15", -1), "2025-12-01");

// --- status rules
const base = { startDate: "2026-09-22", dueTime: null as string | null, done: false, now };
const s = (over: Partial<Parameters<typeof cellStatus>[0]>) => cellStatus({ ...base, date: "2026-09-25", ...over });

assert.equal(s({ done: true }), "done");
assert.equal(s({ date: "2026-09-21" }), "before"); // before the habit existed: not red
assert.equal(s({ date: "2026-09-22" }), "missed"); // first day, past, not done
assert.equal(s({ date: "2026-09-24" }), "missed");
assert.equal(s({ date: "2026-09-25" }), "pending"); // today, no due time
assert.equal(s({ date: "2026-09-26" }), "future");
assert.equal(s({ date: "2026-09-26", done: true }), "done");

// due time: gray until the time arrives, then yellow, red only once the day is over
assert.equal(s({ dueTime: "13:00:00" }), "pending"); // 15:30 >= 13:00
assert.equal(s({ dueTime: "15:30" }), "pending"); // exactly due
assert.equal(s({ dueTime: "15:31:00" }), "upcoming");
assert.equal(s({ dueTime: "21:00:00" }), "upcoming");
assert.equal(s({ dueTime: "21:00:00", date: "2026-09-24" }), "missed");
assert.equal(s({ dueTime: "21:00:00", date: "2026-09-26" }), "future");
assert.equal(s({ dueTime: "21:00:00", done: true }), "done"); // may be checked off early

// habit created today, viewed on today
assert.equal(s({ startDate: "2026-09-25", date: "2026-09-24" }), "before");

// toggling
assert.equal(isToggleable("future"), false);
assert.equal(isToggleable("before"), false);
for (const st of ["done", "pending", "upcoming", "missed"] as const) assert.equal(isToggleable(st), true);

console.log("status.test: all assertions passed");
