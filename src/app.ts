/**
 * MicroDiary – bootstrap
 * Wires together the database, UI components, and export handlers.
 */
import { todayDate } from "./domain/time";
import { buildCsvExport, downloadCsv } from "./export/csv";
import { buildJsonExport, downloadJson } from "./export/json";
import { getAllEntries, getOrCreateDb } from "./storage/indexeddb";
import { initForm } from "./ui/form";
import { initList } from "./ui/list";
import { initOfflineBanner } from "./ui/offline";
import { CATEGORIES } from "./constants";

async function main(): Promise<void> {
  const db = await getOrCreateDb();

  // Offline status banner
  initOfflineBanner();

  // Populate category options from constants (single source of truth)
  populateCategorySelect();

  // Date picker – defaults to today
  const dateInput = document.getElementById("diary-date") as HTMLInputElement;
  dateInput.value = todayDate();
  const getDate = (): string => dateInput.value || todayDate();

  // List controller
  const { refresh: refreshList } = initList(
    db,
    getDate,
    (entry) => formController.editEntry(entry)
  );

  // Form controller
  const formController = initForm(db, getDate, refreshList);

  // Re-render list when the selected date changes
  dateInput.addEventListener("change", () => {
    refreshList().catch(console.error);
  });

  // Export – JSON (all entries across all dates)
  document
    .getElementById("export-json-btn")
    ?.addEventListener("click", async () => {
      const entries = await getAllEntries(db);
      const envelope = buildJsonExport(entries);
      downloadJson(envelope);
    });

  // Export – CSV
  document
    .getElementById("export-csv-btn")
    ?.addEventListener("click", async () => {
      const entries = await getAllEntries(db);
      const csv = buildCsvExport(entries);
      downloadCsv(csv);
    });

  // Initial list render
  await refreshList();
}

function populateCategorySelect(): void {
  const select = document.getElementById("category") as HTMLSelectElement;
  for (const { value, label } of CATEGORIES) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }
}

main().catch((err) => {
  console.error("MicroDiary failed to start:", err);
  // Show a visible error so the user is not stuck on a blank screen
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<p role="alert" style="color:red;padding:1rem">
       Failed to initialise app. Please refresh. (${String(err)})
     </p>`
  );
});
