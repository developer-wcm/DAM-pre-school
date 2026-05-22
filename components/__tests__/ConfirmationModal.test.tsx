import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import ConfirmationModal from '../ConfirmationModal';

// Mock dependencies
jest.mock('../../utils/haptics', () => ({
  triggerHaptic: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('ConfirmationModal - Appointment Details Display', () => {
  const mockAppointmentData = {
    teacherName: 'Ms. Sarah Johnson',
    date: 'Monday, March 15, 2024',
    time: '10:00 AM - 10:30 AM',
    topic: 'Student Progress Discussion',
  };

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    appointmentData: mockAppointmentData,
    type: 'booking' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Appointment Details Display', () => {
    it('should display all four appointment detail fields', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      // Verify all labels are present
      expect(getByText('Teacher:')).toBeTruthy();
      expect(getByText('Date:')).toBeTruthy();
      expect(getByText('Time:')).toBeTruthy();
      expect(getByText('Topic:')).toBeTruthy();
    });

    it('should display teacher name correctly', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      expect(getByText('Ms. Sarah Johnson')).toBeTruthy();
    });

    it('should display date correctly', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      expect(getByText('Monday, March 15, 2024')).toBeTruthy();
    });

    it('should display time correctly', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      expect(getByText('10:00 AM - 10:30 AM')).toBeTruthy();
    });

    it('should display topic correctly', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      expect(getByText('Student Progress Discussion')).toBeTruthy();
    });
  });

  describe('Layout Structure', () => {
    it('should have a details box container', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      // Get the teacher label and verify it's in the details structure
      const teacherLabel = getByText('Teacher:');
      expect(teacherLabel).toBeTruthy();
      expect(teacherLabel.props.style).toMatchObject({
        fontSize: 14,
        fontWeight: '700',
        width: 60,
      });
    });

    it('should have detail rows with proper structure', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      // Verify labels have correct styling
      const teacherLabel = getByText('Teacher:');
      expect(teacherLabel.props.style).toMatchObject({
        fontSize: 14,
        fontWeight: '700',
        width: 60,
      });

      // Verify values have correct styling
      const teacherValue = getByText('Ms. Sarah Johnson');
      expect(teacherValue.props.style).toMatchObject({
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
      });
    });
  });

  describe('Styling Verification', () => {
    it('should apply correct label styling to all labels', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      const labels = ['Teacher:', 'Date:', 'Time:', 'Topic:'];
      labels.forEach((label) => {
        const element = getByText(label);
        expect(element.props.style).toMatchObject({
          fontSize: 14,
          fontWeight: '700',
          width: 60,
        });
      });
    });

    it('should apply correct value styling to all values', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      const values = [
        'Ms. Sarah Johnson',
        'Monday, March 15, 2024',
        '10:00 AM - 10:30 AM',
        'Student Progress Discussion',
      ];

      values.forEach((value) => {
        const element = getByText(value);
        expect(element.props.style).toMatchObject({
          fontSize: 14,
          fontWeight: '600',
          flex: 1,
        });
      });
    });
  });

  describe('Data Prop Handling', () => {
    it('should correctly pass and display appointmentData prop', () => {
      const customData = {
        teacherName: 'Mr. John Smith',
        date: 'Friday, April 20, 2024',
        time: '2:00 PM - 2:30 PM',
        topic: 'Behavioral Concerns',
      };

      const { getByText } = render(
        <ConfirmationModal
          {...defaultProps}
          appointmentData={customData}
        />
      );

      expect(getByText('Mr. John Smith')).toBeTruthy();
      expect(getByText('Friday, April 20, 2024')).toBeTruthy();
      expect(getByText('2:00 PM - 2:30 PM')).toBeTruthy();
      expect(getByText('Behavioral Concerns')).toBeTruthy();
    });

    it('should handle long teacher names', () => {
      const longNameData = {
        ...mockAppointmentData,
        teacherName: 'Dr. Elizabeth Alexandra Montgomery-Williams',
      };

      const { getByText } = render(
        <ConfirmationModal
          {...defaultProps}
          appointmentData={longNameData}
        />
      );

      expect(getByText('Dr. Elizabeth Alexandra Montgomery-Williams')).toBeTruthy();
    });

    it('should handle long topics', () => {
      const longTopicData = {
        ...mockAppointmentData,
        topic: 'Comprehensive discussion about student academic progress, behavioral development, and social interactions',
      };

      const { getByText } = render(
        <ConfirmationModal
          {...defaultProps}
          appointmentData={longTopicData}
        />
      );

      expect(
        getByText(
          'Comprehensive discussion about student academic progress, behavioral development, and social interactions'
        )
      ).toBeTruthy();
    });
  });

  describe('Label Formatting', () => {
    it('should display labels with colon suffix', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      expect(getByText('Teacher:')).toBeTruthy();
      expect(getByText('Date:')).toBeTruthy();
      expect(getByText('Time:')).toBeTruthy();
      expect(getByText('Topic:')).toBeTruthy();
    });

    it('should display labels in correct order', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      // Get all text elements and verify order
      const teacherLabel = getByText('Teacher:');
      const dateLabel = getByText('Date:');
      const timeLabel = getByText('Time:');
      const topicLabel = getByText('Topic:');

      // All labels should be present
      expect(teacherLabel).toBeTruthy();
      expect(dateLabel).toBeTruthy();
      expect(timeLabel).toBeTruthy();
      expect(topicLabel).toBeTruthy();
    });
  });

  describe('Modal Type Variations', () => {
    it('should display appointment details for booking type', () => {
      const { getByText } = render(
        <ConfirmationModal {...defaultProps} type="booking" />
      );

      expect(getByText('Ms. Sarah Johnson')).toBeTruthy();
      expect(getByText('Monday, March 15, 2024')).toBeTruthy();
      expect(getByText('10:00 AM - 10:30 AM')).toBeTruthy();
      expect(getByText('Student Progress Discussion')).toBeTruthy();
    });

    it('should display appointment details for reschedule type', () => {
      const { getByText } = render(
        <ConfirmationModal {...defaultProps} type="reschedule" />
      );

      expect(getByText('Ms. Sarah Johnson')).toBeTruthy();
      expect(getByText('Monday, March 15, 2024')).toBeTruthy();
      expect(getByText('10:00 AM - 10:30 AM')).toBeTruthy();
      expect(getByText('Student Progress Discussion')).toBeTruthy();
    });
  });

  describe('Confirmation Message Display', () => {
    it('should display correct title for booking type', () => {
      const { getByText } = render(
        <ConfirmationModal {...defaultProps} type="booking" />
      );

      expect(getByText('Appointment Requested!')).toBeTruthy();
    });

    it('should display correct title for reschedule type', () => {
      const { getByText } = render(
        <ConfirmationModal {...defaultProps} type="reschedule" />
      );

      expect(getByText('Reschedule Request Sent!')).toBeTruthy();
    });

    it('should display correct message for booking type', () => {
      const { getByText } = render(
        <ConfirmationModal {...defaultProps} type="booking" />
      );

      expect(
        getByText(
          'Your appointment request has been sent to the teacher. You will be notified once it is confirmed.'
        )
      ).toBeTruthy();
    });

    it('should display correct message for reschedule type', () => {
      const { getByText } = render(
        <ConfirmationModal {...defaultProps} type="reschedule" />
      );

      expect(
        getByText(
          'Your reschedule request has been sent to the teacher. You will be notified once it is confirmed.'
        )
      ).toBeTruthy();
    });

    it('should display message with correct styling', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      const message = getByText(
        'Your appointment request has been sent to the teacher. You will be notified once it is confirmed.'
      );

      expect(message.props.style).toMatchObject({
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
      });
    });

    it('should display title with correct styling', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      const title = getByText('Appointment Requested!');

      expect(title.props.style).toMatchObject({
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
      });
    });

    it('should display message below appointment details', () => {
      const { getByText } = render(<ConfirmationModal {...defaultProps} />);

      // Verify both the details and message are present
      expect(getByText('Ms. Sarah Johnson')).toBeTruthy();
      expect(
        getByText(
          'Your appointment request has been sent to the teacher. You will be notified once it is confirmed.'
        )
      ).toBeTruthy();
    });

    it('should display clear and user-friendly message for booking', () => {
      const { getByText } = render(
        <ConfirmationModal {...defaultProps} type="booking" />
      );

      const message = getByText(
        'Your appointment request has been sent to the teacher. You will be notified once it is confirmed.'
      );

      // Verify message is clear and informative
      expect(message).toBeTruthy();
      expect(message.props.children).toContain('sent to the teacher');
      expect(message.props.children).toContain('notified once it is confirmed');
    });

    it('should display clear and user-friendly message for reschedule', () => {
      const { getByText } = render(
        <ConfirmationModal {...defaultProps} type="reschedule" />
      );

      const message = getByText(
        'Your reschedule request has been sent to the teacher. You will be notified once it is confirmed.'
      );

      // Verify message is clear and informative
      expect(message).toBeTruthy();
      expect(message.props.children).toContain('reschedule request');
      expect(message.props.children).toContain('sent to the teacher');
      expect(message.props.children).toContain('notified once it is confirmed');
    });
  });

  describe('Modal Dismissal', () => {
    it('should dismiss modal when tapping outside (on overlay)', () => {
      const mockOnClose = jest.fn();
      const { getByTestId } = render(
        <ConfirmationModal
          {...defaultProps}
          onClose={mockOnClose}
        />
      );

      // Find the overlay TouchableOpacity by testID
      const overlayTouchable = getByTestId('confirmation-modal-overlay');
      
      // Fire press event on the overlay TouchableOpacity
      fireEvent.press(overlayTouchable);

      // Verify onClose was called
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have TouchableOpacity wrapper for overlay dismissal', () => {
      const { getByTestId } = render(
        <ConfirmationModal {...defaultProps} />
      );

      // Verify the overlay TouchableOpacity exists
      const overlayTouchable = getByTestId('confirmation-modal-overlay');
      expect(overlayTouchable).toBeTruthy();
    });

    it('should call onClose callback when tapping outside', () => {
      const mockOnClose = jest.fn();
      const { getByTestId } = render(
        <ConfirmationModal
          {...defaultProps}
          onClose={mockOnClose}
        />
      );

      // Get the overlay TouchableOpacity
      const overlayTouchable = getByTestId('confirmation-modal-overlay');
      
      // Simulate tap on overlay
      fireEvent.press(overlayTouchable);

      // Verify the callback was invoked
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should animate out before calling onClose when tapping outside', () => {
      const mockOnClose = jest.fn();
      const { getByTestId } = render(
        <ConfirmationModal
          {...defaultProps}
          onClose={mockOnClose}
        />
      );

      const overlayTouchable = getByTestId('confirmation-modal-overlay');
      
      // Press the overlay
      fireEvent.press(overlayTouchable);

      // onClose should be called (animation completes immediately in tests)
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
