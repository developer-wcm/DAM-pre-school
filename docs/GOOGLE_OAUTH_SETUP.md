# Google OAuth Setup Guide

## ✅ What I Fixed

### 1. Removed Duplicate Redirects
- **Problem**: Google login had manual redirect + automatic redirect fighting each other
- **Solution**: Removed manual redirect, let auth context route guard handle ALL redirects
- **Result**: Google login now works exactly like email/password login

### 2. Environment Detection
- **Development (Expo Go)**: Uses `exp://localhost:8081`
- **Production (APK)**: Uses `preschoolapp://auth/callback`
- Code automatically detects environment using `__DEV__` flag

## 🔧 Supabase Configuration Required

Go to your Supabase Dashboard → Authentication → URL Configuration

### Redirect URLs (Add ALL of these):
```
preschoolapp://auth/callback
exp://localhost:8081
http://localhost:8081
```

### Site URL:
```
preschoolapp://
```

## 🧪 Testing

### In Expo Go (Development):
1. Run `npx expo start`
2. Open app in Expo Go
3. Select role → Login → Click "Continue with Google"
4. Should redirect to `exp://localhost:8081` after Google auth
5. App should route based on role:
   - **Admin/Principal** → Dashboard (no code)
   - **Parent/Teacher** → Enter code screen

### In APK (Production):
1. Build APK: `npx eas build --platform android --profile preview`
2. Install APK on device
3. Test Google login
4. Should redirect to `preschoolapp://auth/callback`
5. Same routing logic applies

## 🎯 Expected Behavior

### Email/Password Login:
- Admin/Principal → Dashboard ✅
- Parent/Teacher → Enter code → Dashboard ✅

### Google OAuth Login:
- Admin/Principal → Dashboard ✅ (FIXED)
- Parent/Teacher → Enter code → Dashboard ✅ (FIXED)

## 🐛 Troubleshooting

### "Redirect URL not allowed"
- Check Supabase has all 3 URLs added
- Make sure no typos in URLs
- URLs are case-sensitive

### "Stuck on login screen"
- Check console logs for errors
- Verify user exists in database
- Check user has `approved: true` in profiles table

### "Goes to enter-code instead of dashboard"
- Verify user role is 'admin' or 'principal' in database
- Check `approved: true` in profiles table
- Look for console logs showing role detection

## 📝 Demo Users

```sql
-- Admin (goes to dashboard, no code)
Email: admin@dampreschool.com
Password: admin123
Role: admin

-- Parent (goes to enter-code)
Email: parent@example.com
Password: parent123
Code: 123456
Role: parent

-- Teacher (goes to enter-code)
Email: teacher@example.com
Password: teacher123
Code: 654321
Role: teacher
```

## 🔍 How It Works Now

1. User clicks "Continue with Google"
2. Opens Google OAuth in browser
3. User approves access
4. Google redirects back with tokens in URL
5. App extracts tokens from URL hash
6. Sets session in Supabase
7. Fetches user profile from database
8. **Route guard automatically redirects based on role** ✅
   - No manual redirect conflicts
   - Consistent behavior with email/password login
