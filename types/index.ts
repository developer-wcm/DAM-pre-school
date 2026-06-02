/**
 * Central type definitions for the David & Mary Academy app
 */

// ============================================================================
// User & Auth Types
// ============================================================================

export type UserRole = 'admin' | 'principal' | 'teacher' | 'parent' | 'accountant';

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  school_id: string | null;
  approved: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  session: any | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    role: string
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

// ============================================================================
// School & Class Types
// ============================================================================

export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export type ClassLevel = 'play-group' | 'pre-kg' | 'junior-kg' | 'senior-kg';

export interface Class {
  id: string;
  name: string;
  level: ClassLevel;
  school_id: string;
  teacher_id?: string;
  capacity?: number;
  created_at: string;
}

// ============================================================================
// Student Types
// ============================================================================

export interface Student {
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
  updated_at?: string;
}

export interface StudentDetails extends Student {
  class?: Class;
  parent?: Profile;
}

// ============================================================================
// Admission Types
// ============================================================================

export type AdmissionStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface AdmissionApplication {
  id: string;
  student_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  class_level: ClassLevel;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  address: string;
  status: AdmissionStatus;
  documents?: AdmissionDocument[];
  created_at: string;
  updated_at?: string;
}

export interface AdmissionDocument {
  id: string;
  application_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

// ============================================================================
// Attendance Types
// ============================================================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  marked_by: string;
  created_at: string;
}

export interface AttendanceRecord extends Attendance {
  student?: Student;
}

// ============================================================================
// Fee Types
// ============================================================================

export type FeeStatus = 'pending' | 'paid' | 'overdue' | 'partial';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'upi' | 'cheque';

export interface Fee {
  id: string;
  student_id: string;
  amount: number;
  due_date: string;
  status: FeeStatus;
  payment_date?: string;
  payment_method?: PaymentMethod;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface FeeRecord extends Fee {
  student?: Student;
}

// ============================================================================
// Payment Plan Types
// ============================================================================

export type PaymentCycle = 'monthly' | 'quarterly' | 'bi-monthly' | 'annual';

export interface PaymentPlan {
  id: string;
  name: string;
  total_amount: number;
  cycle: PaymentCycle;
  installments: number;
  installment_amount: number;
  created_at: string;
}

export interface PaymentInstallment {
  id: string;
  plan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: FeeStatus;
  paid_date?: string;
}

// ============================================================================
// Activity & Event Types
// ============================================================================

export type ActivityType = 'event' | 'holiday' | 'exam' | 'meeting' | 'other';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: ActivityType;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  school_id: string;
  created_by: string;
  created_at: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  action_url?: string;
  created_at: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  total_students: number;
  present_today: number;
  absent_today: number;
  pending_fees: number;
  total_revenue: number;
  upcoming_events: number;
}

export interface TeacherDashboard {
  class_info: Class;
  total_students: number;
  present_today: number;
  absent_today: number;
  recent_activities: Activity[];
}

export interface ParentDashboard {
  student: StudentDetails;
  attendance_percentage: number;
  fee_status: FeeStatus;
  upcoming_events: Activity[];
  recent_notifications: Notification[];
}

// ============================================================================
// Form Types
// ============================================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface AdmissionStep1Data {
  studentName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
}

export interface AdmissionStep2Data {
  fatherName: string;
  fatherPhone: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  motherName: string;
  motherPhone: string;
  motherEmail?: string;
  motherOccupation?: string;
}

export interface AdmissionStep3Data {
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContact: string;
  emergencyRelation: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface CardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  children?: React.ReactNode;
}

export interface EmptyStateProps {
  icon?: string;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = void> = () => Promise<T>;
export type VoidFunction = () => void;

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
}

// ============================================================================
// Route Types
// ============================================================================

export type RootStackParamList = {
  index: undefined;
  login: undefined;
  'sign-up': { role?: UserRole };
  'role-selection': undefined;
  'find-school': { role?: UserRole };
  'enter-code': undefined;
  'enter-class-id': { selectedClass?: string; className?: string };
  'select-class': undefined;
  'privacy-notice': undefined;
  'parental-consent': undefined;
  'admission-choice': undefined;
  'admission/step-1': undefined;
  'admission/step-2': undefined;
  'admission/step-3': undefined;
  'admission/step-4': undefined;
  'admission/step-5': undefined;
  '(dashboard)': undefined;
  '(teacher)': undefined;
  '(parent)': undefined;
  '(accountant)': undefined;
};
