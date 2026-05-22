# How to Add New Images

## Quick Guide

### Step 1: Add Image to Assets
Place your image in `assets/images/` folder:
```
assets/
  images/
    your-new-image.png
```

### Step 2: Add to Image Constants
Open `constants/images.ts` and add your image:

```typescript
export const IMAGES = {
  schoolLogo: require('../assets/images/school-logo.png'),
  favicon: require('../assets/images/favicon.png'),
  icon: require('../assets/images/icon.png'),
  splashIcon: require('../assets/images/splash-icon.png'),
  
  // Add your new image here
  yourNewImage: require('../assets/images/your-new-image.png'),
} as const;
```

### Step 3: Use in Your Component

```tsx
import { Image } from 'expo-image';
import { IMAGES } from '../constants/images';

export default function YourScreen() {
  return (
    <Image 
      source={IMAGES.yourNewImage}
      style={{ width: 100, height: 100 }}
      contentFit="contain"
      transition={300}
      cachePolicy="memory-disk"
    />
  );
}
```

## Common Use Cases

### Logo / Icon (Static)
```tsx
<Image 
  source={IMAGES.schoolLogo}
  style={styles.logo}
  contentFit="contain"
  transition={300}
  cachePolicy="memory-disk"
/>
```

### Background Image
```tsx
<Image 
  source={IMAGES.background}
  style={StyleSheet.absoluteFill}
  contentFit="cover"
  cachePolicy="memory-disk"
/>
```

### Avatar / Profile Picture
```tsx
<Image 
  source={IMAGES.avatar}
  style={styles.avatar}
  contentFit="cover"
  transition={200}
  cachePolicy="memory"
/>
```

### Thumbnail in List
```tsx
<Image 
  source={IMAGES.thumbnail}
  style={styles.thumb}
  contentFit="cover"
  recyclingKey={`thumb-${item.id}`}
  cachePolicy="memory-disk"
/>
```

## Image Optimization Tips

### Before Adding Images:

1. **Resize to appropriate dimensions**
   - Don't use 4K images for small icons
   - Match image size to display size

2. **Compress images**
   - Use tools like TinyPNG, ImageOptim
   - Target: < 100KB for icons, < 500KB for photos

3. **Choose right format**
   - PNG: Logos, icons with transparency
   - JPG: Photos, complex images
   - WebP: Best compression (if supported)

4. **Provide multiple resolutions**
   ```
   icon.png      (1x - 100x100)
   icon@2x.png   (2x - 200x200)
   icon@3x.png   (3x - 300x300)
   ```

## TypeScript Support

The `IMAGES` constant is fully typed. You'll get autocomplete:

```tsx
// ✅ TypeScript will autocomplete available images
<Image source={IMAGES.} />
                      // ^ schoolLogo, favicon, icon, etc.

// ❌ TypeScript will error on invalid image
<Image source={IMAGES.nonExistent} />
                      // ^ Error: Property doesn't exist
```

## Best Practices

### ✅ DO:
- Use centralized `IMAGES` constant
- Add descriptive names
- Optimize images before adding
- Use appropriate `contentFit`
- Set `cachePolicy` based on use case

### ❌ DON'T:
- Use `require()` directly in components
- Add unoptimized large images
- Forget to add to constants file
- Use wrong image format
- Skip compression

## Example: Adding a New Feature Image

```typescript
// 1. Add to constants/images.ts
export const IMAGES = {
  // ... existing images
  welcomeBanner: require('../assets/images/welcome-banner.png'),
  successIcon: require('../assets/images/success-icon.png'),
} as const;

// 2. Use in component
import { Image } from 'expo-image';
import { IMAGES } from '../constants/images';

export default function WelcomeScreen() {
  return (
    <View>
      <Image 
        source={IMAGES.welcomeBanner}
        style={{ width: '100%', height: 200 }}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
      />
      
      <Image 
        source={IMAGES.successIcon}
        style={{ width: 50, height: 50 }}
        contentFit="contain"
        transition={200}
        cachePolicy="memory-disk"
      />
    </View>
  );
}
```

## Troubleshooting

### Image Not Showing?
1. Check file path in `constants/images.ts`
2. Verify image exists in `assets/images/`
3. Check image file extension matches
4. Restart Metro bundler: `npx expo start --clear`

### Image Blurry?
1. Provide @2x and @3x versions
2. Check image dimensions match display size
3. Use `contentFit="contain"` instead of `"fill"`

### Slow Loading?
1. Compress image file
2. Use appropriate cache policy
3. Consider preloading critical images
4. Check image file size (should be < 500KB)

## Need Help?

Check the full documentation: `docs/IMAGE_OPTIMIZATION.md`
