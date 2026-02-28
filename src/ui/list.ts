import type { DiaryEntry } from "../domain/schema";
import type { MicroDiaryDB } from "../storage/indexeddb";
import { deleteEntry, getEntriesForDate } from "../storage/indexeddb";
import { findGaps, formatDateTime } from "../domain/time";

export interface ListController {
  refresh: () => Promise<void>;
}

/**
 * Initialise the entry list / timeline section.
 *
 * @param db       - Open IndexedDB instance.
 * @param getDate  - Returns the currently selected diary date (YYYY-MM-DD).
 * @param onEdit   - Called when the user activates the Edit button on an entry.
 */
export function initList(
  db: MicroDiaryDB,
  getDate: () => string,
  onEdit: (entry: DiaryEntry) => void
): ListController {
  const listEl = document.getElementById("entries-list") as HTMLUListElement;
  const emptyEl = document.getElementById("no-entries") as HTMLParagraphElement;
  const gapWarningEl = document.getElementById("gap-warning") as HTMLDivElement;

  async function refresh(): Promise<void> {
    const date = getDate();
    const entries = await getEntriesForDate(db, date);

    listEl.innerHTML = "";

    if (entries.length === 0) {
      emptyEl.removeAttribute("hidden");
      gapWarningEl.setAttribute("hidden", "");
      return;
    }

    emptyEl.setAttribute("hidden", "");

    // Warn about gaps (non-blocking – does not prevent saving)
    const gaps = findGaps(entries);
    if (gaps.length > 0) {
      const gapText = gaps.map((g) => `${g.from}–${g.to}`).join(", ");
      gapWarningEl.textContent = `Heads up: gaps in today's diary (${gapText}). Consider adding entries to cover these periods.`;
      gapWarningEl.removeAttribute("hidden");
    } else {
      gapWarningEl.setAttribute("hidden", "");
    }

    for (const entry of entries) {
      const li = buildEntryItem(entry, onEdit, async () => {
        await deleteEntry(db, entry.id);
        await refresh();
      });
      listEl.appendChild(li);
    }
  }

  return { refresh };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function buildEntryItem(
  entry: DiaryEntry,
  onEdit: (entry: DiaryEntry) => void,
  onDelete: () => Promise<void>
): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "entry-item";
  li.dataset.id = entry.id;

  // --- Time bar ---
  const timeBar = document.createElement("div");
  timeBar.className = "entry-time-bar";
  timeBar.setAttribute("aria-hidden", "true");

  const timeLabel = document.createElement("span");
  timeLabel.className = "entry-time";
  timeLabel.textContent = `${entry.startTime} – ${entry.endTime}`;

  const durationLabel = document.createElement("span");
  durationLabel.className = "entry-duration";
  durationLabel.textContent = formatDuration(entry.startTime, entry.endTime);

  timeBar.appendChild(timeLabel);
  timeBar.appendChild(durationLabel);

  // --- Body ---
  const body = document.createElement("div");
  body.className = "entry-body";

  const activityEl = document.createElement("strong");
  activityEl.className = "entry-activity";
  activityEl.textContent = entry.activity;

  const badge = document.createElement("span");
  badge.className = "entry-category-badge";
  badge.textContent = entry.category;

  const headerRow = document.createElement("div");
  headerRow.className = "entry-header-row";
  headerRow.appendChild(activityEl);
  headerRow.appendChild(badge);

  body.appendChild(headerRow);

  if (entry.notes) {
    const notes = document.createElement("p");
    notes.className = "entry-notes";
    notes.textContent = entry.notes;
    body.appendChild(notes);
  }

  const meta = document.createElement("p");
  meta.className = "entry-meta";
  meta.textContent = `Saved: ${formatDateTime(entry.updatedAt)}`;
  body.appendChild(meta);

  // --- Actions ---
  const actions = document.createElement("div");
  actions.className = "entry-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-secondary btn-sm";
  editBtn.textContent = "Edit";
  editBtn.setAttribute(
    "aria-label",
    `Edit "${entry.activity}" at ${entry.startTime}`
  );
  editBtn.addEventListener("click", () => onEdit(entry));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-danger btn-sm";
  deleteBtn.textContent = "Delete";
  deleteBtn.setAttribute(
    "aria-label",
    `Delete "${entry.activity}" at ${entry.startTime}`
  );
  deleteBtn.addEventListener("click", () => confirmDelete(entry, onDelete));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(timeBar);
  li.appendChild(body);
  li.appendChild(actions);

  return li;
}

function confirmDelete(
  entry: DiaryEntry,
  onDelete: () => Promise<void>
): void {
  const confirmed = window.confirm(
    `Delete "${entry.activity}" (${entry.startTime}–${entry.endTime})?\n\nThis cannot be undone.`
  );
  if (confirmed) {
    onDelete().catch(console.error);
  }
}

function formatDuration(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const totalMins = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMins <= 0) return "";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
