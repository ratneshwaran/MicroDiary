import {
  ExportEnvelopeSchema,
  type DiaryEntry,
  type ExportEnvelope,
} from "../domain/schema";
import { APP_VERSION, SCHEMA_VERSION } from "../constants";
import { getOrCreateClientId } from "../storage/localstorage";

/** Build a validated export envelope from an array of entries. */
export function buildJsonExport(entries: DiaryEntry[]): ExportEnvelope {
  const envelope: ExportEnvelope = {
    exportedAt: new Date().toISOString(),
    clientId: getOrCreateClientId(),
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    entries,
  };
  // Validate the full envelope before export
  ExportEnvelopeSchema.parse(envelope);
  return envelope;
}

/** Trigger a JSON file download in the browser. */
export function downloadJson(data: ExportEnvelope): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  triggerDownload(
    blob,
    `microdiary-${new Date().toISOString().slice(0, 10)}.json`
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // Append temporarily so Firefox works
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke asynchronously to ensure the download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
