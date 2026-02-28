/** Application version – mirrors package.json version */
export const APP_VERSION = "0.1.0";

/** Schema version for data model compatibility checks */
export const SCHEMA_VERSION = "1.0" as const;

/** IndexedDB database name and version */
export const DB_NAME = "microdiary";
export const DB_VERSION = 1;
export const STORE_NAME = "entries";

/** LocalStorage keys */
export const DRAFT_KEY = "microdiary-draft";
export const CLIENT_ID_KEY = "microdiary-client-id";
export const DRAFT_SAVED_AT_KEY = "microdiary-draft-saved-at";

/** Activity categories for the form select */
export const CATEGORIES = [
  { value: "work", label: "Work" },
  { value: "education", label: "Education" },
  { value: "leisure", label: "Leisure" },
  { value: "personal-care", label: "Personal Care" },
  { value: "household", label: "Household" },
  { value: "travel", label: "Travel" },
  { value: "social", label: "Social" },
  { value: "sleep", label: "Sleep / Rest" },
  { value: "other", label: "Other" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];
