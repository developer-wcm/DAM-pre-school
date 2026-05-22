# Error Handling - Quick Reference

## Import
```typescript
import {
  handleAsync,
  handleNetworkOperation,
  retryAsync,
  showErrorAlert,
  logError,
  AppError,
  ErrorType,
} from '../utils/errorHandler';
```

## Common Patterns

### 1. Basic Async Operation
```typescript
const { data, error } = await handleAsync(
  async () => await yourAsyncFunction(),
  {
    errorMessage: 'User-friendly message',
    context: 'functionName',
    showAlert: true,
  }
);

if (error) {
  // Handle error
  return;
}

// Use data
```

### 2. Network Operation
```typescript
const { data, error } = await handleNetworkOperation(
  async () => await supabase.from('table').select('*'),
  { context: 'fetchData' }
);

if (error) {
  // Fallback to cache
  return getCachedData();
}

return data;
```

### 3. With Retry
```typescript
try {
  const result = await retryAsync(
    async () => await uploadFile(file),
    { maxRetries: 3, delayMs: 1000 }
  );
  return result;
} catch (error) {
  showErrorAlert(error, 'Upload failed');
}
```

### 4. Try-Catch
```typescript
try {
  await AsyncStorage.setItem('key', 'value');
} catch (error) {
  logError(error, 'saveData');
  showErrorAlert(error, 'Failed to save');
}
```

### 5. Custom Error
```typescript
if (!isValid) {
  const error = new AppError(
    'Invalid input',
    ErrorType.VALIDATION
  );
  showErrorAlert(error);
  return;
}
```

## Error Types

```typescript
ErrorType.NETWORK      // Connection issues
ErrorType.AUTH         // Authentication failures
ErrorType.VALIDATION   // Invalid input
ErrorType.PERMISSION   // Missing permissions
ErrorType.STORAGE      // AsyncStorage errors
ErrorType.UNKNOWN      // Unexpected errors
```

## Functions

### `handleAsync(operation, options)`
Wraps async operation with error handling.

**Options:**
- `errorMessage` - Custom error message
- `context` - Context for logging
- `showAlert` - Show alert to user (default: true)
- `onError` - Custom error handler

**Returns:** `{ data, error }`

### `handleNetworkOperation(operation, options)`
Same as `handleAsync` but checks network first.

### `retryAsync(operation, options)`
Retries operation with exponential backoff.

**Options:**
- `maxRetries` - Max attempts (default: 3)
- `delayMs` - Initial delay (default: 1000)
- `backoffMultiplier` - Delay multiplier (default: 2)
- `onRetry` - Callback on retry

**Returns:** Result or throws error

### `showErrorAlert(error, customMessage?, onDismiss?)`
Shows user-friendly error alert.

### `logError(error, context?)`
Logs error for debugging.

### `checkNetworkConnection()`
Checks if device is online.

**Returns:** `Promise<boolean>`

## Checklist

### For Every Async Function:
- [ ] Wrapped in try-catch or `handleAsync`
- [ ] Errors logged with context
- [ ] User-friendly messages
- [ ] Fallback behavior

### For API Calls:
- [ ] Use `handleNetworkOperation`
- [ ] Check for errors
- [ ] Implement retry if needed
- [ ] Cache for offline

### For User Input:
- [ ] Validate before submit
- [ ] Show validation errors
- [ ] Disable button during processing

### For Storage:
- [ ] Handle failures gracefully
- [ ] Don't block app
- [ ] Log errors

## Examples by Scenario

### Loading Data
```typescript
async function loadStudents() {
  const { data, error } = await handleNetworkOperation(
    async () => await supabase.from('students').select('*'),
    { context: 'loadStudents' }
  );

  if (error) {
    return await getCachedStudents();
  }

  await cacheStudents(data);
  return data;
}
```

### Saving Data
```typescript
async function saveProfile(profile: Profile) {
  try {
    await AsyncStorage.setItem('profile', JSON.stringify(profile));
    return true;
  } catch (error) {
    logError(error, 'saveProfile');
    showErrorAlert(error, 'Failed to save profile');
    return false;
  }
}
```

### Uploading File
```typescript
async function uploadDocument(file: File) {
  try {
    return await retryAsync(
      async () => {
        return await supabase.storage
          .from('documents')
          .upload(file.name, file);
      },
      { maxRetries: 3, delayMs: 1000 }
    );
  } catch (error) {
    showErrorAlert(error, 'Failed to upload document');
    return null;
  }
}
```

### Form Validation
```typescript
function validateForm(data: FormData) {
  if (!data.email.includes('@')) {
    showErrorAlert(
      new AppError('Invalid email', ErrorType.VALIDATION),
      'Please enter a valid email address'
    );
    return false;
  }

  if (data.password.length < 6) {
    showErrorAlert(
      new AppError('Weak password', ErrorType.VALIDATION),
      'Password must be at least 6 characters'
    );
    return false;
  }

  return true;
}
```

### Permission Request
```typescript
async function requestCameraPermission() {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      showErrorAlert(
        new AppError('Permission denied', ErrorType.PERMISSION),
        'Camera access is required to take photos'
      );
      return false;
    }

    return true;
  } catch (error) {
    logError(error, 'requestCameraPermission');
    showErrorAlert(error, 'Failed to request camera permission');
    return false;
  }
}
```

## Tips

1. **Always provide context** when logging errors
2. **Use user-friendly messages** in alerts
3. **Implement fallbacks** for critical operations
4. **Don't swallow errors** silently
5. **Test error scenarios** thoroughly

## Common Mistakes

### ❌ Don't Do This
```typescript
try {
  await saveData();
} catch (error) {
  // Silent failure
}
```

### ✅ Do This
```typescript
try {
  await saveData();
} catch (error) {
  logError(error, 'saveData');
  showErrorAlert(error, 'Failed to save');
}
```

---

### ❌ Don't Do This
```typescript
const data = await fetch('/api/data');
// No error handling
```

### ✅ Do This
```typescript
const { data, error } = await handleAsync(
  async () => await fetch('/api/data'),
  { context: 'fetchData' }
);

if (error) {
  // Handle error
}
```

---

### ❌ Don't Do This
```typescript
Alert.alert('Error', error.toString());
// Technical error message
```

### ✅ Do This
```typescript
showErrorAlert(error, 'Failed to load data. Please try again.');
// User-friendly message
```

## Need Help?

See full documentation: `docs/ERROR_HANDLING.md`
