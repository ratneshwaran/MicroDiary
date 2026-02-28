import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { DB_NAME, DB_VERSION, STORE_NAME } from "../constants";
import { EntrySchema, type DiaryEntry } from "../domain/schema";

/** Typed DB schema for idb */
interface MicroDiarySchema extends DBSchema {
  entries: {
    key: string;
    value: DiaryEntry;
    indexes: {
      "by-date": string;
    };
  };
}

export type MicroDiaryDB = IDBPDatabase<MicroDiarySchema>;

let dbPromise: Promise<MicroDiaryDB> | null = null;

/** Open (or reuse) the IndexedDB database. */
export async function getOrCreateDb(): Promise<MicroDiaryDB> {
  if (!dbPromise) {
    dbPromise = openDB<MicroDiarySchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by-date", "date");
      },
    });
  }
  return dbPromise;
}

/** Persist a new entry, running schema validation first. */
export async function saveEntry(
  db: MicroDiaryDB,
  entry: DiaryEntry
): Promise<void> {
  EntrySchema.parse(entry); // throws ZodError if invalid
  await db.put(STORE_NAME, entry);
}

/** Update an existing entry in place, running schema validation first. */
export async function updateEntry(
  db: MicroDiaryDB,
  entry: DiaryEntry
): Promise<void> {
  EntrySchema.parse(entry);
  await db.put(STORE_NAME, entry);
}

/** Retrieve all entries for a specific date, sorted by start time. */
export async function getEntriesForDate(
  db: MicroDiaryDB,
  date: string
): Promise<DiaryEntry[]> {
  const entries = await db.getAllFromIndex(STORE_NAME, "by-date", date);
  return entries.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Delete a single entry by its id. */
export async function deleteEntry(
  db: MicroDiaryDB,
  id: string
): Promise<void> {
  await db.delete(STORE_NAME, id);
}

/** Retrieve every entry across all dates (for export). */
export async function getAllEntries(db: MicroDiaryDB): Promise<DiaryEntry[]> {
  const entries = await db.getAll(STORE_NAME);
  return entries.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    return dateCmp !== 0 ? dateCmp : a.startTime.localeCompare(b.startTime);
  });
}
