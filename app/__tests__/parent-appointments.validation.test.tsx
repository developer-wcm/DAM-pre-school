/// <reference types="jest" />
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import ParentAppointmentsScreen from '../parent-appointments';

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

// Mock the auth context so the screen does not pull in expo-linking /
// expo-web-browser / supabase through context/auth (those are ESM modules
// jest is not configured to transform).
jest.mock('../../context/auth', () => ({
  useAuth: () => ({
    user: { id: 'parent-1' },
    profile: {
      id: 'parent-1',
      full_name: 'Test Parent',
      role: 'parent',
      school_id: 'school-1',
      approved: true,
    },
  }),
}));

// Mock supabase with a chainable query builder. `from('profiles')` returns one
// teacher (so a teacher is auto-selected); `from('appointments')` returns no
// rows; inserts succeed.
jest.mock('../../lib/supabase', () => {
  const resultsByTable: Record<string, { data: any[]; error: null }> = {
    profiles: { data: [{ id: 'teacher-1', full_name: 'Ms. Smith', role: 'teacher' }], error: null },
    appointments: { data: [], error: null },
  };

  const makeBuilder = (table: string) => {
    const result = resultsByTable[table] ?? { data: [], error: null };
    const builder: any = {};
    builder.select = jest.fn(() => builder);
    builder.eq = jest.fn(() => builder);
    builder.order = jest.fn(() => Promise.resolve(result));
    builder.insert = jest.fn(() => Promise.resolve({ error: null }));
    // Make the builder awaitable / thenable for the `.eq().eq().then()` chain.
    builder.then = (resolve: (v: any) => any) => Promise.resolve(result).then(resolve);
    return builder;
  };

  return { supabase: { from: jest.fn((table: string) => makeBuilder(table)) } };
});

jest.mock('../../components/ConfirmationModal', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ visible }: { visible: boolean }) =>
    visible ? React.createElement(Text, null, 'Appointment Requested!') : null;
});

jest.mock('../../components/RescheduleModal', () => () => null);

// ── Helpers ──────────────────────────────────────────────────────────────────â”€
// Opens the booking modal by pressing the empty-state "Book Appointment"
// button (the appointments list is empty in these tests, so it is rendered).
async function openBookingModal(getByText: (text: string) => any) {
  // The list starts in a loading state; wait for the empty-state button.
  await waitFor(() => {
    expect(getByText('Book Appointment')).toBeTruthy();
  });
  fireEvent.press(getByText('Book Appointment'));
}

describe('ParentAppointmentsScreen - Booking Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task 15.1: Empty Date Validation', () => {
    it('should show error message when booking with empty date', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<ParentAppointmentsScreen />);

      await openBookingModal(getByText);

      // Modal is open once the unique "Request Appointment" button is present.
      await waitFor(() => {
        expect(getByText('Request Appointment')).toBeTruthy();
      });

      // Fill in time and topic but leave date empty.
      fireEvent.changeText(getByPlaceholderText('e.g., 10:00 AM'), '10:00 AM');
      fireEvent.changeText(getByPlaceholderText('What would you like to discuss?'), 'Discuss progress');

      fireEvent.press(getByText('Request Appointment'));

      await waitFor(() => {
        expect(getByText('Please fill in all fields')).toBeTruthy();
      });

      // Booking modal is still open and no confirmation appeared.
      expect(getByText('Request Appointment')).toBeTruthy();
      expect(queryByText('Appointment Requested!')).toBeNull();
    });

    it('should show error message when date field is empty string', async () => {
      const { getByText, getByPlaceholderText } = render(<ParentAppointmentsScreen />);

      await openBookingModal(getByText);

      await waitFor(() => {
        expect(getByText('Request Appointment')).toBeTruthy();
      });

      fireEvent.changeText(getByPlaceholderText('e.g., Feb 25, 2026'), '');
      fireEvent.changeText(getByPlaceholderText('e.g., 10:00 AM'), '2:00 PM');
      fireEvent.changeText(getByPlaceholderText('What would you like to discuss?'), 'Academic discussion');

      fireEvent.press(getByText('Request Appointment'));

      await waitFor(() => {
        expect(getByText('Please fill in all fields')).toBeTruthy();
      });
    });

    it('should clear error message when user starts typing in date field', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<ParentAppointmentsScreen />);

      await openBookingModal(getByText);

      await waitFor(() => {
        expect(getByText('Request Appointment')).toBeTruthy();
      });

      fireEvent.press(getByText('Request Appointment'));

      await waitFor(() => {
        expect(getByText('Please fill in all fields')).toBeTruthy();
      });

      fireEvent.changeText(getByPlaceholderText('e.g., Feb 25, 2026'), 'Feb 25, 2026');

      await waitFor(() => {
        expect(queryByText('Please fill in all fields')).toBeNull();
      });
    });

    it('should display error in red color', async () => {
      const { getByText } = render(<ParentAppointmentsScreen />);

      await openBookingModal(getByText);

      await waitFor(() => {
        expect(getByText('Request Appointment')).toBeTruthy();
      });

      fireEvent.press(getByText('Request Appointment'));

      await waitFor(() => {
        const errorText = getByText('Please fill in all fields');
        expect(errorText.props.style).toMatchObject({
          fontSize: 14,
          fontWeight: '600',
          textAlign: 'center',
        });
      });
    });

    it('should not proceed with booking when date is empty', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<ParentAppointmentsScreen />);

      await openBookingModal(getByText);

      await waitFor(() => {
        expect(getByText('Request Appointment')).toBeTruthy();
      });

      fireEvent.changeText(getByPlaceholderText('e.g., 10:00 AM'), '3:00 PM');
      fireEvent.changeText(getByPlaceholderText('What would you like to discuss?'), 'Behavior discussion');

      fireEvent.press(getByText('Request Appointment'));

      await waitFor(() => {
        expect(getByText('Request Appointment')).toBeTruthy();
      });

      expect(queryByText('Appointment Requested!')).toBeNull();
    });

    it('should show error when all fields are empty', async () => {
      const { getByText } = render(<ParentAppointmentsScreen />);

      await openBookingModal(getByText);

      await waitFor(() => {
        expect(getByText('Request Appointment')).toBeTruthy();
      });

      fireEvent.press(getByText('Request Appointment'));

      await waitFor(() => {
        expect(getByText('Please fill in all fields')).toBeTruthy();
      });
    });

    it('should allow successful booking when date is provided with other fields', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<ParentAppointmentsScreen />);

      await openBookingModal(getByText);

      await waitFor(() => {
        expect(getByText('Request Appointment')).toBeTruthy();
      });

      fireEvent.changeText(getByPlaceholderText('e.g., Feb 25, 2026'), 'Feb 25, 2026');
      fireEvent.changeText(getByPlaceholderText('e.g., 10:00 AM'), '10:00 AM');
      fireEvent.changeText(getByPlaceholderText('What would you like to discuss?'), 'Progress review');

      fireEvent.press(getByText('Request Appointment'));

      expect(queryByText('Please fill in all fields')).toBeNull();

      // Confirmation modal appears and the booking modal closes.
      await waitFor(() => {
        expect(getByText('Appointment Requested!')).toBeTruthy();
      });
      expect(queryByText('Request Appointment')).toBeNull();
    });
  });
});

