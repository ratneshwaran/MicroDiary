import {
  CLIENT_ID_KEY,
  DRAFT_KEY,
  DRAFT_SAVED_AT_KEY,
} from "../constants";
import type { FormFields } from "../domain/schema";

// ---------------------------------------------------------------------------
// Client ID – a stable pseudonymous identifier persisted across sessions
// ---------------------------------------------------------------------------

/** Get the existing client ID or generate and persist a new one. */
export function getOrCreateClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// Draft autosave – keeps form state across page reloads
// ---------------------------------------------------------------------------

export interface DraftState {
  fields: Partial<FormFields>;
  savedAt: string; // ISO timestamp
}

/** Persist the current form state as a draft. */
export function saveDraft(fields: Partial<FormFields>): void {
  const state: DraftState = { fields, savedAt: new Date().toISOString() };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  localStorage.setItem(DRAFT_SAVED_AT_KEY, state.savedAt);
}

/** Load a previously saved draft, or return null if none exists. */
export function loadDraft(): DraftState | null {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DraftState;
  } catch {
    return null;
  }
}

/** Discard the current draft. */
export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(DRAFT_SAVED_AT_KEY);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Returns a debounced version of `fn` that delays execution by `delayMs`.
 * Each new call resets the timer.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
