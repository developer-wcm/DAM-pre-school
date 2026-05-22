/**
 * Type guard utilities for runtime type checking
 */

import type {
    AttendanceStatus,
    ClassLevel,
    FeeStatus,
    NotificationType,
    PaymentMethod,
    UserRole,
} from '../types';

// ============================================================================
// Basic Type Guards
// ============================================================================

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return isNull(value) || isUndefined(value);
}

// ============================================================================
// Domain-Specific Type Guards
// ============================================================================

export function isUserRole(value: unknown): value is UserRole {
  return (
    isString(value) &&
    ['admin', 'teacher', 'parent', 'accountant'].includes(value)
  );
}

export function isClassLevel(value: unknown): value is ClassLevel {
  return (
    isString(value) &&
    ['play-group', 'pre-kg', 'junior-kg', 'senior-kg'].includes(value)
  );
}

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return (
    isString(value) &&
    ['present', 'absent', 'late', 'excused'].includes(value)
  );
}

export function isFeeStatus(value: unknown): value is FeeStatus {
  return (
    isString(value) &&
    ['pending', 'paid', 'overdue', 'partial'].includes(value)
  );
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    isString(value) &&
    ['cash', 'card', 'bank_transfer', 'upi', 'cheque'].includes(value)
  );
}

export function isNotificationType(value: unknown): value is NotificationType {
  return (
    isString(value) &&
    ['info', 'warning', 'success', 'error'].includes(value)
  );
}

// ============================================================================
// Email & Phone Validation
// ============================================================================

export function isValidEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export function isValidPhone(value: unknown): value is string {
  if (!isString(value)) return false;
  // Indian phone number format
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(value.replace(/\D/g, ''));
}

// ============================================================================
// Date Validation
// ============================================================================

export function isValidDate(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export function isValidDateOfBirth(value: unknown): value is string {
  if (!isValidDate(value)) return false;
  const date = new Date(value);
  const now = new Date();
  const age = now.getFullYear() - date.getFullYear();
  // Valid age range for preschool: 2-6 years
  return age >= 2 && age <= 6;
}

// ============================================================================
// Object Shape Validators
// ============================================================================

export function hasRequiredKeys<T extends Record<string, unknown>>(
  obj: unknown,
  keys: (keyof T)[]
): obj is T {
  if (!isObject(obj)) return false;
  return keys.every((key) => key in obj);
}

export function isProfile(value: unknown): value is {
  id: string;
  full_name: string | null;
  role: UserRole;
  school_id: string | null;
  approved: boolean;
} {
  return (
    isObject(value) &&
    hasRequiredKeys(value, ['id', 'full_name', 'role', 'school_id', 'approved']) &&
    isString(value.id) &&
    (isString(value.full_name) || isNull(value.full_name)) &&
    isUserRole(value.role) &&
    (isString(value.school_id) || isNull(value.school_id)) &&
    isBoolean(value.approved)
  );
}

// ============================================================================
// Assertion Functions
// ============================================================================

export function assertString(value: unknown, message?: string): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(message || `Expected string, got ${typeof value}`);
  }
}

export function assertNumber(value: unknown, message?: string): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeError(message || `Expected number, got ${typeof value}`);
  }
}

export function assertUserRole(value: unknown, message?: string): asserts value is UserRole {
  if (!isUserRole(value)) {
    throw new TypeError(message || `Invalid user role: ${value}`);
  }
}

export function assertValidEmail(value: unknown, message?: string): asserts value is string {
  if (!isValidEmail(value)) {
    throw new TypeError(message || `Invalid email: ${value}`);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely parse JSON with type checking
 */
export function safeJsonParse<T>(
  json: string,
  validator?: (value: unknown) => value is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    if (validator && !validator(parsed)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Type-safe object keys
 */
export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Type-safe object entries
 */
export function typedEntries<T extends object>(
  obj: T
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Remove null and undefined from array
 */
export function compact<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((item): item is T => !isNullOrUndefined(item));
}

/**
 * Type-safe array filter
 */
export function filterByType<T, S extends T>(
  array: T[],
  guard: (item: T) => item is S
): S[] {
  return array.filter(guard);
}
