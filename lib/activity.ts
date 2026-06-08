import { supabase } from './supabase';

type ActivityType =
  | 'student_enrolled'
  | 'student_removed'
  | 'teacher_approved'
  | 'parent_approved'
  | 'user_rejected'
  | 'payment_received'
  | 'attendance_marked'
  | 'announcement_posted'
  | 'holiday_added';

const ACTIVITY_CONFIG: Record<ActivityType, { icon: string; color: string; dotColor: string }> = {
  student_enrolled:   { icon: '🎒', color: '#E8F4FB', dotColor: '#3498DB' },
  student_removed:    { icon: '👤', color: '#FFE4E4', dotColor: '#E05A5A' },
  teacher_approved:   { icon: '👨‍🏫', color: '#D4F4E8', dotColor: '#2A9D6E' },
  parent_approved:    { icon: '👨‍👩‍👧', color: '#E8E4F8', dotColor: '#7B6FE8' },
  user_rejected:      { icon: '❌', color: '#FFE4E4', dotColor: '#E05A5A' },
  payment_received:   { icon: '💰', color: '#FFF0D4', dotColor: '#D4822A' },
  attendance_marked:  { icon: '✅', color: '#D4F4E8', dotColor: '#2A9D6E' },
  announcement_posted:{ icon: '📢', color: '#E8E4F8', dotColor: '#7B6FE8' },
  holiday_added:      { icon: '🗓️', color: '#FDF6E3', dotColor: '#DAA520' },
};

export async function logActivity(
  schoolId: string,
  type: ActivityType,
  title: string,
  subtitle: string,
  userId?: string
) {
  if (!schoolId) return;
  const cfg = ACTIVITY_CONFIG[type];
  await supabase.from('activity_log').insert({
    school_id: schoolId,
    icon: cfg.icon,
    title,
    subtitle,
    color: cfg.color,
    dot_color: cfg.dotColor,
    user_id: userId ?? null,
  });
}
