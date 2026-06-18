import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AdmissionProvider } from '../context/admission'
import { AuthProvider, useAuth } from '../context/auth'
import { NotificationProvider } from '../context/notifications'
import { usePushNotifications } from '../hooks/usePushNotifications'

function PushNotificationManager() {
  const { user, profile } = useAuth()
  usePushNotifications(user?.id ?? null, profile?.role ?? null, profile?.school_id ?? null)
  return null
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <PushNotificationManager />
          <AdmissionProvider>
            <Stack>
              <Stack.Screen name="index"                options={{ headerShown: false }} />
              <Stack.Screen name="role-selection"       options={{ headerShown: false }} />
              <Stack.Screen name="sign-up"              options={{ headerShown: false }} />
              <Stack.Screen name="login"                options={{ headerShown: false }} />
              <Stack.Screen name="privacy-notice"       options={{ headerShown: false }} />
              <Stack.Screen name="(dashboard)"          options={{ headerShown: false }} />
              <Stack.Screen name="(parent)"             options={{ headerShown: false }} />
              <Stack.Screen name="(teacher)"            options={{ headerShown: false }} />
              <Stack.Screen name="teacher-appointments" options={{ headerShown: false }} />
              <Stack.Screen name="parent-appointments"  options={{ headerShown: false }} />
              <Stack.Screen name="account-pending"      options={{ headerShown: false }} />
              <Stack.Screen name="auth-callback"        options={{ headerShown: false }} />
              <Stack.Screen name="find-school"          options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </AdmissionProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
