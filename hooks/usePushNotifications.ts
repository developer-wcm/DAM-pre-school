import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

const EAS_PROJECT_ID = '2af89656-d00c-4120-aacf-5e9c24c773b3'

// expo-notifications remote push was removed from Expo Go in SDK 53; skip setup there
const isExpoGo = Constants.appOwnership === 'expo'

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'DAM PreSchool',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A90D9',
    })
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })
    return data
  } catch {
    return null
  }
}

export function usePushNotifications(
  userId: string | null,
  role: string | null,
  schoolId: string | null
) {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null)
  const responseListener = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    if (!userId || isExpoGo) return

    getExpoPushToken().then(async (token) => {
      if (!token) return
      await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          token,
          role,
          school_id: schoolId,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    })

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // notification received while app is foregrounded
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // user tapped the notification
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [userId, role, schoolId])
}
