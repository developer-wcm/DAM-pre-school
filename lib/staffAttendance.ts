/**
 * Staff attendance domain logic.
 *
 * Staff attendance is stored in the dedicated `staff_attendance` table, keyed
 * by the staff member's profile id in the `staff_id` column. `marked_by`
 * records who set it.
 */
import { supabase } from './supabase';
import { toDateKey } from './attendance';

export type StaffMarkStatus = 'present' | 'absent' | 'late';

export interface MarkStaffAttendanceInput {
  schoolId: string;
  staffId: string;
  date: Date;
  status: StaffMarkStatus;
  markedBy: string;
  source?: 'manual' | 'wifi';
}

/** Upsert a single staff member's attendance for a given day. */
export async function markStaffAttendance(
  input: MarkStaffAttendanceInput
): Promise<{ error: string | null }> {
  const { schoolId, staffId, date, status, markedBy, source = 'manual' } = input;

  const { error } = await supabase.from('staff_attendance').upsert(
    {
      school_id: schoolId,
      staff_id: staffId,
      date: toDateKey(date),
      status,
      marked_by: markedBy,
      notes: source === 'wifi' ? 'Auto check-in (WiFi)' : null,
    },
    { onConflict: 'staff_id,date' }
  );

  return { error: error ? error.message : null };
}

/**
 * Parse an "HH:MM" cutoff string and decide whether `now` counts as late.
 * Falls back to not-late if the cutoff is missing or malformed.
 */
export function isLateAtCutoff(cutoff: string | null | undefined, now = new Date()): boolean {
  if (!cutoff) return false;
  const match = /^(\d{1,2}):(\d{2})$/.exec(cutoff.trim());
  if (!match) return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return false;

  const cutoffDate = new Date(now);
  cutoffDate.setHours(hours, minutes, 0, 0);
  return now.getTime() > cutoffDate.getTime();
}

/** Friendly error mapper shared with the marking UI. */
export function mapStaffAttendanceError(message: string): string {
  if (message.includes('row-level security')) {
    return 'You do not have permission to mark staff attendance.';
  }
  if (message.includes('foreign key') || message.includes('violates')) {
    return 'Could not save — this staff member may not be set up for attendance yet.';
  }
  return 'Could not save attendance. Please try again.';
}
