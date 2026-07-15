import { z } from 'zod';

/**
 * Request validation for result payloads.
 *
 * Schemas trim/sanitize strings, clamp score ranges, and strip unknown keys.
 * `improvement` is intentionally NOT accepted from the client — it is derived
 * from before/after in the store's read view, so it can never drift.
 */

const trimmed = z.string().trim();
const optionalTrimmed = (max) =>
  trimmed
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined);
const optionalText = optionalTrimmed(2000);
// Photos/logos are root-relative upload paths ("/uploads/students/..") produced
// by our own upload endpoint. Allow those or absolute http(s) URLs.
const assetUrl = z
  .string()
  .trim()
  .max(1024)
  .regex(/^(\/uploads\/|https?:\/\/)/, 'Must be an uploaded path or http(s) URL');
const optionalAssetUrl = assetUrl
  .optional()
  .or(z.literal(''))
  .transform((v) => v || undefined);

const satScore = z.coerce.number().int().min(400).max(1600);
const mathScore = z.coerce.number().int().min(200).max(800);

const baseFields = {
  studentName: trimmed.min(1).max(120),
  photoUrl: assetUrl,
  testimonial: optionalText,
  published: z.coerce.boolean().default(false),
};

// Plain object schemas (no cross-field refinement) so `.partial()` works for
// PATCH/PUT updates. Cross-field checks are applied separately below.
export const universityObject = z
  .object({
    ...baseFields,
    // A strong score can be showcased before any acceptance comes in, so the
    // university name and acceptance status are optional.
    universityName: optionalTrimmed(160),
    universityLogoUrl: optionalAssetUrl,
    country: trimmed.min(1).max(80),
    overallScore: satScore,
    acceptanceStatus: optionalTrimmed(80),
  })
  .strict();

export const mathObject = z
  .object({
    ...baseFields,
    mathBefore: mathScore,
    mathAfter: mathScore,
    overallScore: satScore.optional(),
  })
  .strict();

const OBJECTS = { university: universityObject, math: mathObject };

/** Cross-field invariant for math records; returns an error map or null. */
function mathOrderError(data) {
  if (data.mathBefore != null && data.mathAfter != null && data.mathAfter < data.mathBefore) {
    return { mathAfter: ['Score after must be greater than or equal to before'] };
  }
  return null;
}

function flatten(error) {
  return z.flattenError(error).fieldErrors;
}

/**
 * Validate a full create payload for a category.
 * @returns {{ ok: true, data: object } | { ok: false, errors: object }}
 */
export function validateCreate(category, body) {
  const schema = OBJECTS[category];
  if (!schema) return { ok: false, errors: { _: ['Unknown category'] } };
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) return { ok: false, errors: flatten(parsed.error) };
  if (category === 'math') {
    const orderErr = mathOrderError(parsed.data);
    if (orderErr) return { ok: false, errors: orderErr };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Validate a partial update payload (all fields optional).
 * @returns {{ ok: true, data: object } | { ok: false, errors: object }}
 */
export function validateUpdate(category, body) {
  const schema = OBJECTS[category];
  if (!schema) return { ok: false, errors: { _: ['Unknown category'] } };
  const parsed = schema.partial().safeParse(body ?? {});
  if (!parsed.success) return { ok: false, errors: flatten(parsed.error) };
  if (category === 'math') {
    const orderErr = mathOrderError(parsed.data);
    if (orderErr) return { ok: false, errors: orderErr };
  }
  return { ok: true, data: parsed.data };
}
