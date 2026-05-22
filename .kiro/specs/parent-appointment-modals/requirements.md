# Requirements Document

## Introduction

This document specifies the requirements for enhancing the parent appointments screen with improved modal interactions. The feature replaces the basic Alert.alert() confirmation with a custom confirmation modal and adds a reschedule modal with proper date/time pickers. The modals follow the design specifications provided, using purple-to-green gradient buttons while maintaining the school's Navy Blue and Goldenrod theme for other UI elements.

## Glossary

- **Appointment_System**: The parent appointments screen and its associated modal components
- **Confirmation_Modal**: A custom modal displayed after successful appointment booking
- **Reschedule_Modal**: A modal that allows parents to request rescheduling of pending appointments
- **Booking_Modal**: The existing modal for creating new appointment requests
- **Date_Picker**: A dropdown component for selecting dates (not a text input)
- **Time_Picker**: A dropdown component for selecting times (not a text input)
- **Gradient_Button**: A button with purple-to-green gradient styling (#7B6FE8 to #3AAF72)
- **School_Theme**: Navy Blue (#1B3A6B) and Goldenrod (#DAA520) color scheme
- **Pending_Appointment**: An appointment with status "pending" awaiting teacher confirmation

## Requirements

### Requirement 1: Display Appointment Confirmation Modal

**User Story:** As a parent, I want to see a professional confirmation modal after booking an appointment, so that I have clear visual feedback that my request was submitted successfully.

#### Acceptance Criteria

1. WHEN an appointment is successfully booked, THE Confirmation_Modal SHALL display with a calendar icon
2. THE Confirmation_Modal SHALL display the formatted date and time of the requested appointment
3. THE Confirmation_Modal SHALL display a confirmation message indicating the request was sent
4. THE Confirmation_Modal SHALL include a Gradient_Button labeled "Done" with purple-to-green gradient
5. WHEN the "Done" button is pressed, THE Confirmation_Modal SHALL close and clear the booking form fields
6. THE Confirmation_Modal SHALL use smooth fade-in animation when appearing
7. THE Confirmation_Modal SHALL have a semi-transparent dark overlay behind it
8. THE Confirmation_Modal SHALL be centered on the screen with rounded corners and white background

### Requirement 2: Implement Reschedule Modal

**User Story:** As a parent, I want to reschedule a pending appointment using proper date and time pickers, so that I can easily request a different time without typing dates manually.

#### Acceptance Criteria

1. WHEN a parent taps "Reschedule" on a Pending_Appointment, THE Reschedule_Modal SHALL display
2. THE Reschedule_Modal SHALL include a Date_Picker dropdown component (not a text input)
3. THE Reschedule_Modal SHALL include a Time_Picker dropdown component (not a text input)
4. THE Reschedule_Modal SHALL include an optional text input field for reschedule reason
5. THE Reschedule_Modal SHALL display the current appointment date and time for reference
6. THE Reschedule_Modal SHALL include a Gradient_Button labeled "Send Reschedule Request"
7. WHEN the "Send Reschedule Request" button is pressed with valid date and time, THE Appointment_System SHALL submit the reschedule request
8. WHEN the "Send Reschedule Request" button is pressed with empty date or time, THE Appointment_System SHALL display an error message
9. THE Reschedule_Modal SHALL include a close button to dismiss without changes
10. THE Reschedule_Modal SHALL use smooth slide-up animation when appearing

### Requirement 3: Replace Alert.alert with Custom Confirmation

**User Story:** As a parent, I want consistent visual design across all appointment interactions, so that the app feels polished and professional.

#### Acceptance Criteria

1. THE Appointment_System SHALL NOT use Alert.alert() for appointment confirmations
2. WHEN an appointment booking is successful, THE Appointment_System SHALL display the Confirmation_Modal instead of Alert.alert()
3. THE Confirmation_Modal SHALL match the design specifications provided by the user
4. THE Confirmation_Modal SHALL maintain consistent styling with other modals in the application

### Requirement 4: Implement Gradient Button Styling

**User Story:** As a parent, I want visually appealing action buttons in modals, so that the interface feels modern and engaging.

#### Acceptance Criteria

1. THE Gradient_Button SHALL use a linear gradient from purple (#7B6FE8) to green (#3AAF72)
2. THE Gradient_Button SHALL have rounded corners (border radius 50)
3. THE Gradient_Button SHALL have white text with font weight 700
4. THE Gradient_Button SHALL have appropriate padding (vertical 16, horizontal 24)
5. THE Gradient_Button SHALL have a subtle shadow effect for depth
6. WHEN pressed, THE Gradient_Button SHALL provide haptic feedback
7. THE Gradient_Button SHALL be used only for modal action buttons, not for other UI elements

### Requirement 5: Maintain School Theme for Non-Modal Elements

**User Story:** As a parent, I want the app to maintain the school's branding colors, so that the interface remains consistent with the school's identity.

#### Acceptance Criteria

1. THE Appointment_System SHALL continue using School_Theme colors for headers, tabs, and appointment cards
2. THE Appointment_System SHALL use Navy Blue (#1B3A6B) for primary UI elements outside modals
3. THE Appointment_System SHALL use Goldenrod (#DAA520) for secondary accents outside modals
4. THE Appointment_System SHALL use Gradient_Button styling only within modal action buttons
5. THE Appointment_System SHALL NOT replace existing School_Theme buttons with Gradient_Button styling

### Requirement 6: Handle Date and Time Picker Selection

**User Story:** As a parent, I want to select dates and times from dropdown pickers, so that I can avoid typing errors and choose from available options easily.

#### Acceptance Criteria

1. THE Date_Picker SHALL display dates in a user-friendly format (e.g., "Feb 25, 2026")
2. THE Time_Picker SHALL display times in 12-hour format with AM/PM (e.g., "10:00 AM")
3. WHEN a date is selected, THE Date_Picker SHALL update the displayed value immediately
4. WHEN a time is selected, THE Time_Picker SHALL update the displayed value immediately
5. THE Date_Picker SHALL prevent selection of past dates
6. THE Time_Picker SHALL offer time slots in reasonable increments (e.g., 30-minute intervals)
7. IF no date picker library is available, THE Appointment_System SHALL use React Native Picker or similar native component

### Requirement 7: Provide Smooth Modal Animations

**User Story:** As a parent, I want modals to appear and disappear smoothly, so that the interface feels responsive and polished.

#### Acceptance Criteria

1. WHEN the Confirmation_Modal appears, THE Appointment_System SHALL animate it with a fade-in effect over 300ms
2. WHEN the Reschedule_Modal appears, THE Appointment_System SHALL animate it with a slide-up effect over 300ms
3. WHEN any modal is dismissed, THE Appointment_System SHALL animate it out over 200ms
4. THE Appointment_System SHALL animate the overlay opacity in sync with modal animations
5. THE Appointment_System SHALL prevent interaction with background content while a modal is displayed

### Requirement 8: Handle Edge Cases and Validation

**User Story:** As a parent, I want clear feedback when I make mistakes, so that I can correct them and complete my task successfully.

#### Acceptance Criteria

1. WHEN the reschedule form is submitted with empty date, THE Appointment_System SHALL display "Please select a date"
2. WHEN the reschedule form is submitted with empty time, THE Appointment_System SHALL display "Please select a time"
3. WHEN a reschedule request is successfully submitted, THE Appointment_System SHALL display the Confirmation_Modal
4. WHEN a modal is displayed, THE Appointment_System SHALL prevent scrolling of background content
5. WHEN the user taps outside a modal, THE Appointment_System SHALL dismiss the modal
6. THE Appointment_System SHALL clear form fields after successful submission
7. THE Appointment_System SHALL preserve form fields if the user dismisses the modal without submitting

### Requirement 9: Display Current Appointment Details in Reschedule Modal

**User Story:** As a parent, I want to see the current appointment details when rescheduling, so that I can make an informed decision about the new time.

#### Acceptance Criteria

1. THE Reschedule_Modal SHALL display the current appointment date prominently
2. THE Reschedule_Modal SHALL display the current appointment time prominently
3. THE Reschedule_Modal SHALL display the teacher name for context
4. THE Reschedule_Modal SHALL display the appointment topic for context
5. THE Reschedule_Modal SHALL visually distinguish current details from new selection fields

### Requirement 10: Integrate with Existing Appointment System

**User Story:** As a parent, I want the new modals to work seamlessly with the existing appointment system, so that I can manage my appointments without disruption.

#### Acceptance Criteria

1. THE Appointment_System SHALL maintain compatibility with existing appointment data structure
2. THE Appointment_System SHALL update appointment status appropriately after reschedule requests
3. THE Appointment_System SHALL preserve all existing functionality (booking, viewing, canceling)
4. THE Appointment_System SHALL use existing TypeScript types and interfaces
5. THE Appointment_System SHALL follow existing code patterns and conventions in the codebase
6. THE Appointment_System SHALL use existing utility functions (haptics, error handling) where applicable
