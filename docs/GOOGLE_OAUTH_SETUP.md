# Google OAuth Setup Guide

## How It Works

1. User taps "Continue with Google".
2. The app computes its redirect URI with `Linking.createURL('auth-callback')`,
   which automatically resolves to the right value for the current runtime:
   - **Production / standalone build** → `preschoolapp://auth-callback`
   - **Dev client** → `preschoolapp://auth-callback`
   - **Expo Go** → `exp://<host>:8081/--/auth-callback` (LAN IP or tunnel host)
3. `supabase.auth.signInWithOAuth` opens Google in a browser (PKCE flow).
4. After approval, Google redirects back to the app via the custom scheme.
5. The app exchanges the returned `?code=…` for a session with
   `supabase.auth.exchangeCodeForSession(code)`. This requires the Supabase
   client to be configured with `flowType: 'pkce'` (see `lib/supabase.ts`) so
   the code verifier is persisted across the browser round-trip.
6. The auth context fetches the user's profile and the **route guard
   redirects based on role** — the `auth-callback` screen itself does NOT
   redirect (that would race the token exchange).

## 🔧 Supabase Configuration Required

Go to your Supabase Dashboard → Authentication → URL Configuration.

### Redirect URLs

Add the exact URIs the app emits (note the hyphen: `auth-callback`, matching
the `intentFilters` host in `app.json`):

```
preschoolapp://auth-callback
exp://localhost:8081/--/auth-callback
exp://127.0.0.1:8081/--/auth-callback
```

For Expo Go on a **physical device**, also add your machine's LAN URL (or use
`npx expo start --tunnel` and add the tunnel host). The app logs the exact
redirect URI at runtime — look for `Starting Google OAuth with redirect:` in
the logs and copy that value into the allow-list.

### Site URL

```
preschoolapp://
```

## 🧪 Testing

### Production APK
1. Build: `npx eas build --platform android --profile preview`
2. Install the APK on a device.
3. Capture logs while signing in:
   ```bash
   adb logcat -c
   adb logcat | grep -iE "OAuth|PKCE|Profile|Auth event|redirect"
   ```
4. Expected log sequence:
   `Starting Google OAuth with redirect: preschoolapp://auth-callback`
   → `PKCE code found, exchanging for session...`
   → `User found: <id>` → `Profile fetched: …`
5. App routes by role (see Expected Behavior below).

### Expo Go (development)
1. Run `npx expo start` (add `--tunnel` for a physical device).
2. Open the app in Expo Go.
3. Select role → Login → "Continue with Google".
4. The redirect URI will be an `exp://…/--/auth-callback` URL — make sure it's
   in the Supabase allow-list.

## 🎯 Expected Behavior

Routing is identical for Google OAuth and email/password login, driven by
`utils/auth-routing.ts`:

- **Admin / Principal** → Dashboard
- **Teacher** (approved) → Teacher tabs
- **Parent** (approved) → Enter code → Parent tabs
- **Not approved** → Account pending
- **No profile row** → Account pending

> Note: with the invitation-based OTP signup flow, a brand-new Google user has
> no approved profile and will land on **account-pending**. That is expected —
> it is not an OAuth failure.

## 🐛 Troubleshooting

### "Redirect URL not allowed"
- The redirect URI the app emitted isn't in Supabase's allow-list. Check the
  `Starting Google OAuth with redirect:` log and add that exact value.
- URLs are case-sensitive; confirm `auth-callback` (hyphen), not `auth/callback`.

### "Returns to app but stuck on login"
- Almost always a PKCE issue. Confirm `flowType: 'pkce'` is set in
  `lib/supabase.ts`. Without it, `exchangeCodeForSession` fails silently.
- Check logs for `PKCE code found` followed by an exchange error.

### "Goes to account-pending instead of dashboard"
- Session succeeded; this is approval gating, not an OAuth bug.
- Verify the user's `role` and `approved` columns in the `profiles` table.

## 📝 Related files

- `context/auth.tsx` — `signInWithGoogle` (redirect, code exchange, profile fetch)
- `lib/supabase.ts` — client config (`flowType: 'pkce'`)
- `app/auth-callback.tsx` — spinner screen (no redirect of its own)
- `app.json` — `scheme` and Android `intentFilters` (host `auth-callback`)
- `utils/auth-routing.ts` — role-based redirect logic
