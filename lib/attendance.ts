/**
 * Shared attendance domain logic for dashboard + student profile.
 *
 * Business rule — Late → Absent equivalent:
 * Every 4 Late (L) entries count as 1 full Absent when calculating stats.
 * Examples: 1 Late = 0.25 Absent, 4 Late = 1 Absent.
 */
import { supabase } from './supabase';

/** Count of late marks that equal one full absent. */
export const LATE_PER_ABSENT = 4;

export type AttendanceRecordStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'holiday'
  | 'half-day'
  | 'sick-leave'
  | 'excused';

export type DailyMarkStatus = 'present' | 'absent' | 'late';

export type CalendarDayStatus = AttendanceRecordStatus | 'future' | 'inactive';

export interface AttendanceDbRow {
  date: string;
  status: AttendanceRecordStatus;
  notes?: string | null;
}

export interface AttendanceMetrics {
  workingDays: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  holidayCount: number;
  /** explicit absent + (late / LATE_PER_ABSENT) */
  effectiveAbsent: number;
  presentPct: number;
  absentPct: number;
  attendancePct: number;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Maps DB / legacy values to a storable attendance status. */
export function toRecordStatus(status: string): AttendanceRecordStatus | null {
  switch (status) {
    case 'present':
    case 'absent':
    case 'late':
    case 'holiday':
    case 'half-day':
    case 'sick-leave':
    case 'excused':
      return status;
    default:
      return null;
  }
}

/** Daily marking UI: present | absent | late | unmarked */
export function toDailyMarkStatus(status?: string): DailyMarkStatus | null {
  if (status === 'present' || status === 'absent' || status === 'late') return status;
  return null;
}

/**
 * Late penalty for attendance rate (4 Late = 1 Absent).
 * @param lateCount - number of late marks in the period
 */
export function lateToAbsentEquivalent(lateCount: number): number {
  return lateCount / LATE_PER_ABSENT;
}

/**
 * effectiveAbsent = raw absent + late/4 (fractional allowed).
 */
export function computeEffectiveAbsent(absentCount: number, lateCount: number): number {
  return absentCount + lateToAbsentEquivalent(lateCount);
}

export interface DayMetricInput {
  status: CalendarDayStatus | string;
  isWorkingDay: boolean;
}

/**
 * Recomputes monthly summary cards and attendance % from calendar day statuses.
 * Holidays are excluded from the working-day denominator.
 */
export function computeAttendanceMetrics(days: DayMetricInput[]): AttendanceMetrics {
  const working = days.filter((d) => d.isWorkingDay);
  const workingDays = working.length;

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let holidayCount = 0;

  working.forEach((day) => {
    switch (day.status) {
      case 'present':
        presentCount += 1;
        break;
      case 'absent':
        absentCount += 1;
        break;
      case 'late':
        lateCount += 1;
        break;
      case 'holiday':
        holidayCount += 1;
        break;
      default:
        break;
    }
  });

  const effectiveAbsent = computeEffectiveAbsent(absentCount, lateCount);
  const countableDays = Math.max(workingDays - holidayCount, 0);
  const denominator = Math.max(countableDays, 1);

  const attendancePct = Math.round(((countableDays - effectiveAbsent) / denominator) * 100);
  const presentPct = Math.round((presentCount / denominator) * 100);
  const absentPct = Math.round((effectiveAbsent / denominator) * 100);

  return {
    workingDays,
    presentCount,
    absentCount,
    lateCount,
    holidayCount,
    effectiveAbsent,
    presentPct: Math.min(100, Math.max(0, presentPct)),
    absentPct: Math.min(100, Math.max(0, absentPct)),
    attendancePct: Math.min(100, Math.max(0, attendancePct)),
  };
}

/** Single-day weight for dashboard “present today” widgets (late = 0.75). */
export function presentWeightForStatus(status: string): number {
  switch (status) {
    case 'present':
      return 1;
    case 'late':
      return 1 - 1 / LATE_PER_ABSENT;
    case 'absent':
    case 'sick-leave':
      return 0;
    case 'holiday':
    case 'excused':
      return 1;
    default:
      return 0;
  }
}

export interface CalendarDay {
  day: number;
  status: CalendarDayStatus;
}

export function buildCalendarDays(
  month: Date,
  recordsByDate: Map<string, AttendanceRecordStatus>
): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = getMonthEnd(month).getDate();
  const days: CalendarDay[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    const dateKey = toDateKey(date);
    const weekend = date.getDay() === 0 || date.getDay() === 6;

    if (date > today) {
      days.push({ day, status: 'future' });
      continue;
    }

    if (weekend) {
      days.push({ day, status: 'inactive' });
      continue;
    }

    const record = recordsByDate.get(dateKey);
    if (record) {
      days.push({ day, status: record });
      continue;
    }

    days.push({ day, status: 'inactive' });
  }

  return days;
}

export function getCalendarLeadingBlanks(month: Date): number {
  return new Date(month.getFullYear(), month.getMonth(), 1).getDay();
}

/** Working days = Mon–Fri in month up to today (or full month if month is in the past). */
export function buildWorkingDayInputs(month: Date, days: CalendarDay[]): DayMetricInput[] {
  const monthEnd = getMonthEnd(month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = today < monthEnd ? today : monthEnd;

  return days.map((day) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day.day);
    date.setHours(0, 0, 0, 0);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isFuture = date > cutoff;

    if (isFuture || isWeekend) {
      return { status: day.status, isWorkingDay: false };
    }

    return { status: day.status, isWorkingDay: true };
  });
}

export function metricsFromCalendarMonth(month: Date, days: CalendarDay[]): AttendanceMetrics {
  return computeAttendanceMetrics(buildWorkingDayInputs(month, days));
}

export async function fetchStudentAttendanceMonth(
  schoolId: string,
  studentId: string,
  month: Date
): Promise<{ rows: AttendanceDbRow[]; error: string | null }> {
  const monthStart = toDateKey(getMonthStart(month));
  const monthEnd = toDateKey(getMonthEnd(month));

  const { data, error } = await supabase
    .from('attendance')
    .select('date, status, notes')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .order('date', { ascending: true });

  if (error) {
    return { rows: [], error: error.message };
  }

  return { rows: (data ?? []) as AttendanceDbRow[], error: null };
}

export interface SaveStudentAttendanceInput {
  schoolId: string;
  studentId: string;
  month: Date;
  days: CalendarDay[];
  markedBy: string;
  noteText?: string;
}

/**
 * Persists all marked days for a student/month via upsert.
 * Removes rows for working days cleared back to unmarked (inactive).
 */
export async function saveStudentAttendanceMonth(
  input: SaveStudentAttendanceInput
): Promise<{ error: string | null }> {
  const { schoolId, studentId, month, days, markedBy, noteText } = input;
  const monthStart = getMonthStart(month);

  const toUpsert: {
    school_id: string;
    student_id: string;
    date: string;
    status: AttendanceRecordStatus;
    marked_by: string;
    notes?: string | null;
  }[] = [];

  const toDeleteDates: string[] = [];

  days.forEach((day) => {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day.day);
    const dateKey = toDateKey(date);
    const recordStatus = toRecordStatus(day.status);

    if (recordStatus && day.status !== 'inactive' && day.status !== 'future') {
      toUpsert.push({
        school_id: schoolId,
        student_id: studentId,
        date: dateKey,
        status: recordStatus,
        marked_by: markedBy,
        notes: noteText ?? null,
      });
      return;
    }

    if (day.status === 'inactive' || day.status === 'future') {
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      if (!weekend && day.status === 'inactive') {
        toDeleteDates.push(dateKey);
      }
    }
  });

  if (toUpsert.length > 0) {
    const { error: upsertError } = await supabase.from('attendance').upsert(toUpsert, {
      onConflict: 'student_id,date',
    });
    if (upsertError) {
      return { error: upsertError.message };
    }
  }

  if (toDeleteDates.length > 0) {
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .in('date', toDeleteDates);
    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  return { error: null };
}

export function mapFriendlyAttendanceError(message: string): string {
  if (message.includes('row-level security')) {
    return 'You do not have permission to save attendance. Please sign in as an admin, principal, or teacher for this school.';
  }
  if (message.includes('duplicate key')) {
    return 'Attendance for this date already exists. Please refresh and try again.';
  }
  return 'Could not save attendance. Please try again.';
}
