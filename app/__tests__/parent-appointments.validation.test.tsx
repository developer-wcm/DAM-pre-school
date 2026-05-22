import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import ParentAppointmentsScreen from '../parent-appointments';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('../../utils/haptics', () => ({
  triggerHaptic: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('@react-native-picker/picker', () => ({
  Picker: 'Picker',
}));

describe('ParentAppointmentsScreen - Booking Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task 15.1: Empty Date Validation', () => {
    it('should show error message when booking with empty date', async () => {
      const { getByText, getByPlaceholderText, queryByText, getAllByText } = render(<ParentAppointmentsScreen />);

      // Find and press the add button by looking for all buttons and finding the one with "add" icon
      const allButtons = getAllByText('My Appointments')[0].parent?.parent?.findAllByType('TouchableOpacity');
      // The add button should be the last button in the header
      const addButton = allButtons?.[allButtons.length - 1];
      
      if (addButton) {
        fireEvent.press(addButton);
      }

      // Wait for modal to appear
      await waitFor(() => {
        expect(getByText('Book Appointment')).toBeTruthy();
      }, { timeout: 3000 });

      // Fill in time and topic but leave date empty
      const timeInput = getByText('Preferred Time').parent?.findByType('TextInput');
      const topicInput = getByText('Topic / Reason').parent?.findByType('TextInput');

      if (timeInput) {
        fireEvent.changeText(timeInput, '10:00 AM');
      }

      if (topicInput) {
        fireEvent.changeText(topicInput, 'Discuss student progress');
      }

      // Try to submit the form
      const requestButton = getByText('Request Appointment');
      fireEvent.press(requestButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(getByText('Please fill in all fields')).toBeTruthy();
      });

      // Verify the booking modal is still open (not closed)
      expect(getByText('Book Appointment')).toBeTruthy();

      // Verify confirmation modal did NOT appear
      expect(queryByText('Appointment Requested!')).toBeNull();
    });

    it('should show error message when date field is empty string', async () => {
      const { getByText, getByPlaceholderText, UNSAFE_root } = render(<ParentAppointmentsScreen />);

      // Open the booking modal
      openBookingModal(UNSAFE_root);

      // Wait for modal to appear
      await waitFor(() => {
        expect(getByText('Book Appointment')).toBeTruthy();
      });

      // Get form inputs
      const dateInput = getByPlaceholderText('e.g., Feb 25, 2026');
      const timeInput = getByPlaceholderText('e.g., 10:00 AM');
      const topicInput = getByPlaceholderText('What would you like to discuss?');

      // Set date to empty string explicitly
      fireEvent.changeText(dateInput, '');
      fireEvent.changeText(timeInput, '2:00 PM');
      fireEvent.changeText(topicInput, 'Academic discussion');

      // Submit the form
      const requestButton = getByText('Request Appointment');
      fireEvent.press(requestButton);

      // Verify error message appears
      await waitFor(() => {
        expect(getByText('Please fill in all fields')).toBeTruthy();
      });
    });

    it('should clear error message when user starts typing in date field', async () => {
      const { getByText, getByPlaceholderText, queryByText, UNSAFE_root } = render(<ParentAppointmentsScreen />);

      // Open booking modal
      openBookingModal(UNSAFE_root);

      await waitFor(() => {
        expect(getByText('Book Appointment')).toBeTruthy();
      });

      // Try to submit with empty fields to trigger error
      const requestButton = getByText('Request Appointment');
      fireEvent.press(requestButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(getByText('Please fill in all fields')).toBeTruthy();
      });

      // Now type in the date field
      const dateInput = getByPlaceholderText('e.g., Feb 25, 2026');
      fireEvent.changeText(dateInput, 'Feb 25, 2026');

      // Error message should be cleared
      await waitFor(() => {
        expect(queryByText('Please fill in all fields')).toBeNull();
      });
    });

    it('should display error in red color', async () => {
      const { getByText, UNSAFE_root } = render(<ParentAppointmentsScreen />);

      // Open booking modal
      openBookingModal(UNSAFE_root);

      await waitFor(() => {
        expect(getByText('Book Appointment')).toBeTruthy();
      });

      // Submit with empty fields
      const requestButton = getByText('Request Appointment');
      fireEvent.press(requestButton);

      // Wait for error and check styling
      await waitFor(() => {
        const errorText = getByText('Please fill in all fields');
        expect(errorText).toBeTruthy();
        
        // Verify error text has correct styling
        expect(errorText.props.style).toMatchObject({
          fontSize: 14,
          fontWeight: '600',
          textAlign: 'center',
        });
      });
    });

    it('should not proceed with booking when date is empty', async () => {
      const { getByText, getByPlaceholderText, queryByText, UNSAFE_root } = render(<ParentAppointmentsScreen />);

      // Open booking modal
      openBookingModal(UNSAFE_root);

      await waitFor(() => {
        expect(getByText('Book Appointment')).toBeTruthy();
      });

      // Fill only time and topic
      const timeInput = getByPlaceholderText('e.g., 10:00 AM');
      const topicInput = getByPlaceholderText('What would you like to discuss?');

      fireEvent.changeText(timeInput, '3:00 PM');
      fireEvent.changeText(topicInput, 'Behavior discussion');

      // Submit
      const requestButton = getByText('Request Appointment');
      fireEvent.press(requestButton);

      // Verify booking modal stays open
      await waitFor(() => {
        expect(getByText('Book Appointment')).toBeTruthy();
      });

      // Verify confirmation modal does NOT appear
      expect(queryByText('Appointment Requested!')).toBeNull();
      expect(queryByText('Done')).toBeNull();
    });

    it('should show error when all fields are empty', async () => {
      const { getByText, UNSAFE_root } = render(<ParentAppointmentsScreen />);

      // Open booking modal
      openBookingModal(UNSAFE_root);

      await waitFor(() => {
        expect(getByText('Book Appointment')).toBeTruthy();
      });

      // Submit without filling anything
      const requestButton = getByText('Request Appointment');
      fireEvent.press(requestButton);

      // Verify error appears
      await waitFor(() => {
        expect(getByText('Please fill in all fields')).toBeTruthy();
      });
    });

    it('should allow successful booking when date is provided with other fields', async () => {
      const { getByText, getByPlaceholderText, queryByText, UNSAFE_root } = render(<ParentAppointmentsScreen />);

      // Open booking modal
      openBookingModal(UNSAFE_root);

      await waitFor(() => {
        expect(getByText('Book Appointment')).toBeTruthy();
      });

      // Fill all fields including date
      const dateInput = getByPlaceholderText('e.g., Feb 25, 2026');
      const timeInput = getByPlaceholderText('e.g., 10:00 AM');
      const topicInput = getByPlaceholderText('What would you like to discuss?');

      fireEvent.changeText(dateInput, 'Feb 25, 2026');
      fireEvent.changeText(timeInput, '10:00 AM');
      fireEvent.changeText(topicInput, 'Progress review');

      // Submit
      const requestButton = getByText('Request Appointment');
      fireEvent.press(requestButton);

      // Verify no error appears
      expect(queryByText('Please fill in all fields')).toBeNull();

      // Verify confirmation modal appears
      await waitFor(() => {
        expect(getByText('Appointment Requested!')).toBeTruthy();
      });

      // Verify booking modal is closed
      expect(queryByText('Book Appointment')).toBeNull();
    });
  });
});
