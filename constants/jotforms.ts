/**
 * JotForm URLs
 * ------------
 * Replace the placeholder URLs below with your real JotForm links.
 * Each form opens inside the app in a full-screen WebView.
 *
 * To find your URL:
 *   1. Log in to jotform.com
 *   2. Open your form → Publish → Share Link
 *   3. Paste the link here
 */

export const JOTFORMS = {
  /** Form filled by teachers when submitting a leave request */
  TEACHER_LEAVE: 'https://form.jotform.com/YOUR_TEACHER_FORM_ID',

  /** Form filled by parents when submitting an absence / meeting request */
  PARENT_REQUEST: 'https://form.jotform.com/YOUR_PARENT_FORM_ID',
} as const;

export type JotFormKey = keyof typeof JOTFORMS;
