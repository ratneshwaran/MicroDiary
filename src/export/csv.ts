import type { DiaryEntry } from "../domain/schema";

const CSV_HEADERS = [
  "id",
  "date",
  "activity",
  "category",
  "startTime",
  "endTime",
  "notes",
  "createdAt",
  "updatedAt",
  "provenance.source",
  "provenance.clientId",
  "provenance.timeZone",
  "schemaVersion",
  "appVersion",
] as const;

/** Escape a value for inclusion in a CSV cell (RFC 4180). */
function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function entryToRow(entry: DiaryEntry): string {
  const values: string[] = [
    entry.id,
    entry.date,
    entry.activity,
    entry.category,
    entry.startTime,
    entry.endTime,
    entry.notes ?? "",
    entry.createdAt,
    entry.updatedAt,
    entry.provenance.source,
    entry.provenance.clientId,
    entry.provenance.timeZone,
    entry.schemaVersion,
    entry.appVersion,
  ];
  return values.map(escapeCsvCell).join(",");
}

/** Build a UTF-8 CSV string from an array of diary entries. */
export function buildCsvExport(entries: DiaryEntry[]): string {
  const header = CSV_HEADERS.join(",");
  const rows = entries.map(entryToRow);
  return [header, ...rows].join("\r\n");
}

/** Trigger a CSV file download in the browser. */
export function downloadCsv(csv: string): void {
  // Prepend BOM so Excel opens UTF-8 correctly
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `microdiary-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
