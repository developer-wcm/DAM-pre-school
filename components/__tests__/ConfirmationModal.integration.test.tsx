import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import ConfirmationModal from '../ConfirmationModal';

// Mock dependencies
jest.mock('../../utils/haptics', () => ({
  triggerHaptic: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('ConfirmationModal - Integration Tests', () => {
  const mockAppointmentData = {
    teacherName: 'Ms. Sarah Johnson',
    date: 'Monday, March 15, 2024',
    time: '10:00 AM - 10:30 AM',
    topic: 'Student Progress Discussion',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task 13.5: Done Button Closes Modal and Clears Form', () => {
    it('should call onClose callback when Done button is pressed', async () => {
      const mockOnClose = jest.fn();
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          onClose={mockOnClose}
          appointmentData={mockAppointmentData}
          type="booking"
        />
      );

      // Find and press the Done button
      const doneButton = getByText('Done');
      expect(doneButton).toBeTruthy();
      
      fireEvent.press(doneButton);

      // The onClose callback should be called after animation
      // In test environment, animations complete immediately
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('should trigger haptic feedback when Done button is pressed', () => {
      const { triggerHaptic } = require('../../utils/haptics');
      const mockOnClose = jest.fn();
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          onClose={mockOnClose}
          appointmentData={mockAppointmentData}
          type="booking"
        />
      );

      const doneButton = getByText('Done');
      fireEvent.press(doneButton);

      // Haptic feedback should be triggered immediately
      expect(triggerHaptic).toHaveBeenCalledWith('light');
    });

    it('should display Done button for booking confirmation', () => {
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          onClose={jest.fn()}
          appointmentData={mockAppointmentData}
          type="booking"
        />
      );

      const doneButton = getByText('Done');
      expect(doneButton).toBeTruthy();
    });

    it('should display Done button for reschedule confirmation', () => {
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          onClose={jest.fn()}
          appointmentData={mockAppointmentData}
          type="reschedule"
        />
      );

      const doneButton = getByText('Done');
      expect(doneButton).toBeTruthy();
    });

    it('should handle multiple Done button presses gracefully', async () => {
      const mockOnClose = jest.fn();
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          onClose={mockOnClose}
          appointmentData={mockAppointmentData}
          type="booking"
        />
      );

      const doneButton = getByText('Done');
      
      // Press the button multiple times rapidly
      fireEvent.press(doneButton);
      fireEvent.press(doneButton);
      fireEvent.press(doneButton);

      // Should still only call onClose once (or at least handle gracefully)
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('Form Clearing Behavior', () => {
    it('should verify onClose is called which triggers form clearing in parent', async () => {
      // This test verifies that the modal correctly calls onClose
      // The actual form clearing happens in the parent component (parent-appointments.tsx)
      // via the handleConfirmationClose function
      
      const mockOnClose = jest.fn();
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          onClose={mockOnClose}
          appointmentData={mockAppointmentData}
          type="booking"
        />
      );

      const doneButton = getByText('Done');
      fireEvent.press(doneButton);

      // Verify onClose is called, which will trigger form clearing in parent
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });
  });
});
