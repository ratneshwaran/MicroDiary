import { z } from "zod";
import { SCHEMA_VERSION } from "../constants";

/** Provenance metadata – records how and where the entry was created */
export const ProvenanceSchema = z.object({
  source: z.literal("manual-entry"),
  clientId: z.string().min(1, "clientId must not be empty"),
  timeZone: z.string().min(1, "timeZone must not be empty"),
});

/** Full diary entry as stored in IndexedDB */
export const EntrySchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  activity: z.string().min(1, "Activity is required").max(200),
  category: z.string().min(1, "Category is required"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  notes: z.string().max(2000).optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  provenance: ProvenanceSchema,
  schemaVersion: z.literal(SCHEMA_VERSION),
  appVersion: z.string().min(1),
});

export type DiaryEntry = z.infer<typeof EntrySchema>;
export type Provenance = z.infer<typeof ProvenanceSchema>;

/** Form field subset – used during UI validation before building a full entry */
export const FormFieldsSchema = z.object({
  activity: z.string().min(1, "Activity is required"),
  category: z.string().min(1, "Category is required"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  notes: z.string().optional(),
});

export type FormFields = z.infer<typeof FormFieldsSchema>;

/** Export envelope – wraps all entries with metadata for research use */
export const ExportEnvelopeSchema = z.object({
  exportedAt: z.string().datetime({ offset: true }),
  clientId: z.string(),
  schemaVersion: z.literal(SCHEMA_VERSION),
  appVersion: z.string(),
  entries: z.array(EntrySchema),
});

export type ExportEnvelope = z.infer<typeof ExportEnvelopeSchema>;
