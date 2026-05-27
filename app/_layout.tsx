import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/auth';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="role-selection" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="parental-consent" options={{ headerShown: false }} />
          <Stack.Screen name="approval-pending" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="privacy-notice" options={{ headerShown: false }} />
          <Stack.Screen name="admission-choice" options={{ headerShown: false }} />
          <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
          <Stack.Screen name="(parent)" options={{ headerShown: false }} />
          <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
          <Stack.Screen name="teacher-appointments" options={{ headerShown: false }} />
          <Stack.Screen name="parent-appointments" options={{ headerShown: false }} />
          <Stack.Screen name="(accountant)" options={{ headerShown: false }} />
          <Stack.Screen name="admission/step-1" options={{ headerShown: false }} />
          <Stack.Screen name="admission/step-2" options={{ headerShown: false }} />
          <Stack.Screen name="admission/step-3" options={{ headerShown: false }} />
          <Stack.Screen name="admission/step-4" options={{ headerShown: false }} />
          <Stack.Screen name="admission/step-5" options={{ headerShown: false }} />
          <Stack.Screen name="admission/thank-you" options={{ headerShown: false }} />
          <Stack.Screen name="admission/thank-you-simple" options={{ headerShown: false }} />
          <Stack.Screen name="admission/thank-you-match" options={{ headerShown: false }} />
          <Stack.Screen name="parent-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="existing-student" options={{ headerShown: false }} />
          <Stack.Screen name="account-pending" options={{ headerShown: false }} />
          <Stack.Screen name="enter-code" options={{ headerShown: false }} />
          <Stack.Screen name="select-class" options={{ headerShown: false }} />
          <Stack.Screen name="enter-class-id" options={{ headerShown: false }} />
          <Stack.Screen name="auth-choice" options={{ headerShown: false }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
