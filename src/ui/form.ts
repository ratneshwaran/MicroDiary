import { APP_VERSION, SCHEMA_VERSION } from "../constants";
import type { DiaryEntry, FormFields } from "../domain/schema";
import {
  FIELD_ID_MAP,
  validateFormFields,
} from "../domain/validation";
import {
  getEntriesForDate,
  saveEntry,
  type MicroDiaryDB,
  updateEntry,
} from "../storage/indexeddb";
import {
  clearDraft,
  debounce,
  getOrCreateClientId,
  loadDraft,
  saveDraft,
} from "../storage/localstorage";
import {
  clearAllFieldErrors,
  clearFieldError,
  showErrorSummary,
  showFieldError,
} from "./errors";

export interface FormController {
  /** Populate the form with an existing entry for editing. */
  editEntry: (entry: DiaryEntry) => void;
}

/** All HTML element ids that can carry an error state. */
const ALL_FIELD_IDS = Object.values(FIELD_ID_MAP);

/**
 * Wire up the entry form: autosave, validation, save, clear, and edit mode.
 *
 * @param db       - Open IndexedDB instance.
 * @param getDate  - Returns the currently selected diary date (YYYY-MM-DD).
 * @param onSaved  - Called after a successful save/update so the list can refresh.
 */
export function initForm(
  db: MicroDiaryDB,
  getDate: () => string,
  onSaved: () => Promise<void>
): FormController {
  // --- DOM references ---
  const form = document.getElementById("entry-form") as HTMLFormElement;
  const activityInput = document.getElementById("activity") as HTMLInputElement;
  const categorySelect = document.getElementById(
    "category"
  ) as HTMLSelectElement;
  const startTimeInput = document.getElementById(
    "start-time"
  ) as HTMLInputElement;
  const endTimeInput = document.getElementById("end-time") as HTMLInputElement;
  const notesInput = document.getElementById("notes") as HTMLTextAreaElement;
  const lastSavedEl = document.getElementById("last-saved");
  const formHeadingEl = document.getElementById("form-heading");
  const saveBtnEl = document.getElementById("save-btn");
  const liveRegionEl = document.getElementById("live-region");

  const allInputs = [
    activityInput,
    categorySelect,
    startTimeInput,
    endTimeInput,
    notesInput,
  ];

  // Tracks whether we are editing an existing entry or creating a new one
  let editingId: string | undefined;
  let editingCreatedAt: string | undefined;

  // --- Restore draft on load ---
  const draft = loadDraft();
  if (draft) {
    populateInputs(draft.fields);
    setLastSavedText(draft.savedAt);
  }

  // --- Debounced autosave (500 ms) ---
  const autosave = debounce(() => {
    const fields = readFields();
    saveDraft(fields);
    setLastSavedText(new Date().toISOString());
  }, 500);

  for (const el of allInputs) {
    el.addEventListener("input", autosave);
    // Clear inline error as soon as the user starts correcting
    el.addEventListener("input", () => clearFieldError(el.id));
  }

  // --- Form submit ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSave().catch(console.error);
  });

  // --- Clear button ---
  document.getElementById("clear-btn")?.addEventListener("click", () => {
    resetForm();
  });

  // ---------------------------------------------------------------------------
  // Core logic
  // ---------------------------------------------------------------------------

  function readFields(): Partial<FormFields> {
    return {
      activity: activityInput.value.trim() || undefined,
      category: categorySelect.value || undefined,
      startTime: startTimeInput.value || undefined,
      endTime: endTimeInput.value || undefined,
      notes: notesInput.value.trim() || undefined,
    };
  }

  async function handleSave(): Promise<void> {
    clearAllFieldErrors(ALL_FIELD_IDS);

    const fields = readFields();
    const date = getDate();
    const dateEntries = await getEntriesForDate(db, date);
    const { valid, errors } = validateFormFields(fields, dateEntries, editingId);

    if (!valid) {
      for (const { fieldId, message } of errors) {
        showFieldError(fieldId, message);
      }
      showErrorSummary(errors);
      return;
    }

    const now = new Date().toISOString();
    const clientId = getOrCreateClientId();

    const entry: DiaryEntry = {
      id: editingId ?? crypto.randomUUID(),
      date,
      activity: fields.activity!,
      category: fields.category!,
      startTime: fields.startTime!,
      endTime: fields.endTime!,
      notes: fields.notes,
      createdAt: editingCreatedAt ?? now,
      updatedAt: now,
      provenance: {
        source: "manual-entry",
        clientId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
    };

    if (editingId) {
      await updateEntry(db, entry);
    } else {
      await saveEntry(db, entry);
    }

    const wasEditing = !!editingId;
    resetForm();
    await onSaved();
    announce(wasEditing ? "Entry updated." : "Entry saved.");
  }

  function resetForm(): void {
    editingId = undefined;
    editingCreatedAt = undefined;
    form.reset();
    clearAllFieldErrors(ALL_FIELD_IDS);
    clearDraft();
    setLastSavedText(null);
    setFormMode("add");
  }

  function setFormMode(mode: "add" | "edit"): void {
    if (formHeadingEl) {
      formHeadingEl.textContent = mode === "edit" ? "Edit Entry" : "Add Entry";
    }
    if (saveBtnEl) {
      saveBtnEl.textContent = mode === "edit" ? "Update Entry" : "Save Entry";
    }
  }

  function setLastSavedText(savedAt: string | null): void {
    if (!lastSavedEl) return;
    if (!savedAt) {
      lastSavedEl.textContent = "";
      return;
    }
    const time = new Date(savedAt).toLocaleTimeString(undefined, {
      timeStyle: "medium",
    });
    lastSavedEl.textContent = `Draft last saved locally at ${time}`;
  }

  function populateInputs(fields: Partial<FormFields>): void {
    if (fields.activity !== undefined) activityInput.value = fields.activity;
    if (fields.category !== undefined) categorySelect.value = fields.category;
    if (fields.startTime !== undefined) startTimeInput.value = fields.startTime;
    if (fields.endTime !== undefined) endTimeInput.value = fields.endTime;
    if (fields.notes !== undefined) notesInput.value = fields.notes;
  }

  /** Politely announce a short status message to screen readers. */
  function announce(message: string): void {
    if (!liveRegionEl) return;
    liveRegionEl.textContent = message;
    setTimeout(() => {
      liveRegionEl.textContent = "";
    }, 4000);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  function editEntry(entry: DiaryEntry): void {
    editingId = entry.id;
    editingCreatedAt = entry.createdAt;

    populateInputs({
      activity: entry.activity,
      category: entry.category,
      startTime: entry.startTime,
      endTime: entry.endTime,
      notes: entry.notes,
    });

    clearAllFieldErrors(ALL_FIELD_IDS);
    setFormMode("edit");

    // Scroll form into view and focus first field for keyboard users
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    activityInput.focus();
  }

  return { editEntry };
}
