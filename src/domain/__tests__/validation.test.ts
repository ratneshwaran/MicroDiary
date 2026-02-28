import { describe, it, expect } from "vitest";
import { validateFormFields } from "../validation";
import type { DiaryEntry } from "../schema";
import { SCHEMA_VERSION } from "../../constants";

// Minimal valid entry factory – avoids repeating boilerplate in every test
function makeEntry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    date: "2024-01-15",
    activity: "Morning run",
    category: "leisure",
    startTime: "07:00",
    endTime: "08:00",
    createdAt: "2024-01-15T07:00:00.000Z",
    updatedAt: "2024-01-15T07:00:00.000Z",
    provenance: {
      source: "manual-entry",
      clientId: "test-client",
      timeZone: "Europe/London",
    },
    schemaVersion: SCHEMA_VERSION,
    appVersion: "0.1.0",
    ...overrides,
  };
}

describe("validateFormFields", () => {
  it("passes with valid fields and no existing entries", () => {
    const result = validateFormFields(
      {
        activity: "Breakfast",
        category: "personal-care",
        startTime: "08:00",
        endTime: "09:00",
      },
      []
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when activity is empty", () => {
    const result = validateFormFields(
      { activity: "", category: "work", startTime: "09:00", endTime: "10:00" },
      []
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.fieldId === "activity")).toBe(true);
  });

  it("fails when category is empty", () => {
    const result = validateFormFields(
      { activity: "Work", category: "", startTime: "09:00", endTime: "10:00" },
      []
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.fieldId === "category")).toBe(true);
  });

  it("fails when endTime is before startTime", () => {
    const result = validateFormFields(
      {
        activity: "Lunch",
        category: "personal-care",
        startTime: "13:00",
        endTime: "12:00",
      },
      []
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.fieldId === "end-time")).toBe(true);
  });

  it("fails when endTime equals startTime", () => {
    const result = validateFormFields(
      {
        activity: "Nap",
        category: "sleep",
        startTime: "14:00",
        endTime: "14:00",
      },
      []
    );
    expect(result.valid).toBe(false);
  });

  it("fails when new entry overlaps an existing one", () => {
    const existing = makeEntry({ startTime: "09:00", endTime: "10:30" });
    const result = validateFormFields(
      {
        activity: "Meeting",
        category: "work",
        startTime: "10:00",
        endTime: "11:00",
      },
      [existing]
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.fieldId === "start-time")).toBe(true);
  });

  it("passes for back-to-back entries (no overlap)", () => {
    const existing = makeEntry({ startTime: "09:00", endTime: "10:00" });
    const result = validateFormFields(
      {
        activity: "Coffee break",
        category: "leisure",
        startTime: "10:00",
        endTime: "10:30",
      },
      [existing]
    );
    expect(result.valid).toBe(true);
  });

  it("excludes the entry being edited from the overlap check", () => {
    const existing = makeEntry({ startTime: "09:00", endTime: "10:00" });
    // Re-saving the same entry with an extended end time — should not self-conflict
    const result = validateFormFields(
      {
        activity: "Morning run",
        category: "leisure",
        startTime: "09:00",
        endTime: "10:30",
      },
      [existing],
      existing.id // editingId
    );
    expect(result.valid).toBe(true);
  });

  it("collects multiple errors at once", () => {
    const result = validateFormFields(
      { activity: "", category: "", startTime: "10:00", endTime: "09:00" },
      []
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
