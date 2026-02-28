/** Convert a HH:MM string to total minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert total minutes since midnight back to a HH:MM string. */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Return true if time `a` is strictly before time `b` (both HH:MM). */
export function isTimeBefore(a: string, b: string): boolean {
  return timeToMinutes(a) < timeToMinutes(b);
}

/** Return true if two time ranges overlap (treats ranges as half-open intervals). */
export function timesOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string }
): boolean {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && aEnd > bStart;
}

/** Return today's date as a YYYY-MM-DD string in local time. */
export function todayDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Format an ISO datetime string as a locale-appropriate short string. */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * Find gaps in a sorted list of entries.
 * A gap is reported only when it exceeds `minGapMinutes` (default 15).
 */
export function findGaps(
  entries: Array<{ startTime: string; endTime: string }>,
  options: { dayStart?: string; dayEnd?: string; minGapMinutes?: number } = {}
): Array<{ from: string; to: string }> {
  const { dayStart = "06:00", dayEnd = "23:59", minGapMinutes = 15 } = options;

  if (entries.length === 0) return [];

  const sorted = [...entries].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  const gaps: Array<{ from: string; to: string }> = [];
  let cursor = timeToMinutes(dayStart);

  for (const entry of sorted) {
    const start = timeToMinutes(entry.startTime);
    if (start - cursor >= minGapMinutes) {
      gaps.push({ from: minutesToTime(cursor), to: entry.startTime });
    }
    cursor = Math.max(cursor, timeToMinutes(entry.endTime));
  }

  const dayEndMinutes = timeToMinutes(dayEnd);
  if (dayEndMinutes - cursor >= minGapMinutes) {
    gaps.push({ from: minutesToTime(cursor), to: dayEnd });
  }

  return gaps;
}
