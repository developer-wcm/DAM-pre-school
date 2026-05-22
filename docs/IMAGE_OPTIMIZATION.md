# Image Optimization Guide

## Overview
This app uses `expo-image` for optimized image loading with automatic caching, better performance, and smoother transitions.

## What Was Done

### 1. Installed `expo-image`
```bash
npx expo install expo-image
```

### 2. Created Centralized Image Constants
**File:** `constants/images.ts`

All image assets are now centralized in one place for:
- Better maintainability
- Easier updates
- Consistent usage across the app
- Type safety

```typescript
export const IMAGES = {
  schoolLogo: require('../assets/images/school-logo.png'),
  favicon: require('../assets/images/favicon.png'),
  icon: require('../assets/images/icon.png'),
  splashIcon: require('../assets/images/splash-icon.png'),
} as const;
```

### 3. Updated All Screens

**Screens Updated:**
- ✅ `app/index.tsx` (Welcome Screen)
- ✅ `app/role-selection.tsx`
- ✅ `app/login.tsx`
- ✅ `app/admission-choice.tsx`
- ✅ `app/parental-consent.tsx`

**Before:**
```tsx
import { Image } from 'react-native';

<Image 
  source={require('../assets/images/school-logo.png')} 
  style={styles.schoolLogo}
  resizeMode="contain"
/>
```

**After:**
```tsx
import { Image } from 'expo-image';
import { IMAGES } from '../constants/images';

<Image 
  source={IMAGES.schoolLogo}
  style={styles.schoolLogo}
  contentFit="contain"
  transition={300}
  cachePolicy="memory-disk"
/>
```

## Benefits

### 1. **Automatic Caching**
- `cachePolicy="memory-disk"` - Images are cached in memory and disk
- Faster subsequent loads
- Reduced network usage
- Better offline experience

### 2. **Smooth Transitions**
- `transition={300}` - 300ms fade-in animation
- Professional loading experience
- No jarring image pops

### 3. **Better Performance**
- Native image loading optimizations
- Automatic image resizing
- Memory management
- Lazy loading support

### 4. **Smaller Bundle Size**
- More efficient image handling
- Better compression
- Optimized for mobile

### 5. **Consistent API**
- Same API across iOS, Android, and Web
- Better error handling
- More reliable image loading

## Cache Policies

### Available Options:
- `"none"` - No caching (always fetch fresh)
- `"memory"` - Cache in memory only (cleared on app restart)
- `"disk"` - Cache on disk only (persists across restarts)
- `"memory-disk"` - Cache in both (recommended for most cases)

### When to Use Each:

**`memory-disk` (Default - Used in this app)**
- Static assets like logos
- Images that don't change frequently
- Best for performance

**`memory`**
- User profile pictures that might update
- Dynamic content that changes occasionally

**`disk`**
- Large images
- When memory is constrained

**`none`**
- Real-time data
- Images that change frequently
- Sensitive content

## Content Fit Options

Replaced `resizeMode` with `contentFit`:

- `"contain"` - Fit entire image (used for logos)
- `"cover"` - Fill container, crop if needed
- `"fill"` - Stretch to fill
- `"none"` - Original size
- `"scale-down"` - Smaller of contain or none

## Additional Features Available

### Placeholder
```tsx
<Image 
  source={IMAGES.schoolLogo}
  placeholder={require('../assets/images/placeholder.png')}
  contentFit="contain"
/>
```

### Blur Hash (for progressive loading)
```tsx
<Image 
  source={IMAGES.schoolLogo}
  placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
  contentFit="contain"
/>
```

### Priority Loading
```tsx
<Image 
  source={IMAGES.schoolLogo}
  priority="high"
  contentFit="contain"
/>
```

### Recycling (for lists)
```tsx
<Image 
  source={IMAGES.schoolLogo}
  recyclingKey="school-logo"
  contentFit="contain"
/>
```

## Performance Tips

### 1. **Use Appropriate Image Sizes**
Don't use 4K images for small icons. Resize images to their display size.

### 2. **Optimize Image Files**
- Use WebP format when possible (smaller file size)
- Compress PNG/JPG files
- Remove unnecessary metadata

### 3. **Preload Critical Images**
```tsx
import { Image } from 'expo-image';

// In your app initialization
await Image.prefetch([
  IMAGES.schoolLogo,
  IMAGES.icon,
]);
```

### 4. **Clear Cache When Needed**
```tsx
import { Image } from 'expo-image';

// Clear all cached images
await Image.clearMemoryCache();
await Image.clearDiskCache();
```

## Monitoring Performance

### Check Cache Size
```tsx
import { Image } from 'expo-image';

const cacheSize = await Image.getCachePathAsync();
console.log('Cache location:', cacheSize);
```

## Future Improvements

### 1. **Add More Images to Constants**
Add all app images to `constants/images.ts`:
- Icons
- Illustrations
- Backgrounds
- Avatars

### 2. **Implement Progressive Loading**
Add blur hashes for better UX during loading

### 3. **Add Image Preloading**
Preload critical images on app start

### 4. **Optimize Image Assets**
- Convert to WebP format
- Compress existing images
- Create multiple resolutions (@1x, @2x, @3x)

### 5. **Add Loading States**
Show skeleton loaders while images load

## Testing

### Test Image Loading
1. Clear app cache
2. Open app with slow network
3. Verify smooth loading transitions
4. Check that images persist after app restart

### Test Cache
1. Load app with images
2. Turn off network
3. Restart app
4. Verify images still load from cache

## Resources

- [Expo Image Documentation](https://docs.expo.dev/versions/latest/sdk/image/)
- [Image Optimization Best Practices](https://docs.expo.dev/develop/user-interface/image-performance/)
- [React Native Performance](https://reactnative.dev/docs/performance)

## Summary

✅ **Installed:** `expo-image` package
✅ **Created:** Centralized image constants
✅ **Updated:** 5 screens to use optimized images
✅ **Configured:** Memory-disk caching for best performance
✅ **Added:** Smooth 300ms transitions

**Result:** Faster image loading, better caching, smoother UX, and easier maintenance!
