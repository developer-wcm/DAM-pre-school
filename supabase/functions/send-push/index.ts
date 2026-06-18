// =============================================================
// send-push – Supabase Edge Function (Deno)
// Stores notifications in DB and delivers via Expo Push API.
// Supports: role-based targeting, user-id targeting, deduplication,
// per-batch retry with exponential back-off, and delivery logging.
// =============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_CHUNK   = 100   // Expo allows max 100 messages per request
const MAX_RETRIES  = 3
const RETRY_DELAY_MS = 1000  // base delay; multiplied by attempt

// ─── Helpers ─────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

// Maps notification category → Android channel ID
function categoryToChannel(category: string): string {
  if (category === 'emergency_alert') return 'emergency'
  if (['fee_reminder', 'fee_payment_success', 'fee_received'].includes(category)) return 'fees'
  if (['child_check_in', 'child_check_out', 'attendance_update',
       'attendance_reminder', 'attendance_pending'].includes(category)) return 'attendance'
  if (['school_announcement', 'new_announcement'].includes(category)) return 'announcements'
  return 'general'
}

// ─── Expo push with retry ─────────────────────────────────────

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: string
  priority?: string
  channelId?: string
  badge?: number
}

interface ExpoTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

async function sendToExpo(
  messages: ExpoPushMessage[]
): Promise<{ tickets: ExpoTicket[]; error?: string }> {
  let lastError = ''
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method:  'POST',
        headers: {
          'Content-Type':   'application/json',
          'Accept':         'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      })

      if (!res.ok) {
        lastError = `HTTP ${res.status}`
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt)
          continue
        }
        return { tickets: [], error: lastError }
      }

      const json = await res.json()
      // Expo returns { data: ExpoTicket[] }
      const tickets: ExpoTicket[] = json.data ?? []
      return { tickets }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt)
    }
  }
  return { tickets: [], error: lastError }
}

// ─── Main handler ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // ── Auth verification ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    // Service-role client – bypasses RLS for reads & writes
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Parse body ─────────────────────────────────────────────
    const {
      roles,
      user_ids,
      school_id = '',
      title,
      body,
      category = 'school_announcement',
      data: extraData = {},
      idempotency_key,
    } = await req.json()

    if (!title || !body) return json({ error: 'title and body are required' }, 400)
    if (!roles?.length && !user_ids?.length) {
      return json({ error: 'Provide roles or user_ids' }, 400)
    }

    // ── Fetch target push tokens ───────────────────────────────
    let tokenQuery = admin
      .from('push_tokens')
      .select('user_id, token')
      .eq('is_active', true)

    if (user_ids?.length) {
      tokenQuery = tokenQuery.in('user_id', user_ids)
    } else {
      tokenQuery = tokenQuery.in('role', roles)
      if (school_id) tokenQuery = tokenQuery.eq('school_id', school_id)
    }

    // Never send a push notification to the caller's own device
    tokenQuery = tokenQuery.neq('user_id', user.id)

    const { data: tokenRows, error: tokenErr } = await tokenQuery
    if (tokenErr) throw tokenErr

    if (!tokenRows?.length) return json({ sent: 0, stored: 0 })

    // ── Store notifications in DB (one row per recipient) ──────
    const channelId = categoryToChannel(category)
    const sentAt    = new Date().toISOString()

    const notifInserts = tokenRows.map((row: { user_id: string; token: string }) => ({
      user_id:         row.user_id,
      school_id,
      title,
      body,
      category,
      data:            { ...extraData, category },
      is_read:         false,
      is_deleted:      false,
      sent_at:         sentAt,
      idempotency_key: idempotency_key ?? null,
    }))

    // Upsert with per-user idempotency – duplicates are silently ignored
    const { data: insertedNotifs, error: insertErr } = await admin
      .from('notifications')
      .upsert(notifInserts, {
        onConflict:           'user_id,idempotency_key',
        ignoreDuplicates:     true,
      })
      .select('id, user_id')

    if (insertErr) {
      console.error('[send-push] notification insert error:', insertErr.message)
    }

    const storedCount = insertedNotifs?.length ?? 0

    // Build notif-id map for delivery logging
    const notifIdByUser: Record<string, string> = {}
    for (const n of insertedNotifs ?? []) {
      notifIdByUser[n.user_id] = n.id
    }

    // ── Send push messages in chunks ───────────────────────────
    const messages: ExpoPushMessage[] = tokenRows.map(
      (row: { user_id: string; token: string }) => ({
        to:        row.token,
        title,
        body,
        data:      { ...extraData, category },
        sound:     'default',
        priority:  category === 'emergency_alert' ? 'high' : 'default',
        channelId,
        badge:     1,
      })
    )

    const chunks = chunk(messages, EXPO_CHUNK)
    const tokenChunks = chunk(tokenRows, EXPO_CHUNK)

    let totalSent = 0
    const deliveryLogs: object[] = []

    for (let ci = 0; ci < chunks.length; ci++) {
      const { tickets, error: expoErr } = await sendToExpo(chunks[ci])

      for (let ti = 0; ti < tokenChunks[ci].length; ti++) {
        const row    = tokenChunks[ci][ti] as { user_id: string; token: string }
        const ticket = tickets[ti]
        const notifId = notifIdByUser[row.user_id]

        const status =
          expoErr            ? 'error'   :
          !ticket             ? 'error'   :
          ticket.status === 'ok' ? 'sent' : 'failed'

        if (status === 'sent') totalSent++

        deliveryLogs.push({
          notification_id: notifId ?? null,
          push_token:      row.token,
          expo_ticket_id:  ticket?.id ?? null,
          status,
          error_message:
            expoErr ?? ticket?.message ??
            ticket?.details?.error ?? null,
          attempt_count:   1,
          last_attempt_at: sentAt,
        })
      }
    }

    // ── Persist delivery log (best-effort) ────────────────────
    if (deliveryLogs.length) {
      await admin.from('notification_delivery_log').insert(deliveryLogs)
    }

    return json({ sent: totalSent, stored: storedCount })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[send-push] unhandled error:', msg)
    return json({ error: msg }, 500)
  }
})

// ─── Convenience ─────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
