/**
 * Date and Time Utility Functions
 * 
 * Provides formatting and generation utilities for date/time pickers
 * in the parent appointment modals.
 */

/**
 * Format a Date object to "Feb 25, 2026" format
 * @param date - The date to format
 * @returns Formatted date string (e.g., "Feb 25, 2026")
 */
export const formatDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/**
 * Format hour and minute to "10:00 AM" format
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minute (0-59)
 * @returns Formatted time string (e.g., "10:00 AM")
 */
export const formatTime = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
};

/**
 * Generate an array of date options for the next 30 days
 * @returns Array of formatted date strings
 */
export const generateDateOptions = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const formatted = formatDate(date);
    dates.push(formatted);
  }
  
  return dates;
};

/**
 * Generate an array of time slot options from 9 AM to 5 PM
 * with 30-minute intervals
 * @returns Array of formatted time strings
 */
export const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  const startHour = 9;
  const endHour = 17;
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute of [0, 30]) {
      if (hour === endHour && minute > 0) break;
      const time = formatTime(hour, minute);
      times.push(time);
    }
  }
  
  return times;
};
