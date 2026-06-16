export const JOTFORMS = {
  TEACHER_LEAVE: 'https://forms.gle/b1kaZ3QXxbvu3Q3x9',
  PARENT_REQUEST: 'https://forms.gle/b1kaZ3QXxbvu3Q3x9',
} as const;

export type JotFormKey = keyof typeof JOTFORMS;
