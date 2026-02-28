import type { ZodError } from "zod";
import { FormFieldsSchema, type DiaryEntry, type FormFields } from "./schema";
import { isTimeBefore, timesOverlap } from "./time";

export interface FieldError {
  /** Maps to an HTML element id (e.g. "start-time") */
  fieldId: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

/**
 * Mapping from FormFields schema keys (camelCase) to HTML element ids (kebab-case).
 * Centralised here so both form.ts and validation.ts stay in sync.
 */
export const FIELD_ID_MAP: Record<keyof FormFields, string> = {
  activity: "activity",
  category: "category",
  startTime: "start-time",
  endTime: "end-time",
  notes: "notes",
};

/**
 * Validate form fields against the Zod schema and business rules.
 *
 * @param fields        - Raw values from the form.
 * @param dateEntries   - Existing entries for the same diary date (used for overlap check).
 * @param editingId     - If editing an existing entry, pass its id to exclude it from overlaps.
 */
export function validateFormFields(
  fields: Partial<FormFields>,
  dateEntries: DiaryEntry[],
  editingId?: string
): ValidationResult {
  const errors: FieldError[] = [];

  // --- Zod structural validation ---
  const result = FormFieldsSchema.safeParse(fields);
  if (!result.success) {
    for (const issue of (result.error as ZodError).issues) {
      const schemaKey = String(issue.path[0] ?? "");
      const fieldId = FIELD_ID_MAP[schemaKey as keyof FormFields] ?? schemaKey;
      errors.push({ fieldId, message: issue.message });
    }
  }

  // --- Business rule: endTime must be strictly after startTime ---
  if (fields.startTime && fields.endTime) {
    if (!isTimeBefore(fields.startTime, fields.endTime)) {
      if (!errors.find((e) => e.fieldId === FIELD_ID_MAP.endTime)) {
        errors.push({
          fieldId: FIELD_ID_MAP.endTime,
          message: "End time must be after start time.",
        });
      }
    }
  }

  // --- Business rule: no overlapping entries for this date ---
  if (
    fields.startTime &&
    fields.endTime &&
    isTimeBefore(fields.startTime, fields.endTime)
  ) {
    const candidates = editingId
      ? dateEntries.filter((e) => e.id !== editingId)
      : dateEntries;

    const conflict = candidates.find((e) =>
      timesOverlap(
        { startTime: fields.startTime!, endTime: fields.endTime! },
        { startTime: e.startTime, endTime: e.endTime }
      )
    );

    if (conflict) {
      errors.push({
        fieldId: FIELD_ID_MAP.startTime,
        message: `Time slot overlaps with "${conflict.activity}" (${conflict.startTime}–${conflict.endTime}). Please adjust the times.`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
