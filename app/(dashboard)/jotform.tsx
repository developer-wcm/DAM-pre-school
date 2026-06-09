/**
 * JotForm WebView Screen
 * ─────────────────────
 * Opened after a teacher or parent submits a leave / absence request.
 *
 * Navigation params:
 *   formKey   – key from JOTFORMS constant  (e.g. "TEACHER_LEAVE")
 *   userName  – pre-filled name shown in the header
 *   role      – "teacher" | "parent"
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { JOTFORMS, JotFormKey } from '../../constants/jotforms';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPlaceholderUrl(url: string) {
  return url.includes('YOUR_') || url.includes('FORM_ID');
}

function getRoleLabel(role: string) {
  if (role === 'teacher' || role === 'principal') return 'Staff Leave Form';
  return 'Parent Request Form';
}

function getRoleColor(role: string) {
  if (role === 'teacher' || role === 'principal') return '#2A9D6E';
  return '#7B6FE8';
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function JotFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    formKey: string;
    userName: string;
    role: string;
  }>();

  const formKey = (params.formKey ?? 'TEACHER_LEAVE') as JotFormKey;
  const userName = params.userName ?? '';
  const role = params.role ?? 'teacher';

  const formUrl = JOTFORMS[formKey];
  const placeholder = isPlaceholderUrl(formUrl);

  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);

  const accentColor = getRoleColor(role);
  const title = getRoleLabel(role);

  // Detect JotForm "Thank You" page → show success state
  function handleNavChange(nav: WebViewNavigation) {
    const url = nav.url ?? '';
    if (
      url.includes('formResponse') ||
      url.includes('thankyou') ||
      url.includes('thank-you') ||
      url.includes('submission')
    ) {
      setSubmitted(true);
    }
  }

  function handleClose() {
    if (!submitted) {
      Alert.alert(
        'Leave Form',
        'Are you sure you want to close without submitting the form?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Close', style: 'destructive', onPress: () => router.navigate('/(dashboard)/more') },
        ]
      );
    } else {
      router.navigate('/(dashboard)/more');
    }
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: accentColor + '30' }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          {userName ? (
            <Text style={styles.headerSub} numberOfLines={1}>{userName}</Text>
          ) : null}
        </View>
        {/* Reload button */}
        <TouchableOpacity
          style={styles.reloadBtn}
          onPress={() => { setError(false); setLoading(true); webviewRef.current?.reload(); }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color="#5A5A7A" />
        </TouchableOpacity>
      </View>

      {/* ── Progress bar ── */}
      {loading && !submitted && !placeholder && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accentColor }]} />
        </View>
      )}

      {/* ── Placeholder notice ── */}
      {placeholder ? (
        <PlaceholderView formKey={formKey} accentColor={accentColor} onBack={() => router.navigate('/(dashboard)/more')} />
      ) : submitted ? (
        <SuccessView accentColor={accentColor} onDone={() => router.navigate('/(dashboard)/more')} />
      ) : error ? (
        <ErrorView
          onRetry={() => { setError(false); setLoading(true); webviewRef.current?.reload(); }}
          onBack={() => router.navigate('/(dashboard)/more')}
        />
      ) : (
        <>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={styles.loadingText}>Loading form…</Text>
            </View>
          )}
          <WebView
            ref={webviewRef}
            source={{ uri: formUrl }}
            style={[styles.webview, loading && { opacity: 0 }]}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
            onNavigationStateChange={handleNavChange}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
          />
        </>
      )}
    </View>
  );
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

function SuccessView({ accentColor, onDone }: { accentColor: string; onDone: () => void }) {
  return (
    <View style={styles.centeredView}>
      <View style={[styles.successIcon, { backgroundColor: accentColor + '20' }]}>
        <Ionicons name="checkmark-circle" size={64} color={accentColor} />
      </View>
      <Text style={styles.successTitle}>Form Submitted!</Text>
      <Text style={styles.successText}>
        Your request has been recorded. The admin will review it shortly.
      </Text>
      <TouchableOpacity style={[styles.doneBtn, { backgroundColor: accentColor }]} onPress={onDone} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

function ErrorView({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <View style={styles.centeredView}>
      <Ionicons name="cloud-offline-outline" size={64} color="#C4C4D4" />
      <Text style={styles.errorTitle}>Couldn't Load Form</Text>
      <Text style={styles.errorText}>Please check your internet connection and try again.</Text>
      <View style={styles.errorBtns}>
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Ionicons name="refresh" size={16} color="#7B6FE8" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PlaceholderView({ formKey, accentColor, onBack }: {
  formKey: string; accentColor: string; onBack: () => void;
}) {
  return (
    <View style={styles.centeredView}>
      <View style={[styles.successIcon, { backgroundColor: '#FFF0D4' }]}>
        <Ionicons name="link-outline" size={48} color="#E8A020" />
      </View>
      <Text style={styles.successTitle}>JotForm Not Connected</Text>
      <Text style={styles.successText}>
        Open <Text style={{ fontWeight: '800' }}>constants/jotforms.ts</Text> and replace the
        placeholder URL for{' '}
        <Text style={{ fontWeight: '800', color: accentColor }}>{formKey}</Text> with your
        real JotForm link.
      </Text>
      <View style={styles.codeBlock}>
        <Text style={styles.codeText}>
          {`JOTFORMS.${formKey} =\n'https://form.jotform.com/YOUR_ID'`}
        </Text>
      </View>
      <TouchableOpacity style={[styles.doneBtn, { backgroundColor: '#E8A020' }]} onPress={onBack} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F4F5F9', justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  headerSub: { fontSize: 12, color: '#7A7A9D', marginTop: 1, fontWeight: '500' },
  reloadBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F4F5F9', justifyContent: 'center', alignItems: 'center',
  },

  progressBar: { height: 3, backgroundColor: '#F0F0F8' },
  progressFill: { height: 3, borderRadius: 2 },

  webview: { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', gap: 12,
    zIndex: 10,
  },
  loadingText: { fontSize: 14, color: '#7A7A9D', fontWeight: '500' },

  centeredView: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  successText: { fontSize: 14, color: '#7A7A9D', textAlign: 'center', lineHeight: 22 },
  doneBtn: {
    paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14,
    marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  errorTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  errorText: { fontSize: 14, color: '#7A7A9D', textAlign: 'center', lineHeight: 22 },
  errorBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#E8E4F8',
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#7B6FE8' },
  backBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#F4F5F9',
  },
  backBtnText: { fontSize: 14, fontWeight: '700', color: '#5A5A7A' },

  codeBlock: {
    backgroundColor: '#1A1A2E', borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 14,
    alignSelf: 'stretch',
  },
  codeText: { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontSize: 13, color: '#E8A020' },
});
