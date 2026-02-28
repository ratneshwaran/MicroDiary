import { describe, it, expect } from "vitest";
import {
  timeToMinutes,
  minutesToTime,
  isTimeBefore,
  timesOverlap,
  findGaps,
  todayDate,
} from "../time";

describe("timeToMinutes", () => {
  it("converts midnight correctly", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("converts noon correctly", () => {
    expect(timeToMinutes("12:00")).toBe(720);
  });

  it("converts end of day correctly", () => {
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("converts arbitrary time correctly", () => {
    expect(timeToMinutes("09:30")).toBe(570);
  });
});

describe("minutesToTime", () => {
  it("converts 0 to 00:00", () => {
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("converts 720 to 12:00", () => {
    expect(minutesToTime(720)).toBe("12:00");
  });

  it("pads hours and minutes with leading zeros", () => {
    expect(minutesToTime(65)).toBe("01:05");
  });

  it("round-trips with timeToMinutes", () => {
    expect(minutesToTime(timeToMinutes("14:45"))).toBe("14:45");
  });
});

describe("isTimeBefore", () => {
  it("returns true when a is before b", () => {
    expect(isTimeBefore("08:00", "09:00")).toBe(true);
  });

  it("returns false when a equals b", () => {
    expect(isTimeBefore("08:00", "08:00")).toBe(false);
  });

  it("returns false when a is after b", () => {
    expect(isTimeBefore("10:00", "09:00")).toBe(false);
  });
});

describe("timesOverlap", () => {
  it("detects a full overlap", () => {
    expect(
      timesOverlap(
        { startTime: "09:00", endTime: "10:00" },
        { startTime: "09:00", endTime: "10:00" }
      )
    ).toBe(true);
  });

  it("detects a partial overlap", () => {
    expect(
      timesOverlap(
        { startTime: "09:00", endTime: "10:30" },
        { startTime: "10:00", endTime: "11:00" }
      )
    ).toBe(true);
  });

  it("returns false for back-to-back entries (touching, not overlapping)", () => {
    expect(
      timesOverlap(
        { startTime: "09:00", endTime: "10:00" },
        { startTime: "10:00", endTime: "11:00" }
      )
    ).toBe(false);
  });

  it("returns false for non-overlapping entries", () => {
    expect(
      timesOverlap(
        { startTime: "09:00", endTime: "10:00" },
        { startTime: "11:00", endTime: "12:00" }
      )
    ).toBe(false);
  });

  it("detects when one entry is contained within another", () => {
    expect(
      timesOverlap(
        { startTime: "08:00", endTime: "12:00" },
        { startTime: "09:00", endTime: "11:00" }
      )
    ).toBe(true);
  });
});

describe("findGaps", () => {
  it("returns empty array when no entries", () => {
    expect(findGaps([])).toEqual([]);
  });

  it("detects a gap between entries", () => {
    const entries = [
      { startTime: "06:00", endTime: "07:00" },
      { startTime: "09:00", endTime: "10:00" },
    ];
    const gaps = findGaps(entries, { dayStart: "06:00", dayEnd: "10:00" });
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toEqual({ from: "07:00", to: "09:00" });
  });

  it("does not report a gap smaller than minGapMinutes", () => {
    const entries = [
      { startTime: "06:00", endTime: "07:00" },
      { startTime: "07:10", endTime: "08:00" },
    ];
    const gaps = findGaps(entries, {
      dayStart: "06:00",
      dayEnd: "08:00",
      minGapMinutes: 15,
    });
    expect(gaps).toHaveLength(0);
  });

  it("reports a trailing gap at end of day", () => {
    const entries = [{ startTime: "06:00", endTime: "08:00" }];
    const gaps = findGaps(entries, { dayStart: "06:00", dayEnd: "12:00" });
    expect(gaps).toHaveLength(1);
    expect(gaps[0].from).toBe("08:00");
  });
});

describe("todayDate", () => {
  it("returns a string matching YYYY-MM-DD", () => {
    expect(todayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
