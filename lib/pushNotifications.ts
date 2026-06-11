import { supabase } from './supabase'

type Role = 'admin' | 'principal' | 'teacher' | 'parent'

export async function sendPushToRoles(
  roles: Role[],
  title: string,
  body: string,
  schoolId: string,
  data?: Record<string, unknown>
) {
  const { error } = await supabase.functions.invoke('send-push', {
    body: { roles, school_id: schoolId, title, body, data },
  })
  if (error) console.warn('[Push] send failed:', error.message)
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const { error } = await supabase.functions.invoke('send-push', {
    body: { user_ids: userIds, title, body, data },
  })
  if (error) console.warn('[Push] send failed:', error.message)
}
