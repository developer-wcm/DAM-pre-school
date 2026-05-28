# Student Edit Feature

## Overview
The student edit functionality allows admins and principals to update student information directly from the Student Profile screen.

## Implementation

### Components Created
1. **EditStudentModal** (`components/EditStudentModal.tsx`)
   - Modal-based edit form
   - Validates all inputs before saving
   - Shows loading state during save
   - Success/error alerts

### Updated Files
1. **student-profile.tsx** (`app/(dashboard)/student-profile.tsx`)
   - Added edit modal state management
   - Connected edit button to open modal
   - Refreshes student data after successful edit

## Features

### Editable Fields
- **Full Name** (required)
- **Class** (required) - PG, PKG, JKG, SKG
- **Roll Number** (optional)
- **Date of Birth** (optional) - Format: YYYY-MM-DD
- **Gender** (optional) - Male, Female, Other
- **Status** (required) - Active, Inactive

### Validation
- Full name cannot be empty
- Class must be selected
- Date of birth must be in YYYY-MM-DD format if provided
- All fields are trimmed before saving

### User Experience
1. Click pencil icon in Student Profile header
2. Modal slides up from bottom
3. Edit fields as needed
4. Click "Save Changes" to update
5. Success alert shown
6. Profile automatically refreshes with new data

### UI Design
- **Modal Style**: Bottom sheet with rounded top corners
- **Form Layout**: Clean vertical form with labeled sections
- **Button Options**: Class, Gender, and Status use pill-style buttons
- **Colors**: Matches school theme (Dark Blue #1E3A5F, Gold #DAA520)
- **Responsive**: Works on all screen sizes

## Database
Updates the `students` table in Supabase with the following fields:
```sql
UPDATE students SET
  full_name = ?,
  class = ?,
  roll_number = ?,
  date_of_birth = ?,
  gender = ?,
  status = ?
WHERE id = ?
```

## Security
- Only authenticated users with proper school_id can edit students
- RLS policies on students table ensure data isolation
- Input validation prevents invalid data

## Usage

### For Admins/Principals
1. Navigate to Students screen
2. Tap on any student card
3. In Student Profile, tap the pencil icon (top right)
4. Edit the fields you want to change
5. Tap "Save Changes"
6. Confirm success message

### For Developers
```typescript
import EditStudentModal from '../../components/EditStudentModal';

// In your component
const [editModalVisible, setEditModalVisible] = useState(false);

<EditStudentModal
  visible={editModalVisible}
  student={studentData}
  onClose={() => setEditModalVisible(false)}
  onSuccess={refreshStudentData}
/>
```

## Future Enhancements
- Date picker for date of birth
- Photo upload
- Parent contact information editing
- Address editing with map integration
- Bulk edit for multiple students
- Edit history/audit log
- Permission-based field restrictions (e.g., only principal can change status)

## Testing Checklist
- [ ] Edit button opens modal
- [ ] All fields populate with current data
- [ ] Required field validation works
- [ ] Date format validation works
- [ ] Save updates database
- [ ] Profile refreshes after save
- [ ] Cancel closes modal without saving
- [ ] Loading state shows during save
- [ ] Error handling for network issues
- [ ] Works on Android and iOS
