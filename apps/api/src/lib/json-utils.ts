// ===========================================
// JSON Utilities for SQLite/Postgres compatibility
// SQLite stores JSON as strings, Postgres has native JSON
// ===========================================

/**
 * Safely parse a JSON field that might be a string (SQLite) or native object (Postgres)
 */
export function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  
  return value as T;
}

/**
 * Stringify a value for storage (always returns string for SQLite compatibility)
 */
export function stringifyForDb(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

/**
 * Parse array field with type safety
 */
export function parseArrayField<T>(value: unknown): T[] {
  return parseJsonField<T[]>(value, []);
}

/**
 * Parse object field with type safety
 */
export function parseObjectField<T extends Record<string, unknown>>(value: unknown): T {
  return parseJsonField<T>(value, {} as T);
}
