/**
 * WiFi-based auto check-in for staff.
 *
 * Reads the currently-connected WiFi network name (SSID) and compares it to
 * the school's configured WiFi name. On Android, reading the SSID requires
 * Location permission to be granted and location services to be ON.
 */
import NetInfo from '@react-native-community/netinfo';

export interface WifiState {
  /** Current SSID, or null if not on WiFi / permission denied. */
  ssid: string | null;
  /** True when connected to a WiFi network (regardless of name). */
  isWifi: boolean;
}

function normalize(name: string | null | undefined): string {
  return (name ?? '').trim().replace(/^"|"$/g, '').toLowerCase();
}

/** Reads the current WiFi connection state. */
export async function getWifiState(): Promise<WifiState> {
  try {
    const state = await NetInfo.fetch('wifi');
    const isWifi = state.type === 'wifi' && !!state.isConnected;
    const ssid =
      isWifi && state.details && 'ssid' in state.details
        ? ((state.details as { ssid: string | null }).ssid ?? null)
        : null;
    return { ssid, isWifi };
  } catch {
    return { ssid: null, isWifi: false };
  }
}

/**
 * Returns true when the current WiFi SSID matches the configured school WiFi.
 * Some Android versions return "<unknown ssid>" when permission/location is
 * missing — that never matches a real name, so it safely returns false.
 */
export function ssidMatches(currentSsid: string | null, schoolWifiName: string | null): boolean {
  const a = normalize(currentSsid);
  const b = normalize(schoolWifiName);
  if (!a || !b) return false;
  if (a === '<unknown ssid>') return false;
  return a === b;
}
