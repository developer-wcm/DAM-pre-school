// Quick test — sends a push notification directly to one device via Expo Push API
// No Supabase needed for this test.
//
// HOW TO USE:
//   1. Open Supabase dashboard → Table Editor → push_tokens
//   2. Copy the token value (starts with ExponentPushToken[...])
//   3. Paste it below as EXPO_PUSH_TOKEN
//   4. Run:  node test-push.js

const EXPO_PUSH_TOKEN = 'ExponentPushToken[PASTE-YOUR-TOKEN-HERE]'

async function sendTestNotification() {
  const message = {
    to: EXPO_PUSH_TOKEN,
    title: '🔔 DAM PreSchool',
    body: 'Push notifications are working!',
    data: { screen: 'notifications' },
    sound: 'default',
    priority: 'high',
  }

  console.log('Sending to:', EXPO_PUSH_TOKEN)

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(message),
  })

  const result = await res.json()

  if (result.data?.status === 'ok') {
    console.log('✅ Notification sent successfully!')
  } else if (result.data?.status === 'error') {
    console.error('❌ Expo rejected the notification:')
    console.error('   Code:', result.data.details?.error)
    console.error('   Message:', result.data.message)
  } else {
    console.log('Response:', JSON.stringify(result, null, 2))
  }
}

sendTestNotification().catch(console.error)
