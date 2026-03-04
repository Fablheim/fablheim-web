/**
 * Helpers for merging and managing systemData on initiative entries.
 *
 * systemData has 4 known namespaces:
 *   - damage:     per-hit context (type, source)
 *   - downed:     system-specific downed state (dying value, stress boxes, etc.)
 *   - resources:  per-entry tracked resources
 *   - conditions: numeric values for conditions that have hasValue: true
 *
 * The server enforces a hard 4096-byte size limit (JSON.stringify).
 */

const SYSTEM_DATA_MAX_BYTES = 4096;
const SYSTEM_DATA_WARN_BYTES = 3072; // 75% — warn before hitting the limit

export type SystemDataNamespace = 'damage' | 'downed' | 'resources' | 'conditions';

export interface SystemData {
  damage?: Record<string, unknown>;
  downed?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  conditions?: Record<string, number>;
  [key: string]: unknown;
}

/**
 * Deep-merge a patch into existing systemData.
 * - Only merges known namespaces (shallow merge within each namespace).
 * - Deletes namespace keys whose values are null/undefined.
 * - Removes empty namespace objects to avoid bloat.
 * - Returns a new object (never mutates the input).
 */
export function mergeSystemData(
  existing: SystemData | undefined,
  patch: Partial<SystemData>,
): SystemData | undefined {
  const result: SystemData = { ...(existing ?? {}) };

  for (const key of Object.keys(patch) as (keyof SystemData)[]) {
    const patchValue = patch[key];

    // Explicitly deleting a namespace
    if (patchValue === null || patchValue === undefined) {
      delete result[key];
      continue;
    }

    // For known namespaces, shallow-merge the objects
    if (typeof patchValue === 'object' && !Array.isArray(patchValue)) {
      const existingNs =
        typeof result[key] === 'object' && !Array.isArray(result[key])
          ? (result[key] as Record<string, unknown>)
          : {};
      const merged: Record<string, unknown> = { ...existingNs };

      for (const [k, v] of Object.entries(patchValue as Record<string, unknown>)) {
        if (v === null || v === undefined) {
          delete merged[k];
        } else {
          merged[k] = v;
        }
      }

      // Remove empty namespace objects
      if (Object.keys(merged).length === 0) {
        delete result[key];
      } else {
        (result as any)[key] = merged;
      }
    } else {
      // Scalar or array — just set directly
      (result as any)[key] = patchValue;
    }
  }

  // If the entire object is empty, return undefined to avoid sending {}
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Check the byte size of systemData and return a status.
 * Returns { ok, bytes, warning?, error? }.
 */
export function checkSystemDataSize(data: SystemData | undefined): {
  ok: boolean;
  bytes: number;
  warning?: string;
  error?: string;
} {
  if (!data) return { ok: true, bytes: 0 };

  const bytes = new TextEncoder().encode(JSON.stringify(data)).length;

  if (bytes > SYSTEM_DATA_MAX_BYTES) {
    return {
      ok: false,
      bytes,
      error: `systemData exceeds ${SYSTEM_DATA_MAX_BYTES} bytes (${bytes}). Remove some data before saving.`,
    };
  }

  if (bytes > SYSTEM_DATA_WARN_BYTES) {
    return {
      ok: true,
      bytes,
      warning: `systemData is ${bytes}/${SYSTEM_DATA_MAX_BYTES} bytes — approaching limit.`,
    };
  }

  return { ok: true, bytes };
}

/**
 * Toggle a condition value in systemData.conditions.
 * - On add: sets value to 1 (correction #8).
 * - On remove: deletes the key entirely.
 */
export function toggleConditionValue(
  existing: SystemData | undefined,
  conditionKey: string,
  active: boolean,
): SystemData | undefined {
  const conditionsPatch: Record<string, number | null> = {};

  if (active) {
    conditionsPatch[conditionKey] = 1;
  } else {
    conditionsPatch[conditionKey] = null; // will be deleted by mergeSystemData
  }

  return mergeSystemData(existing, { conditions: conditionsPatch as Record<string, number> });
}

/**
 * Set a specific condition's numeric value (e.g. exhaustion level, dying value).
 */
export function setConditionValue(
  existing: SystemData | undefined,
  conditionKey: string,
  value: number,
): SystemData | undefined {
  return mergeSystemData(existing, {
    conditions: { [conditionKey]: value },
  });
}
