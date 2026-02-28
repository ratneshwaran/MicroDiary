import type { FieldError } from "../domain/validation";

/** Show a validation error inline on a form field. */
export function showFieldError(fieldId: string, message: string): void {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);

  input?.setAttribute("aria-invalid", "true");

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.removeAttribute("hidden");
  }
}

/** Clear the inline error for a single form field. */
export function clearFieldError(fieldId: string): void {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);

  input?.removeAttribute("aria-invalid");

  if (errorEl) {
    errorEl.textContent = "";
    errorEl.setAttribute("hidden", "");
  }
}

/** Clear all inline errors across the form. */
export function clearAllFieldErrors(fieldIds: string[]): void {
  for (const id of fieldIds) {
    clearFieldError(id);
  }
  hideErrorSummary();
}

/**
 * Populate and reveal the error summary region, then move focus to it.
 * Each error links to its field so keyboard and screen-reader users can
 * navigate directly to the offending control.
 */
export function showErrorSummary(errors: FieldError[]): void {
  const summary = document.getElementById("error-summary") as HTMLElement | null;
  const list = document.getElementById("error-summary-list");
  if (!summary || !list) return;

  list.innerHTML = "";
  for (const { fieldId, message } of errors) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${fieldId}`;
    a.textContent = message;
    li.appendChild(a);
    list.appendChild(li);
  }

  summary.removeAttribute("hidden");
  // Move focus so screen readers announce the summary immediately
  summary.focus();
}

/** Hide and clear the error summary. */
export function hideErrorSummary(): void {
  const summary = document.getElementById("error-summary");
  const list = document.getElementById("error-summary-list");
  summary?.setAttribute("hidden", "");
  if (list) list.innerHTML = "";
}
