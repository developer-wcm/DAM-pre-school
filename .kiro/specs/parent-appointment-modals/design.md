# Design Document

## Introduction

This document provides the technical design for enhancing the parent appointments screen with custom modals. The design focuses on replacing the basic Alert.alert() confirmation with a professional custom modal and adding a reschedule modal with proper date/time picker components. The implementation will use React Native's Animated API for smooth transitions and maintain separation of concerns through reusable modal components.

## High-Level Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  ParentAppointmentsScreen                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Main Screen Component                     │  │
│  │  - Appointment List                                    │  │
│  │  - Tab Navigation (Upcoming/Past)                      │  │
│  │  - Action Buttons                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           │ manages state                    │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Modal State Management                    │  │
│  │  - showBookingModal                                    │  │
│  │  - showConfirmationModal                               │  │
│  │  - showRescheduleModal                                 │  │
│  │  - selectedAppointment                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│           ┌───────────────┼───────────────┐                 │
│           ▼               ▼               ▼                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Booking    │ │Confirmation  │ │ Reschedule   │        │
│  │    Modal     │ │    Modal     │ │    Modal     │        │
│  │  (existing)  │ │    (new)     │ │    (new)     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                  │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Shared Modal Components                      │  │
│  │  - AnimatedModal (wrapper)                             │  │
│  │  - GradientButton                                      │  │
│  │  - DateTimePicker                                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
ParentAppointmentsScreen
├── Header
├── TabToggle
├── AppointmentsList
│   └── AppointmentCard[]
│       └── ActionButtons (Reschedule/Cancel/View)
├── BookingModal (existing)
├── ConfirmationModal (new)
│   ├── AnimatedModal
│   ├── CalendarIcon
│   ├── ConfirmationMessage
│   └── GradientButton
└── RescheduleModal (new)
    ├── AnimatedModal
    ├── CurrentAppointmentInfo
    ├── DatePicker
    ├── TimePicker
    ├── ReasonInput
    └── GradientButton
```

### Data Flow

```
User Action → State Update → Modal Display → Animation → User Interaction → Validation → State Update → Modal Dismiss
```

**Example Flow - Booking Appointment:**
1. User fills booking form → taps "Request Appointment"
2. `handleBookAppointment()` validates inputs
3. If valid: Set `showConfirmationModal = true`, store appointment data
4. ConfirmationModal animates in (fade + scale)
5. User taps "Done" button
6. Clear form fields, set `showConfirmationModal = false`
7. Modal animates out

**Example Flow - Rescheduling:**
1. User taps "Reschedule" on pending appointment
2. Set `selectedAppointment`, `showRescheduleModal = true`
3. RescheduleModal animates in (slide-up)
4. User selects new date/time, optionally adds reason
5. User taps "Send Reschedule Request"
6. Validate inputs, show ConfirmationModal
7. Update appointment status, dismiss modals

## Low-Level Design

### Component Specifications

#### 1. ConfirmationModal Component

**Purpose:** Display a professional confirmation message after successful appointment booking or rescheduling.

**Props Interface:**
```typescript
interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  appointmentData: {
    teacherName: string;
    date: string;
    time: string;
    topic: string;
  };
  type: 'booking' | 'reschedule';
}
```

**State:**
```typescript
const [fadeAnim] = useState(new Animated.Value(0));
const [scaleAnim] = useState(new Animated.Value(0.8));
```

**Key Methods:**
```typescript
// Animate modal entrance
const animateIn = () => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }),
  ]).start();
};

// Animate modal exit
const animateOut = (callback: () => void) => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 0.8,
      duration: 200,
      useNativeDriver: true,
    }),
  ]).start(callback);
};

// Handle done button press with haptic feedback
const handleDone = () => {
  triggerHaptic('light');
  animateOut(() => {
    onClose();
  });
};
```

**Layout Structure:**
```
Modal (React Native Modal)
└── Animated.View (overlay with fadeAnim)
    └── TouchableOpacity (dismiss on tap outside)
        └── Animated.View (content with scaleAnim)
            ├── Ionicons (calendar-outline, size 64, color #7B6FE8)
            ├── Text (Confirmation title)
            ├── View (appointment details box)
            │   ├── Text (Teacher: {teacherName})
            │   ├── Text (Date: {date})
            │   ├── Text (Time: {time})
            │   └── Text (Topic: {topic})
            ├── Text (Success message)
            └── GradientButton ("Done")
```

**Styling:**
```typescript
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  detailsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
```

#### 2. RescheduleModal Component

**Purpose:** Allow parents to request rescheduling of pending appointments with date/time pickers.

**Props Interface:**
```typescript
interface RescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSubmit: (newDate: string, newTime: string, reason?: string) => void;
}
```

**State:**
```typescript
const [slideAnim] = useState(new Animated.Value(600));
const [fadeAnim] = useState(new Animated.Value(0));
const [selectedDate, setSelectedDate] = useState('');
const [selectedTime, setSelectedTime] = useState('');
const [reason, setReason] = useState('');
const [showDatePicker, setShowDatePicker] = useState(false);
const [showTimePicker, setShowTimePicker] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
```

**Key Methods:**
```typescript
// Animate modal entrance (slide up from bottom)
const animateIn = () => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 9,
      tension: 50,
      useNativeDriver: true,
    }),
  ]).start();
};

// Animate modal exit
const animateOut = (callback: () => void) => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.timing(slideAnim, {
      toValue: 600,
      duration: 200,
      useNativeDriver: true,
    }),
  ]).start(callback);
};

// Generate date options (next 30 days, excluding past dates)
const generateDateOptions = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const formatted = formatDate(date); // e.g., "Feb 25, 2026"
    dates.push(formatted);
  }
  
  return dates;
};

// Generate time options (9 AM - 5 PM, 30-min intervals)
const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  const startHour = 9;
  const endHour = 17;
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute of [0, 30]) {
      if (hour === endHour && minute > 0) break;
      const time = formatTime(hour, minute); // e.g., "10:00 AM"
      times.push(time);
    }
  }
  
  return times;
};

// Validate and submit reschedule request
const handleSubmit = () => {
  setErrorMessage('');
  
  if (!selectedDate) {
    setErrorMessage('Please select a date');
    return;
  }
  
  if (!selectedTime) {
    setErrorMessage('Please select a time');
    return;
  }
  
  triggerHaptic('medium');
  animateOut(() => {
    onSubmit(selectedDate, selectedTime, reason);
  });
};

// Handle date picker selection
const handleDateSelect = (date: string) => {
  setSelectedDate(date);
  setShowDatePicker(false);
  setErrorMessage('');
};

// Handle time picker selection
const handleTimeSelect = (time: string) => {
  setSelectedTime(time);
  setShowTimePicker(false);
  setErrorMessage('');
};
```

**Layout Structure:**
```
Modal (React Native Modal)
└── Animated.View (overlay with fadeAnim)
    └── TouchableOpacity (dismiss on tap outside)
        └── Animated.View (content with slideAnim, translateY)
            ├── View (modal header)
            │   ├── Text ("Reschedule Appointment")
            │   └── TouchableOpacity (close button)
            ├── ScrollView
            │   ├── View (current appointment info)
            │   │   ├── Text ("Current Appointment")
            │   │   ├── Text (Teacher: {appointment.teacherName})
            │   │   ├── Text (Date: {appointment.date})
            │   │   ├── Text (Time: {appointment.time})
            │   │   └── Text (Topic: {appointment.topic})
            │   ├── View (divider)
            │   ├── Text ("Select New Date & Time")
            │   ├── TouchableOpacity (date picker trigger)
            │   │   ├── Ionicons (calendar-outline)
            │   │   └── Text (selectedDate || "Select Date")
            │   ├── TouchableOpacity (time picker trigger)
            │   │   ├── Ionicons (time-outline)
            │   │   └── Text (selectedTime || "Select Time")
            │   ├── TextInput (reason - optional)
            │   └── Text (error message - if any)
            └── GradientButton ("Send Reschedule Request")
```

**Picker Implementation:**
```typescript
// Use React Native Picker for dropdowns
import { Picker } from '@react-native-picker/picker';

// Date Picker Modal
{showDatePicker && (
  <View style={styles.pickerContainer}>
    <View style={styles.pickerHeader}>
      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
        <Text style={styles.pickerCancel}>Cancel</Text>
      </TouchableOpacity>
      <Text style={styles.pickerTitle}>Select Date</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
        <Text style={styles.pickerDone}>Done</Text>
      </TouchableOpacity>
    </View>
    <Picker
      selectedValue={selectedDate}
      onValueChange={handleDateSelect}
    >
      {generateDateOptions().map((date) => (
        <Picker.Item key={date} label={date} value={date} />
      ))}
    </Picker>
  </View>
)}

// Time Picker Modal (similar structure)
```

**Styling:**
```typescript
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentInfoBox: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  currentInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  currentInfoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currentInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 60,
  },
  currentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  pickerTriggerText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  pickerTriggerPlaceholder: {
    color: COLORS.gray,
  },
  reasonInput: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  pickerCancel: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pickerDone: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
```

#### 3. GradientButton Component

**Purpose:** Reusable button component with purple-to-green gradient for modal actions.

**Props Interface:**
```typescript
interface GradientButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}
```

**Implementation:**
```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../../utils/haptics';

const GradientButton: React.FC<GradientButtonProps> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
}) => {
  const handlePress = () => {
    if (!disabled && !loading) {
      triggerHaptic('medium');
      onPress();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={disabled ? ['#CBD5E0', '#A0AEC0'] : ['#7B6FE8', '#3AAF72']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#7B6FE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
```

### State Management Updates

**New State Variables in ParentAppointmentsScreen:**
```typescript
// Add to existing state
const [showConfirmationModal, setShowConfirmationModal] = useState(false);
const [showRescheduleModal, setShowRescheduleModal] = useState(false);
const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
const [confirmationData, setConfirmationData] = useState<{
  teacherName: string;
  date: string;
  time: string;
  topic: string;
  type: 'booking' | 'reschedule';
} | null>(null);
```

**Updated Handler Functions:**
```typescript
// Replace existing handleBookAppointment
const handleBookAppointment = () => {
  if (!selectedDate || !selectedTime || !topic.trim()) {
    // Show error in booking modal (not Alert.alert)
    setErrorMessage('Please fill in all fields');
    return;
  }

  // Close booking modal
  setShowBookingModal(false);
  
  // Prepare confirmation data
  setConfirmationData({
    teacherName: selectedTeacher.name,
    date: selectedDate,
    time: selectedTime,
    topic: topic,
    type: 'booking',
  });
  
  // Show confirmation modal
  setShowConfirmationModal(true);
};

// New handler for reschedule button
const handleReschedulePress = (appointment: Appointment) => {
  setSelectedAppointment(appointment);
  setShowRescheduleModal(true);
};

// New handler for reschedule submission
const handleRescheduleSubmit = (newDate: string, newTime: string, reason?: string) => {
  if (!selectedAppointment) return;
  
  // Close reschedule modal
  setShowRescheduleModal(false);
  
  // Prepare confirmation data
  setConfirmationData({
    teacherName: selectedAppointment.teacherName,
    date: newDate,
    time: newTime,
    topic: selectedAppointment.topic,
    type: 'reschedule',
  });
  
  // Show confirmation modal
  setShowConfirmationModal(true);
  
  // TODO: Update appointment in backend/state
  // For now, just log the reschedule request
  console.log('Reschedule request:', {
    appointmentId: selectedAppointment.id,
    newDate,
    newTime,
    reason,
  });
};

// New handler for confirmation modal close
const handleConfirmationClose = () => {
  setShowConfirmationModal(false);
  setConfirmationData(null);
  
  // Clear booking form if it was a booking confirmation
  if (confirmationData?.type === 'booking') {
    setSelectedDate('');
    setSelectedTime('');
    setTopic('');
  }
  
  // Clear selected appointment if it was a reschedule
  if (confirmationData?.type === 'reschedule') {
    setSelectedAppointment(null);
  }
};
```

### Integration Points

**1. Update Reschedule Button in Appointment Card:**
```typescript
// In the appointment card rendering
<TouchableOpacity 
  style={styles.rescheduleButton} 
  activeOpacity={0.8}
  onPress={() => handleReschedulePress(appointment)}
>
  <Text style={styles.rescheduleButtonText}>Reschedule</Text>
</TouchableOpacity>
```

**2. Add Modal Components to JSX:**
```typescript
return (
  <View style={styles.container}>
    {/* Existing content */}
    
    {/* Existing Booking Modal */}
    {showBookingModal && (
      <View style={styles.modalOverlay}>
        {/* ... existing booking modal code ... */}
      </View>
    )}
    
    {/* New Confirmation Modal */}
    {showConfirmationModal && confirmationData && (
      <ConfirmationModal
        visible={showConfirmationModal}
        onClose={handleConfirmationClose}
        appointmentData={confirmationData}
        type={confirmationData.type}
      />
    )}
    
    {/* New Reschedule Modal */}
    {showRescheduleModal && selectedAppointment && (
      <RescheduleModal
        visible={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        appointment={selectedAppointment}
        onSubmit={handleRescheduleSubmit}
      />
    )}
  </View>
);
```

### Utility Functions

**Date Formatting:**
```typescript
// Add to utils or inline
const formatDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const formatTime = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
};
```

**Haptic Feedback:**
```typescript
// Use existing utils/haptics.ts
import { triggerHaptic } from '../../utils/haptics';

// Call on button presses
triggerHaptic('light');  // For Done button
triggerHaptic('medium'); // For Submit button
```

### Animation Specifications

**Confirmation Modal Animation:**
- **Entrance:** Fade in overlay (0 → 1) + Scale content (0.8 → 1)
- **Duration:** 300ms
- **Easing:** Spring animation for content (friction: 8, tension: 40)
- **Exit:** Fade out overlay + Scale down content (1 → 0.8)
- **Duration:** 200ms

**Reschedule Modal Animation:**
- **Entrance:** Fade in overlay (0 → 1) + Slide up content (600 → 0)
- **Duration:** 300ms
- **Easing:** Spring animation (friction: 9, tension: 50)
- **Exit:** Fade out overlay + Slide down content (0 → 600)
- **Duration:** 200ms

### Color Specifications

**Gradient Colors:**
- Purple: `#7B6FE8`
- Green: `#3AAF72`
- Gradient direction: Left to right (horizontal)

**School Theme Colors (unchanged):**
- Navy Blue: `#1B3A6B` (COLORS.primary)
- Goldenrod: `#DAA520` (COLORS.secondary)

### Dependencies

**Required Packages:**
- `expo-linear-gradient` - Already installed (used in existing code)
- `@react-native-picker/picker` - May need to install for dropdown pickers
- `react-native` Animated API - Built-in, no installation needed

**Installation Command (if needed):**
```bash
npm install @react-native-picker/picker
```

### Error Handling

**Validation Errors:**
- Display inline error messages in red text below form fields
- Clear error messages when user corrects the input
- Prevent submission when validation fails

**Edge Cases:**
- Empty date/time selection → Show error message
- Tap outside modal → Dismiss modal (preserve form data)
- Rapid button presses → Disable button during animation
- Modal already open → Prevent opening another modal

### Testing Considerations

**Manual Testing Checklist:**
1. Book appointment → Verify confirmation modal appears with correct data
2. Tap "Done" → Verify modal dismisses and form clears
3. Tap "Reschedule" → Verify reschedule modal appears with current appointment info
4. Select date/time → Verify pickers work and update displayed values
5. Submit reschedule → Verify confirmation modal appears
6. Tap outside modal → Verify modal dismisses
7. Test animations → Verify smooth transitions
8. Test haptic feedback → Verify vibrations on button presses
9. Test validation → Verify error messages for empty fields
10. Test on iOS and Android → Verify consistent behavior

### Performance Considerations

- Use `useNativeDriver: true` for all animations (better performance)
- Memoize date/time options generation to avoid recalculation
- Use `React.memo` for modal components if re-renders are frequent
- Lazy load picker options only when modal is opened
- Clean up animation listeners on component unmount

### Accessibility

- Add `accessibilityLabel` to all interactive elements
- Ensure sufficient color contrast (WCAG AA compliant)
- Support screen readers for modal content
- Provide clear focus indicators for keyboard navigation
- Announce modal state changes to assistive technologies
