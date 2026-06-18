// =============================================================
// Notification System – TypeScript Types
// =============================================================

// ─── Category ────────────────────────────────────────────────
// Each category drives: icon, accent color, deep-link screen,
// and Android notification channel.

export type NotificationCategory =
  // Parent
  | 'child_check_in'
  | 'child_check_out'
  | 'attendance_update'
  | 'fee_reminder'
  | 'fee_payment_success'
  | 'homework_assigned'
  | 'event_reminder'
  | 'school_announcement'
  | 'emergency_alert'
  | 'photo_upload'
  // Teacher
  | 'attendance_reminder'
  | 'parent_message'
  | 'meeting_reminder'
  | 'new_announcement'
  | 'daily_report_reminder'
  // Admin / Principal
  | 'new_registration'
  | 'fee_received'
  | 'attendance_pending'
  | 'complaint'
  | 'support_request';

// ─── Android channel IDs ─────────────────────────────────────
export type NotificationChannelId =
  | 'emergency'
  | 'fees'
  | 'attendance'
  | 'announcements'
  | 'general';

// Maps a category to its Android channel
export const CATEGORY_TO_CHANNEL: Record<NotificationCategory, NotificationChannelId> = {
  emergency_alert:        'emergency',
  fee_reminder:           'fees',
  fee_payment_success:    'fees',
  fee_received:           'fees',
  child_check_in:         'attendance',
  child_check_out:        'attendance',
  attendance_update:      'attendance',
  attendance_reminder:    'attendance',
  attendance_pending:     'attendance',
  school_announcement:    'announcements',
  new_announcement:       'announcements',
  homework_assigned:      'general',
  event_reminder:         'general',
  photo_upload:           'general',
  parent_message:         'general',
  meeting_reminder:       'general',
  daily_report_reminder:  'general',
  new_registration:       'general',
  complaint:              'general',
  support_request:        'general',
};

// ─── Deep-link data attached to every notification ───────────
export interface NotificationActionData {
  screen?: string;
  studentId?: string;
  studentName?: string;
  feeId?: string;
  eventId?: string;
  parentId?: string;
  teacherId?: string;
  amount?: number;
  [key: string]: unknown;
}

// ─── Database row shape ───────────────────────────────────────
export interface AppNotification {
  id: string;
  user_id: string;
  school_id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  data: NotificationActionData;
  is_read: boolean;
  is_deleted: boolean;
  sent_at: string;
  read_at: string | null;
  idempotency_key: string | null;
  created_at: string;
}

// ─── Payload sent to the edge function ───────────────────────
export interface SendNotificationPayload {
  /** Target by role (within a school). Mutually exclusive with user_ids. */
  roles?: Array<'admin' | 'principal' | 'teacher' | 'parent'>;
  /** Target specific users (any school). Mutually exclusive with roles. */
  user_ids?: string[];
  school_id?: string;
  title: string;
  body: string;
  category: NotificationCategory;
  data?: NotificationActionData;
  /**
   * Optional idempotency key. Same key for the same user in 24 h is
   * silently deduplicated – prevents double-sending on retries.
   */
  idempotency_key?: string;
}

// ─── Edge-function response ───────────────────────────────────
export interface SendNotificationResult {
  sent: number;
  stored: number;
  errors?: string[];
}

// ─── Category UI metadata ─────────────────────────────────────
export interface CategoryMeta {
  icon: string;          // Ionicons name
  color: string;         // accent hex
  bg: string;            // icon bubble background hex
  label: string;         // human-readable label
}

export const CATEGORY_META: Record<NotificationCategory, CategoryMeta> = {
  // Parent
  child_check_in:        { icon: 'log-in-outline',        color: '#2ECC71', bg: '#D4F4E8', label: 'Check-in' },
  child_check_out:       { icon: 'log-out-outline',       color: '#F39C12', bg: '#FEF4E4', label: 'Check-out' },
  attendance_update:     { icon: 'checkbox-outline',      color: '#3498DB', bg: '#D6EAF8', label: 'Attendance' },
  fee_reminder:          { icon: 'wallet-outline',        color: '#E74C3C', bg: '#FDEAEA', label: 'Fee Reminder' },
  fee_payment_success:   { icon: 'checkmark-circle-outline', color: '#2ECC71', bg: '#D4F4E8', label: 'Payment' },
  homework_assigned:     { icon: 'book-outline',          color: '#9B59B6', bg: '#EAD6F8', label: 'Homework' },
  event_reminder:        { icon: 'calendar-outline',      color: '#1ABC9C', bg: '#D1F2EB', label: 'Event' },
  school_announcement:   { icon: 'megaphone-outline',     color: '#1E3A5F', bg: '#E8EDF3', label: 'Announcement' },
  emergency_alert:       { icon: 'shield-outline',        color: '#E74C3C', bg: '#FDEAEA', label: 'Emergency' },
  photo_upload:          { icon: 'image-outline',         color: '#3498DB', bg: '#D6EAF8', label: 'Photo' },
  // Teacher
  attendance_reminder:   { icon: 'time-outline',          color: '#F39C12', bg: '#FEF4E4', label: 'Attendance' },
  parent_message:        { icon: 'chatbubble-outline',    color: '#3498DB', bg: '#D6EAF8', label: 'Message' },
  meeting_reminder:      { icon: 'people-outline',        color: '#1ABC9C', bg: '#D1F2EB', label: 'Meeting' },
  new_announcement:      { icon: 'megaphone-outline',     color: '#1E3A5F', bg: '#E8EDF3', label: 'Announcement' },
  daily_report_reminder: { icon: 'document-text-outline', color: '#9B59B6', bg: '#EAD6F8', label: 'Report' },
  // Admin
  new_registration:      { icon: 'person-add-outline',   color: '#2ECC71', bg: '#D4F4E8', label: 'Registration' },
  fee_received:          { icon: 'cash-outline',          color: '#2ECC71', bg: '#D4F4E8', label: 'Fee Received' },
  attendance_pending:    { icon: 'hourglass-outline',     color: '#F39C12', bg: '#FEF4E4', label: 'Attendance' },
  complaint:             { icon: 'alert-circle-outline',  color: '#E74C3C', bg: '#FDEAEA', label: 'Complaint' },
  support_request:       { icon: 'help-circle-outline',   color: '#3498DB', bg: '#D6EAF8', label: 'Support' },
};
