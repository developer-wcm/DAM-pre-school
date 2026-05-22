# TypeScript Improvements Documentation

## Overview
This document covers all TypeScript improvements implemented in the David & Mary Academy preschool app, including type definitions, type guards, and best practices.

## What Was Improved

### 1. ✅ Central Type Definitions
**File:** `types/index.ts`

All types are now centralized in one location for:
- Better maintainability
- Consistent typing across the app
- Easy imports
- Type reusability

### 2. ✅ Enhanced TypeScript Configuration
**File:** `tsconfig.json`

Enabled strict type checking:
- `strictNullChecks` - Catch null/undefined errors
- `noImplicitAny` - No implicit any types
- `noUnusedLocals` - Catch unused variables
- `noUnusedParameters` - Catch unused parameters
- `noImplicitReturns` - Ensure all code paths return
- Path aliases for cleaner imports

### 3. ✅ Type Guards & Validators
**File:** `utils/typeGuards.ts`

Runtime type checking utilities:
- Basic type guards (isString, isNumber, etc.)
- Domain-specific guards (isUserRole, isClassLevel, etc.)
- Validation functions (isValidEmail, isValidPhone, etc.)
- Assertion functions for type narrowing

---

## Type Definitions

### User & Auth Types

```typescript
import type { UserRole, Profile, AuthContextType } from '../types';

// User role
type UserRole = 'admin' | 'teacher' | 'parent' | 'accountant';

// Profile
interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  school_id: string | null;
  approved: boolean;
}

// Auth context
interface AuthContextType {
  session: any | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (...) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}
```

### School & Class Types

```typescript
import type { School, Class, ClassLevel } from '../types';

type ClassLevel = 'play-group' | 'pre-kg' | 'junior-kg' | 'senior-kg';

interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

interface Class {
  id: string;
  name: string;
  level: ClassLevel;
  school_id: string;
  teacher_id?: string;
  capacity?: number;
  created_at: string;
}
```

### Student Types

```typescript
import type { Student, StudentDetails } from '../types';

interface Student {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  class_id: string;
  school_id: string;
  parent_id: string;
  admission_date: string;
  status: 'active' | 'inactive' | 'graduated';
  photo_url?: string;
  created_at: string;
}

interface StudentDetails extends Student {
  class?: Class;
  parent?: Profile;
}
```

### Attendance Types

```typescript
import type { Attendance, AttendanceStatus, AttendanceRecord } from '../types';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  marked_by: string;
  created_at: string;
}
```

### Fee Types

```typescript
import type { Fee, FeeStatus, PaymentMethod } from '../types';

type FeeStatus = 'pending' | 'paid' | 'overdue' | 'partial';
type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'upi' | 'cheque';

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  due_date: string;
  status: FeeStatus;
  payment_date?: string;
  payment_method?: PaymentMethod;
  transaction_id?: string;
  notes?: string;
}
```

---

## Type Guards

### Basic Type Guards

```typescript
import { isString, isNumber, isBoolean, isArray } from '../utils/typeGuards';

// Check if value is string
if (isString(value)) {
  // TypeScript knows value is string here
  console.log(value.toUpperCase());
}

// Check if value is number
if (isNumber(value)) {
  console.log(value.toFixed(2));
}

// Check if value is array
if (isArray<Student>(students)) {
  students.forEach(student => console.log(student.full_name));
}
```

### Domain-Specific Type Guards

```typescript
import {
  isUserRole,
  isClassLevel,
  isAttendanceStatus,
  isFeeStatus,
} from '../utils/typeGuards';

// Validate user role
function setUserRole(role: unknown) {
  if (isUserRole(role)) {
    // TypeScript knows role is UserRole here
    user.role = role;
  } else {
    throw new Error('Invalid role');
  }
}

// Validate class level
function enrollStudent(level: unknown) {
  if (isClassLevel(level)) {
    // TypeScript knows level is ClassLevel here
    student.class_level = level;
  }
}
```

### Validation Functions

```typescript
import { isValidEmail, isValidPhone, isValidDateOfBirth } from '../utils/typeGuards';

// Email validation
function validateEmail(email: string) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  return email;
}

// Phone validation
function validatePhone(phone: string) {
  if (!isValidPhone(phone)) {
    throw new Error('Invalid phone number');
  }
  return phone;
}

// Date of birth validation
function validateDOB(dob: string) {
  if (!isValidDateOfBirth(dob)) {
    throw new Error('Invalid date of birth (must be 2-6 years old)');
  }
  return dob;
}
```

### Assertion Functions

```typescript
import { assertString, assertUserRole, assertValidEmail } from '../utils/typeGuards';

// Assert string type
function processName(name: unknown) {
  assertString(name, 'Name must be a string');
  // TypeScript knows name is string after assertion
  return name.trim();
}

// Assert user role
function assignRole(role: unknown) {
  assertUserRole(role, 'Invalid user role');
  // TypeScript knows role is UserRole after assertion
  user.role = role;
}

// Assert valid email
function sendEmail(email: unknown) {
  assertValidEmail(email, 'Invalid email address');
  // TypeScript knows email is valid string after assertion
  await emailService.send(email);
}
```

---

## Usage Examples

### 1. Component Props with Types

```typescript
import type { Student, Class } from '../types';

interface StudentCardProps {
  student: Student;
  onPress?: (student: Student) => void;
  showClass?: boolean;
}

function StudentCard({ student, onPress, showClass = true }: StudentCardProps) {
  return (
    <TouchableOpacity onPress={() => onPress?.(student)}>
      <Text>{student.full_name}</Text>
      {showClass && <Text>{student.class_id}</Text>}
    </TouchableOpacity>
  );
}
```

### 2. API Functions with Types

```typescript
import type { Student, ApiResponse } from '../types';

async function fetchStudents(classId: string): Promise<ApiResponse<Student[]>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId);

    if (error) {
      return { data: null, error: error.message, status: 500 };
    }

    return { data: data as Student[], error: null, status: 200 };
  } catch (error) {
    return { data: null, error: 'Failed to fetch students', status: 500 };
  }
}
```

### 3. Form Handling with Types

```typescript
import type { LoginFormData } from '../types';
import { isValidEmail } from '../utils/typeGuards';

function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof LoginFormData, string>> = {};

    if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    // TypeScript knows formData is valid here
    await signIn(formData.email, formData.password);
  }

  return (
    <View>
      <TextInput
        value={formData.email}
        onChangeText={(email) => setFormData({ ...formData, email })}
      />
      {errors.email && <Text>{errors.email}</Text>}

      <TextInput
        value={formData.password}
        onChangeText={(password) => setFormData({ ...formData, password })}
        secureTextEntry
      />
      {errors.password && <Text>{errors.password}</Text>}

      <Button title="Login" onPress={handleSubmit} />
    </View>
  );
}
```

### 4. State Management with Types

```typescript
import type { Student, AttendanceStatus } from '../types';
import { isAttendanceStatus } from '../utils/typeGuards';

interface AttendanceState {
  students: Student[];
  attendance: Record<string, AttendanceStatus>;
  loading: boolean;
  error: string | null;
}

function AttendanceScreen() {
  const [state, setState] = useState<AttendanceState>({
    students: [],
    attendance: {},
    loading: true,
    error: null,
  });

  function markAttendance(studentId: string, status: unknown) {
    if (!isAttendanceStatus(status)) {
      console.error('Invalid attendance status');
      return;
    }

    setState((prev) => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [studentId]: status,
      },
    }));
  }

  return (
    <View>
      {state.students.map((student) => (
        <StudentAttendanceRow
          key={student.id}
          student={student}
          status={state.attendance[student.id]}
          onStatusChange={(status) => markAttendance(student.id, status)}
        />
      ))}
    </View>
  );
}
```

### 5. Utility Functions with Types

```typescript
import type { Student, Class } from '../types';
import { compact, filterByType } from '../utils/typeGuards';

// Remove null/undefined from array
function getActiveStudents(students: (Student | null | undefined)[]): Student[] {
  return compact(students);
}

// Type-safe filtering
function getStudentsByClass(students: Student[], classId: string): Student[] {
  return students.filter((student) => student.class_id === classId);
}

// Type-safe mapping
function getStudentNames(students: Student[]): string[] {
  return students.map((student) => student.full_name);
}

// Type-safe reduce
function countStudentsByStatus(students: Student[]): Record<string, number> {
  return students.reduce((acc, student) => {
    acc[student.status] = (acc[student.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
```

---

## Path Aliases

Use path aliases for cleaner imports:

```typescript
// Before
import { COLORS } from '../../../constants/admissionTheme';
import { hapticFeedback } from '../../../utils/haptics';
import { Student } from '../../../types';

// After (with path aliases)
import { COLORS } from '@constants/admissionTheme';
import { hapticFeedback } from '@utils/haptics';
import type { Student } from '@types';
```

---

## Best Practices

### 1. Always Use Type Imports

```typescript
// ✅ Good - type-only import
import type { Student, Class } from '../types';

// ❌ Bad - regular import for types
import { Student, Class } from '../types';
```

### 2. Avoid `any` Type

```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good
function processData(data: unknown) {
  if (isObject(data) && 'value' in data) {
    return data.value;
  }
  throw new Error('Invalid data');
}
```

### 3. Use Type Guards for Runtime Checks

```typescript
// ❌ Bad - no runtime check
function setRole(role: string) {
  user.role = role as UserRole; // Unsafe cast
}

// ✅ Good - with type guard
function setRole(role: string) {
  if (isUserRole(role)) {
    user.role = role; // Type-safe
  } else {
    throw new Error('Invalid role');
  }
}
```

### 4. Use Strict Null Checks

```typescript
// ❌ Bad - might be null
function getName(user: User) {
  return user.full_name.toUpperCase(); // Error if null
}

// ✅ Good - handle null
function getName(user: User) {
  return user.full_name?.toUpperCase() ?? 'Unknown';
}
```

### 5. Define Return Types

```typescript
// ❌ Bad - inferred return type
async function fetchStudents(classId: string) {
  const { data } = await supabase.from('students').select('*');
  return data;
}

// ✅ Good - explicit return type
async function fetchStudents(classId: string): Promise<Student[]> {
  const { data } = await supabase.from('students').select('*');
  return (data as Student[]) || [];
}
```

---

## Common Patterns

### Optional Chaining

```typescript
// Safe property access
const studentName = student?.full_name;
const className = student?.class?.name;

// Safe method calls
const result = api?.fetchData?.();

// Safe array access
const firstStudent = students?.[0];
```

### Nullish Coalescing

```typescript
// Default values
const name = user.full_name ?? 'Unknown';
const count = students.length ?? 0;

// Different from ||
const value = 0 ?? 10; // 0 (not 10)
const value2 = 0 || 10; // 10
```

### Type Narrowing

```typescript
function processValue(value: string | number) {
  if (typeof value === 'string') {
    // TypeScript knows value is string here
    return value.toUpperCase();
  } else {
    // TypeScript knows value is number here
    return value.toFixed(2);
  }
}
```

### Discriminated Unions

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult<T>(result: Result<T>) {
  if (result.success) {
    // TypeScript knows result.data exists
    console.log(result.data);
  } else {
    // TypeScript knows result.error exists
    console.error(result.error);
  }
}
```

---

## Summary

✅ **Created:** Central type definitions (`types/index.ts`)
✅ **Created:** Type guards & validators (`utils/typeGuards.ts`)
✅ **Updated:** TypeScript configuration with strict mode
✅ **Updated:** Auth context to use centralized types
✅ **Fixed:** Router type errors
✅ **Fixed:** Skeleton loader type errors
✅ **Implemented:** Path aliases for cleaner imports
✅ **Created:** Complete documentation

**Result:** Your app now has professional-grade TypeScript with type safety, better IDE support, and fewer runtime errors! 🎉
