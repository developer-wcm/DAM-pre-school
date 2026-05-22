# Error Handling Guide

## Overview
This app implements comprehensive error handling to provide a better user experience and easier debugging.

## Error Handling Utility

### Location
`utils/errorHandler.ts`

### Features
- ✅ Typed error categories
- ✅ User-friendly error messages
- ✅ Automatic error logging
- ✅ Network connectivity checks
- ✅ Retry logic with exponential backoff
- ✅ Async operation wrappers

## Error Types

```typescript
enum ErrorType {
  NETWORK = 'NETWORK',       // Connection issues
  AUTH = 'AUTH',             // Authentication failures
  VALIDATION = 'VALIDATION', // Invalid input
  PERMISSION = 'PERMISSION', // Missing permissions
  STORAGE = 'STORAGE',       // AsyncStorage errors
  UNKNOWN = 'UNKNOWN',       // Unexpected errors
}
```

## Usage Examples

### 1. Basic Error Handling

```typescript
import { handleAsync, showErrorAlert } from '../utils/errorHandler';

async function loadData() {
  const { data, error } = await handleAsync(
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    {
      errorMessage: 'Failed to load data',
      context: 'loadData',
      showAlert: true,
    }
  );

  if (error) {
    // Handle error
    return;
  }

  // Use data
  console.log(data);
}
```

### 2. Network-Dependent Operations

```typescript
import { handleNetworkOperation } from '../utils/errorHandler';

async function syncData() {
  const { data, error } = await handleNetworkOperation(
    async () => {
      return await supabase.from('students').select('*');
    },
    {
      errorMessage: 'Failed to sync data. Please check your connection.',
      context: 'syncData',
    }
  );

  if (error) {
    // Fallback to cached data
    return getCachedData();
  }

  return data;
}
```

### 3. Retry Logic

```typescript
import { retryAsync } from '../utils/errorHandler';

async function uploadFile(file: File) {
  try {
    const result = await retryAsync(
      async () => {
        return await supabase.storage.from('documents').upload(file.name, file);
      },
      {
        maxRetries: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        onRetry: (attempt, error) => {
          console.log(`Retry attempt ${attempt}:`, error.message);
        },
      }
    );

    return result;
  } catch (error) {
    showErrorAlert(error, 'Failed to upload file after multiple attempts');
  }
}
```

### 4. Custom Error Alerts

```typescript
import { showErrorAlert, AppError, ErrorType } from '../utils/errorHandler';

function validateInput(email: string) {
  if (!email.includes('@')) {
    const error = new AppError(
      'Please enter a valid email address',
      ErrorType.VALIDATION
    );
    showErrorAlert(error);
    return false;
  }
  return true;
}
```

### 5. Try-Catch with Logging

```typescript
import { logError } from '../utils/errorHandler';

async function saveSettings(settings: Settings) {
  try {
    await AsyncStorage.setItem('settings', JSON.stringify(settings));
  } catch (error) {
    logError(error, 'saveSettings');
    Alert.alert('Error', 'Failed to save settings');
  }
}
```

## Updated Components

### ✅ Auth Context (`context/auth.tsx`)
- Added try-catch blocks to all async functions
- Proper error logging
- Graceful error handling for profile fetching
- Better session initialization error handling

### ✅ Enter Code Screen (`app/enter-code.tsx`)
- Wrapped AsyncStorage operations in try-catch
- Added fallback behavior if storage fails
- Better error messages for users

### ✅ Enter Class ID Screen (`app/enter-class-id.tsx`)
- Similar improvements to enter-code screen
- Proper error handling for class verification

## Best Practices

### 1. Always Use Try-Catch for Async Operations

**❌ Bad:**
```typescript
async function loadData() {
  const data = await fetch('/api/data');
  return data.json();
}
```

**✅ Good:**
```typescript
async function loadData() {
  try {
    const data = await fetch('/api/data');
    return data.json();
  } catch (error) {
    logError(error, 'loadData');
    showErrorAlert(error, 'Failed to load data');
    return null;
  }
}
```

### 2. Provide Context in Error Logs

```typescript
// ✅ Good - includes context
logError(error, 'fetchUserProfile - userId: 123');

// ❌ Bad - no context
logError(error);
```

### 3. Show User-Friendly Messages

```typescript
// ✅ Good - user-friendly
showErrorAlert(error, 'Unable to save your changes. Please try again.');

// ❌ Bad - technical jargon
showErrorAlert(error, 'ECONNREFUSED: Connection refused at port 5432');
```

### 4. Handle Network Errors Gracefully

```typescript
async function loadStudents() {
  const { data, error } = await handleNetworkOperation(
    async () => supabase.from('students').select('*'),
    { context: 'loadStudents' }
  );

  if (error) {
    // Fallback to cached data
    return await getCachedStudents();
  }

  // Cache fresh data
  await cacheStudents(data);
  return data;
}
```

### 5. Don't Swallow Errors Silently

**❌ Bad:**
```typescript
try {
  await saveData();
} catch (error) {
  // Silent failure - user doesn't know what happened
}
```

**✅ Good:**
```typescript
try {
  await saveData();
} catch (error) {
  logError(error, 'saveData');
  showErrorAlert(error, 'Failed to save data');
}
```

## Error Handling Checklist

### For Every Async Function:
- [ ] Wrapped in try-catch block
- [ ] Errors are logged with context
- [ ] User-friendly error messages shown
- [ ] Fallback behavior implemented (if applicable)
- [ ] Network connectivity checked (if needed)

### For API Calls:
- [ ] Check for error response
- [ ] Handle network timeouts
- [ ] Implement retry logic (if appropriate)
- [ ] Cache data for offline access
- [ ] Show loading states

### For User Input:
- [ ] Validate before submission
- [ ] Show validation errors clearly
- [ ] Disable submit button during processing
- [ ] Re-enable form after error

### For Storage Operations:
- [ ] Handle AsyncStorage failures
- [ ] Provide fallback values
- [ ] Don't block app if storage fails
- [ ] Log storage errors

## Testing Error Handling

### 1. Network Errors
```bash
# Turn off WiFi/mobile data
# Try operations that require network
# Verify user sees appropriate error messages
```

### 2. Invalid Input
```bash
# Enter invalid email, phone, etc.
# Verify validation errors show
# Verify form doesn't submit
```

### 3. Permission Errors
```bash
# Deny camera/photo permissions
# Try to upload photo
# Verify permission error shows
```

### 4. Storage Errors
```bash
# Fill device storage completely
# Try to save data
# Verify app doesn't crash
```

## Future Improvements

### 1. Error Tracking Service
Integrate Sentry or Bugsnag:

```typescript
import * as Sentry from '@sentry/react-native';

export function logError(error: Error, context?: string) {
  if (__DEV__) {
    console.error('Error:', error);
  } else {
    Sentry.captureException(error, {
      tags: { context },
    });
  }
}
```

### 2. Offline Queue
Queue failed operations for retry when online:

```typescript
class OfflineQueue {
  private queue: Operation[] = [];

  async add(operation: Operation) {
    this.queue.push(operation);
    await this.saveQueue();
  }

  async processQueue() {
    const isOnline = await checkNetworkConnection();
    if (!isOnline) return;

    for (const operation of this.queue) {
      try {
        await operation.execute();
        this.queue = this.queue.filter(op => op !== operation);
      } catch (error) {
        logError(error, 'OfflineQueue.processQueue');
      }
    }

    await this.saveQueue();
  }
}
```

### 3. Error Boundaries
Add React Error Boundaries for component errors:

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, 'ErrorBoundary');
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen />;
    }
    return this.props.children;
  }
}
```

### 4. User Feedback
Allow users to report errors:

```typescript
function ErrorScreen({ error }: { error: Error }) {
  const sendFeedback = async (message: string) => {
    await supabase.from('error_reports').insert({
      error: error.message,
      stack: error.stack,
      user_message: message,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <View>
      <Text>Something went wrong</Text>
      <TextInput placeholder="Tell us what happened" />
      <Button title="Send Feedback" onPress={sendFeedback} />
    </View>
  );
}
```

## Resources

- [React Native Error Handling](https://reactnative.dev/docs/error-handling)
- [Expo Error Handling](https://docs.expo.dev/guides/errors/)
- [Sentry for React Native](https://docs.sentry.io/platforms/react-native/)

## Summary

✅ **Created:** Error handling utility (`utils/errorHandler.ts`)
✅ **Updated:** Auth context with comprehensive error handling
✅ **Updated:** Code verification screens with better error handling
✅ **Implemented:** Network connectivity checks
✅ **Implemented:** Retry logic with exponential backoff
✅ **Implemented:** User-friendly error messages
✅ **Implemented:** Error logging for debugging

**Result:** Your app now handles errors gracefully, provides better user feedback, and is easier to debug!
