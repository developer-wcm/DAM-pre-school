# Task List

## Overview
This task list breaks down the implementation of the parent appointment modals feature into actionable tasks. The feature adds a custom confirmation modal and reschedule modal with date/time pickers to replace the basic Alert.alert() confirmation.

---

## Task 1: Install Required Dependencies
Install the React Native Picker package for date/time selection dropdowns.

### Sub-tasks:
- [x] 1.1 Install @react-native-picker/picker package
- [x] 1.2 Verify package installation in package.json
- [x] 1.3 Test that the app builds successfully after installation

---

## Task 2: Create GradientButton Component
Create a reusable gradient button component with purple-to-green gradient for modal actions.

### Sub-tasks:
- [x] 2.1 Create components/GradientButton.tsx file
- [x] 2.2 Implement GradientButtonProps interface with label, onPress, disabled, loading, and style props
- [x] 2.3 Implement gradient styling using LinearGradient from expo-linear-gradient
- [x] 2.4 Add purple (#7B6FE8) to green (#3AAF72) gradient colors
- [x] 2.5 Implement haptic feedback on button press using triggerHaptic utility
- [x] 2.6 Add loading state with ActivityIndicator
- [x] 2.7 Add disabled state with gray gradient colors
- [x] 2.8 Style button with border radius 50, shadow effects, and proper padding
- [x] 2.9 Export GradientButton component

---

## Task 3: Create Date/Time Utility Functions
Create utility functions for formatting dates and times in user-friendly formats.

### Sub-tasks:
- [x] 3.1 Create utils/dateTimeHelpers.ts file (or add to existing utils)
- [x] 3.2 Implement formatDate function to convert Date to "Feb 25, 2026" format
- [x] 3.3 Implement formatTime function to convert hour/minute to "10:00 AM" format
- [x] 3.4 Implement generateDateOptions function to create array of next 30 days
- [x] 3.5 Implement generateTimeOptions function to create array of time slots (9 AM - 5 PM, 30-min intervals)
- [x] 3.6 Add TypeScript types for all utility functions
- [x] 3.7 Export all utility functions

---

## Task 4: Create ConfirmationModal Component
Create the appointment confirmation modal with animations and gradient button.

### Sub-tasks:
- [x] 4.1 Create components/ConfirmationModal.tsx file
- [x] 4.2 Define ConfirmationModalProps interface (visible, onClose, appointmentData, type)
- [x] 4.3 Set up Animated.Value state for fadeAnim and scaleAnim
- [x] 4.4 Implement animateIn function with parallel fade and spring scale animations (300ms)
- [x] 4.5 Implement animateOut function with parallel fade and scale animations (200ms)
- [x] 4.6 Implement useEffect to trigger animateIn when visible becomes true
- [x] 4.7 Create modal overlay with semi-transparent dark background (rgba(0, 0, 0, 0.6))
- [x] 4.8 Add TouchableOpacity to dismiss modal when tapping outside
- [x] 4.9 Create modal content container with white background, rounded corners (24), and shadow
- [x] 4.10 Add calendar icon (Ionicons calendar-outline, size 64, color #7B6FE8)
- [x] 4.11 Add confirmation title text based on type (booking vs reschedule)
- [x] 4.12 Create appointment details box showing teacher, date, time, and topic
- [x] 4.13 Add success message text
- [x] 4.14 Add GradientButton with "Done" label
- [x] 4.15 Implement handleDone function with haptic feedback and animateOut
- [x] 4.16 Style all components according to design specifications
- [x] 4.17 Export ConfirmationModal component

---

## Task 5: Create RescheduleModal Component
Create the reschedule modal with date/time pickers, current appointment info, and validation.

### Sub-tasks:
- [x] 5.1 Create components/RescheduleModal.tsx file
- [x] 5.2 Define RescheduleModalProps interface (visible, onClose, appointment, onSubmit)
- [x] 5.3 Set up Animated.Value state for slideAnim and fadeAnim
- [x] 5.4 Set up state for selectedDate, selectedTime, reason, showDatePicker, showTimePicker, errorMessage
- [x] 5.5 Implement animateIn function with slide-up animation (300ms)
- [x] 5.6 Implement animateOut function with slide-down animation (200ms)
- [x] 5.7 Implement useEffect to trigger animateIn when visible becomes true
- [x] 5.8 Create modal overlay with semi-transparent dark background
- [x] 5.9 Add TouchableOpacity to dismiss modal when tapping outside
- [x] 5.10 Create modal content container with slide-up animation
- [x] 5.11 Add modal header with title and close button
- [x] 5.12 Create current appointment info section showing teacher, date, time, and topic
- [x] 5.13 Add divider between current info and new selection
- [x] 5.14 Create date picker trigger button with calendar icon
- [x] 5.15 Create time picker trigger button with time icon
- [x] 5.16 Implement date picker modal using Picker component
- [x] 5.17 Implement time picker modal using Picker component
- [x] 5.18 Add optional reason TextInput field
- [x] 5.19 Add error message text display (conditional rendering)
- [x] 5.20 Implement handleDateSelect function to update selectedDate and close picker
- [x] 5.21 Implement handleTimeSelect function to update selectedTime and close picker
- [x] 5.22 Implement handleSubmit function with validation
- [x] 5.23 Add validation for empty date (show "Please select a date")
- [x] 5.24 Add validation for empty time (show "Please select a time")
- [x] 5.25 Clear error message when user selects date or time
- [x] 5.26 Add GradientButton with "Send Reschedule Request" label
- [x] 5.27 Style all components according to design specifications
- [x] 5.28 Export RescheduleModal component

---

## Task 6: Update ParentAppointmentsScreen State Management
Add new state variables and update existing state management in the appointments screen.

### Sub-tasks:
- [x] 6.1 Add showConfirmationModal state (boolean, default false)
- [x] 6.2 Add showRescheduleModal state (boolean, default false)
- [x] 6.3 Add selectedAppointment state (Appointment | null, default null)
- [x] 6.4 Add confirmationData state with teacherName, date, time, topic, and type fields
- [x] 6.5 Add errorMessage state for booking modal validation

---

## Task 7: Update handleBookAppointment Function
Replace Alert.alert with custom confirmation modal in the booking flow.

### Sub-tasks:
- [x] 7.1 Remove Alert.alert import from parent-appointments.tsx
- [x] 7.2 Update handleBookAppointment to show inline error instead of Alert.alert for validation
- [x] 7.3 Close booking modal after successful validation
- [x] 7.4 Prepare confirmationData object with booking details and type 'booking'
- [x] 7.5 Set showConfirmationModal to true to display confirmation modal
- [x] 7.6 Remove Alert.alert success message

---

## Task 8: Create Reschedule Handler Functions
Implement handlers for reschedule button press and reschedule submission.

### Sub-tasks:
- [x] 8.1 Create handleReschedulePress function that accepts appointment parameter
- [x] 8.2 Set selectedAppointment state in handleReschedulePress
- [x] 8.3 Set showRescheduleModal to true in handleReschedulePress
- [x] 8.4 Create handleRescheduleSubmit function that accepts newDate, newTime, and optional reason
- [x] 8.5 Close reschedule modal in handleRescheduleSubmit
- [x] 8.6 Prepare confirmationData object with reschedule details and type 'reschedule'
- [x] 8.7 Set showConfirmationModal to true in handleRescheduleSubmit
- [x] 8.8 Log reschedule request details (TODO: replace with backend call later)

---

## Task 9: Create Confirmation Modal Close Handler
Implement handler for closing confirmation modal and cleaning up state.

### Sub-tasks:
- [x] 9.1 Create handleConfirmationClose function
- [x] 9.2 Set showConfirmationModal to false
- [x] 9.3 Set confirmationData to null
- [x] 9.4 Clear booking form fields if type was 'booking' (selectedDate, selectedTime, topic)
- [x] 9.5 Clear selectedAppointment if type was 'reschedule'

---

## Task 10: Update Reschedule Button in Appointment Card
Connect the reschedule button to the new reschedule modal.

### Sub-tasks:
- [x] 10.1 Locate reschedule button in appointment card rendering
- [x] 10.2 Update onPress handler to call handleReschedulePress with appointment parameter
- [x] 10.3 Verify button only appears for pending appointments

---

## Task 11: Integrate Modal Components into JSX
Add the new modal components to the ParentAppointmentsScreen render method.

### Sub-tasks:
- [x] 11.1 Import ConfirmationModal component
- [x] 11.2 Import RescheduleModal component
- [x] 11.3 Import GradientButton component (if used directly)
- [x] 11.4 Add ConfirmationModal component with conditional rendering based on showConfirmationModal
- [x] 11.5 Pass visible, onClose, appointmentData, and type props to ConfirmationModal
- [x] 11.6 Add RescheduleModal component with conditional rendering based on showRescheduleModal
- [x] 11.7 Pass visible, onClose, appointment, and onSubmit props to RescheduleModal
- [x] 11.8 Ensure modals are rendered after existing booking modal

---

## Task 12: Add Error Display to Booking Modal
Update booking modal to show inline validation errors instead of Alert.alert.

### Sub-tasks:
- [x] 12.1 Add errorMessage state variable if not already added
- [x] 12.2 Add error text component in booking modal (conditional rendering)
- [x] 12.3 Style error text with red color (COLORS.error) and appropriate font
- [x] 12.4 Clear errorMessage when user starts typing in any field
- [x] 12.5 Position error message above the submit button

---

## Task 13: Test Confirmation Modal Flow
Verify the confirmation modal works correctly for appointment booking.

### Sub-tasks:
- [x] 13.1 Test booking appointment with valid data shows confirmation modal
- [x] 13.2 Verify calendar icon displays correctly with purple color
- [x] 13.3 Verify appointment details (teacher, date, time, topic) display correctly
- [x] 13.4 Verify confirmation message displays correctly
- [x] 13.5 Test "Done" button closes modal and clears form
- [x] 13.6 Test tapping outside modal dismisses it
- [ ] 13.7 Verify fade-in and scale animations work smoothly
- [ ] 13.8 Verify fade-out animation works when closing
- [ ] 13.9 Test haptic feedback triggers on button press
- [ ] 13.10 Verify gradient button displays purple-to-green gradient

---

## Task 14: Test Reschedule Modal Flow
Verify the reschedule modal works correctly for pending appointments.

### Sub-tasks:
- [ ] 14.1 Test tapping "Reschedule" on pending appointment opens modal
- [ ] 14.2 Verify current appointment details display correctly
- [ ] 14.3 Test date picker opens when tapping date trigger
- [ ] 14.4 Verify date picker shows next 30 days in correct format
- [ ] 14.5 Test selecting a date updates the displayed value
- [ ] 14.6 Test time picker opens when tapping time trigger
- [ ] 14.7 Verify time picker shows 9 AM - 5 PM in 30-min intervals
- [ ] 14.8 Test selecting a time updates the displayed value
- [ ] 14.9 Test optional reason field accepts text input
- [ ] 14.10 Test submitting with empty date shows error message
- [ ] 14.11 Test submitting with empty time shows error message
- [ ] 14.12 Test submitting with valid data shows confirmation modal
- [ ] 14.13 Verify slide-up animation works smoothly
- [ ] 14.14 Test close button dismisses modal
- [ ] 14.15 Test tapping outside modal dismisses it

---

## Task 15: Test Validation and Error Handling
Verify all validation and error scenarios work correctly.

### Sub-tasks:
- [x] 15.1 Test booking with empty date shows error
- [ ] 15.2 Test booking with empty time shows error
- [ ] 15.3 Test booking with empty topic shows error
- [ ] 15.4 Test reschedule with empty date shows error
- [ ] 15.5 Test reschedule with empty time shows error
- [ ] 15.6 Verify error messages clear when user corrects input
- [ ] 15.7 Test rapid button presses don't cause issues
- [ ] 15.8 Test opening modal while another is open (should prevent)

---

## Task 16: Test Animations and Transitions
Verify all animations work smoothly on both iOS and Android.

### Sub-tasks:
- [ ] 16.1 Test confirmation modal fade-in animation (300ms)
- [ ] 16.2 Test confirmation modal scale animation (spring)
- [ ] 16.3 Test confirmation modal fade-out animation (200ms)
- [ ] 16.4 Test reschedule modal slide-up animation (300ms)
- [ ] 16.5 Test reschedule modal fade-in animation (300ms)
- [ ] 16.6 Test reschedule modal slide-down animation (200ms)
- [ ] 16.7 Verify overlay opacity animates in sync with modals
- [ ] 16.8 Test animations on iOS device/simulator
- [ ] 16.9 Test animations on Android device/emulator
- [ ] 16.10 Verify no animation jank or performance issues

---

## Task 17: Test Haptic Feedback
Verify haptic feedback works correctly on supported devices.

### Sub-tasks:
- [ ] 17.1 Test "Done" button triggers light haptic feedback
- [ ] 17.2 Test "Send Reschedule Request" button triggers medium haptic feedback
- [ ] 17.3 Test gradient button triggers haptic feedback
- [ ] 17.4 Verify haptic feedback works on iOS
- [ ] 17.5 Verify haptic feedback works on Android (if supported)

---

## Task 18: Test Color Specifications
Verify all colors match the design specifications.

### Sub-tasks:
- [ ] 18.1 Verify gradient button uses purple (#7B6FE8) to green (#3AAF72)
- [ ] 18.2 Verify calendar icon uses purple color (#7B6FE8)
- [ ] 18.3 Verify school theme colors remain unchanged (Navy Blue #1B3A6B, Goldenrod #DAA520)
- [ ] 18.4 Verify modal overlays use rgba(0, 0, 0, 0.6)
- [ ] 18.5 Verify error text uses COLORS.error
- [ ] 18.6 Verify disabled gradient button uses gray colors

---

## Task 19: Test Accessibility
Verify accessibility features work correctly.

### Sub-tasks:
- [ ] 19.1 Add accessibilityLabel to all interactive elements
- [ ] 19.2 Test screen reader announces modal state changes
- [ ] 19.3 Verify color contrast meets WCAG AA standards
- [ ] 19.4 Test keyboard navigation (if applicable)
- [ ] 19.5 Verify focus indicators are visible
- [ ] 19.6 Test with VoiceOver on iOS
- [ ] 19.7 Test with TalkBack on Android

---

## Task 20: Performance Optimization
Optimize component performance and clean up resources.

### Sub-tasks:
- [ ] 20.1 Verify useNativeDriver: true is used for all animations
- [ ] 20.2 Memoize date/time options generation if needed
- [ ] 20.3 Consider React.memo for modal components if re-renders are frequent
- [ ] 20.4 Verify animation listeners are cleaned up on unmount
- [ ] 20.5 Test modal performance with multiple rapid open/close cycles
- [ ] 20.6 Profile component render times if performance issues occur

---

## Task 21: Final Integration Testing
Perform end-to-end testing of the complete feature.

### Sub-tasks:
- [ ] 21.1 Test complete booking flow: open modal → fill form → submit → see confirmation → close
- [ ] 21.2 Test complete reschedule flow: tap reschedule → select date/time → submit → see confirmation → close
- [ ] 21.3 Test booking followed by reschedule on same appointment
- [ ] 21.4 Test multiple appointments with different statuses
- [ ] 21.5 Verify no memory leaks or performance degradation
- [ ] 21.6 Test on low-end devices for performance
- [ ] 21.7 Test with slow network conditions (if backend integration exists)
- [ ] 21.8 Verify all existing appointment functionality still works
- [ ] 21.9 Test on both iOS and Android platforms
- [ ] 21.10 Verify no console errors or warnings

---

## Notes
- All tasks should be completed in order as they have dependencies
- Test tasks (13-21) can be performed in parallel after implementation tasks (1-12) are complete
- Backend integration for reschedule requests is marked as TODO and should be implemented separately
- The @react-native-picker/picker package may need platform-specific configuration
