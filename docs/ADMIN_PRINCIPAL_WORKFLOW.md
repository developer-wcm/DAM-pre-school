# Admin & Principal Dashboard - Complete Workflow Guide

## 📱 USER FLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                        APP LAUNCH                                │
│                     (app/index.tsx)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN SCREEN                                │
│                    (app/login.tsx)                               │
│  • Email/Password input                                          │
│  • Google Sign-In button                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              AUTHENTICATION CHECK                                │
│           (context/auth.tsx + Supabase)                          │
│  • Verify credentials                                            │
│  • Fetch user profile from database                              │
│  • Check user role (admin/principal/teacher/parent)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────────┐
│  ADMIN/PRINCIPAL │          │  TEACHER/PARENT      │
│  (No Code)       │          │  (Code Required)     │
└────────┬─────────┘          └──────────┬───────────┘
         │                               │
         │                               ▼
         │                    ┌──────────────────────┐
         │                    │   ENTER CODE SCREEN  │
         │                    │  (app/enter-code.tsx)│
         │                    │  • 6-digit code      │
         │                    │  • Verification      │
         │                    └──────────┬───────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────────┐
│  ADMIN DASHBOARD │          │ PRINCIPAL DASHBOARD  │
│  app/(admin)/    │          │  app/(principal)/    │
└──────────────────┘          └──────────────────────┘
```

---

## 🔐 AUTHENTICATION WORKFLOW

### Current Flow (Needs Update):
```
1. User enters email/password
2. Click "Log In" or "Continue with Google"
3. Navigate to enter-code screen
4. Enter 6-digit code
5. System checks code:
   - 123456 → Parent Dashboard
   - 654321 → Teacher Dashboard
6. Navigate to respective dashboard
```

### Planned Flow (After Update):
```
1. User enters email/password or uses Google
2. System authenticates with Supabase
3. Fetch user profile with role from database
4. Check role:
   
   IF role = 'admin' OR role = 'principal':
      → Skip code entry
      → Navigate directly to admin/principal dashboard
   
   ELSE IF role = 'teacher' OR role = 'parent':
      → Navigate to enter-code screen
      → Verify 6-digit code
      → Navigate to teacher/parent dashboard
```

---

## 👨‍💼 ADMIN DASHBOARD WORKFLOW

### Tab 1: Dashboard (Home)
```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                                    🔔       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 STATS OVERVIEW (4 Cards)                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Students │ │ Teachers │ │ Pending  │ │ Revenue  │      │
│  │   245    │ │    18    │ │    5     │ │  ₹2.4L   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                               │
│  ⚡ QUICK ACTIONS (4 Buttons)                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Approve  │ │   New    │ │   Add    │ │   View   │      │
│  │  Users   │ │Announce  │ │ Holiday  │ │ Reports  │      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│       │            │            │            │              │
│       ▼            ▼            ▼            ▼              │
│   Users Tab   Announce Tab  Settings Tab  Reports Tab      │
│                                                               │
│  📋 RECENT ACTIVITY                                          │
│  • New parent registered - 5 min ago                         │
│  • Fee payment received - 1 hour ago                         │
│  • Teacher marked attendance - 2 hours ago                   │
│  • New announcement posted - 3 hours ago                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**User Actions:**
- View overview statistics
- Click quick action buttons → Navigate to respective tabs
- View recent activity feed
- Click notification bell → View notifications

---

### Tab 2: Users Management
```
┌─────────────────────────────────────────────────────────────┐
│  USER MANAGEMENT                                             │
│  5 Pending                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FILTER TABS:                                                │
│  [ All (5) ] [ Pending (5) ] [ Approved (0) ]               │
│                                                               │
│  USER CARDS:                                                 │
│  ┌───────────────────────────────────────────────────┐      │
│  │ 👩 Priya Kumar                            ✓  ✗    │      │
│  │    priya@example.com                              │      │
│  │    [parent] • 2 hours ago                         │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │ 👨‍🏫 Rohan Mehta                          ✓  ✗    │      │
│  │    rohan@example.com                              │      │
│  │    [teacher] • 1 day ago                          │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**User Actions:**
1. **Filter Users**: Click tabs to filter by All/Pending/Approved
2. **Approve User**: 
   - Click ✓ button
   - Confirmation alert appears
   - User status changes to "Approved"
   - User can now access the app
3. **Reject User**:
   - Click ✗ button
   - Confirmation alert appears
   - User status changes to "Rejected"
   - User cannot access the app

**Database Operations:**
```sql
-- When approving a user
UPDATE profiles 
SET approved = true 
WHERE id = 'user_id';

-- When rejecting a user
UPDATE profiles 
SET approved = false 
WHERE id = 'user_id';
```

---

### Tab 3: Announcements
```
┌─────────────────────────────────────────────────────────────┐
│  ANNOUNCEMENTS                                      [+]      │
│  3 total announcements                                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ANNOUNCEMENT CARDS:                                         │
│  ┌───────────────────────────────────────────────────┐      │
│  │ 📢 2 hours ago • by Admin                    🗑️   │      │
│  │                                                    │      │
│  │ Holiday Notice - Feb 19                           │      │
│  │ School will remain closed on February 19th...     │      │
│  │                                                    │      │
│  │ [👥 All Parents]                                  │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**User Actions:**
1. **Create Announcement**: Click [+] button
   ```
   ┌─────────────────────────────────────────┐
   │  NEW ANNOUNCEMENT              ✕        │
   ├─────────────────────────────────────────┤
   │                                          │
   │  Title:                                  │
   │  [_____________________________]        │
   │                                          │
   │  Message:                                │
   │  [_____________________________]        │
   │  [_____________________________]        │
   │  [_____________________________]        │
   │                                          │
   │  Send To:                                │
   │  ⦿ All Parents                          │
   │  ○ Specific Class                       │
   │                                          │
   │  [📤 Post Announcement]                 │
   │                                          │
   └─────────────────────────────────────────┘
   ```
   - Fill in title and message
   - Select target audience
   - Click "Post Announcement"
   - Announcement is created and visible to parents

2. **Delete Announcement**: Click 🗑️ button
   - Confirmation alert appears
   - Announcement is deleted

**Database Operations:**
```sql
-- Create announcement
INSERT INTO announcements (created_by, title, body, target_audience)
VALUES ('admin_id', 'Holiday Notice', 'School will remain...', 'all_parents');

-- Delete announcement
DELETE FROM announcements WHERE id = 'announcement_id';

-- Parents fetch announcements
SELECT * FROM announcements 
WHERE target_audience = 'all_parents' 
ORDER BY created_at DESC;
```

---


### Tab 4: Reports
```
┌─────────────────────────────────────────────────────────────┐
│  REPORTS & ANALYTICS                            📥          │
│  View school performance metrics                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 QUICK STATS                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Students │ │ Teachers │ │   Fee    │ │   Avg    │      │
│  │   245    │ │    18    │ │Collection│ │Attendance│      │
│  │   +12 ↑  │ │   +2 ↑   │ │  94% ↑   │ │  92% ↓   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                               │
│  📁 REPORT CATEGORIES                                        │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 👥 Student Reports                         →    │        │
│  │ • Attendance Summary - 245 students             │        │
│  │ • Progress Reports - 8 classes                  │        │
│  │ • Enrollment Trends - Last 6 months             │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 💰 Financial Reports                       →    │        │
│  │ • Fee Collection - ₹2.4L this month             │        │
│  │ • Pending Payments - 12 students                │        │
│  │ • Revenue Analysis - Yearly                     │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**User Actions:**
- View quick statistics with trend indicators
- Browse report categories
- Click on individual reports to view details
- Click 📥 to export reports (future feature)

---

### Tab 5: Settings
```
┌─────────────────────────────────────────────────────────────┐
│  SETTINGS                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🏫 SCHOOL INFORMATION                                       │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 🏢 School Name                             →    │        │
│  │    DAM Pre-School                               │        │
│  │                                                  │        │
│  │ 📍 Address                                 →    │        │
│  │    Mumbai, India                                │        │
│  │                                                  │        │
│  │ 📞 Contact Number                          →    │        │
│  │    +91 98765 43210                              │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
│  📚 ACADEMIC SETTINGS                                        │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 📅 Academic Year                           →    │        │
│  │    2025-2026                                    │        │
│  │                                                  │        │
│  │ ⏰ School Timings                          →    │        │
│  │    9:00 AM - 3:00 PM                            │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
│  🎉 HOLIDAYS                                        [+]      │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 📅 Republic Day                    [Public] 🗑️  │        │
│  │    Jan 26, 2026                                 │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**User Actions:**
1. **Edit School Info**: Click → on any setting
   - Opens edit modal
   - Update information
   - Save changes

2. **Add Holiday**: Click [+] button
   ```
   ┌─────────────────────────────────────────┐
   │  ADD HOLIDAY                   ✕        │
   ├─────────────────────────────────────────┤
   │                                          │
   │  Holiday Name:                           │
   │  [_____________________________]        │
   │                                          │
   │  Date:                                   │
   │  [_____________________________]        │
   │                                          │
   │  [➕ Add Holiday]                       │
   │                                          │
   └─────────────────────────────────────────┘
   ```
   - Enter holiday name and date
   - Click "Add Holiday"
   - Holiday appears in list

3. **Delete Holiday**: Click 🗑️ button
   - Confirmation alert
   - Holiday is removed

**Database Operations:**
```sql
-- Add holiday
INSERT INTO holidays (name, date, type)
VALUES ('Independence Day', '2026-08-15', 'public');

-- Delete holiday
DELETE FROM holidays WHERE id = 'holiday_id';
```

---

## 👨‍🎓 PRINCIPAL DASHBOARD WORKFLOW

### Tab 1: Dashboard (Home)
```
┌─────────────────────────────────────────────────────────────┐
│  PRINCIPAL DASHBOARD                            🔔          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 STATS OVERVIEW                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Students │ │  Staff   │ │ Classes  │ │   Avg    │      │
│  │   245    │ │    22    │ │    8     │ │Attendance│      │
│  │          │ │          │ │          │ │   92%    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                               │
│  ⚡ QUICK ACTIONS                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   View   │ │   New    │ │   View   │ │    My    │      │
│  │  Staff   │ │Announce  │ │ Reports  │ │ Profile  │      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│       │            │            │            │              │
│       ▼            ▼            ▼            ▼              │
│   Staff Tab   Announce Tab  Reports Tab  Profile Tab       │
│                                                               │
│  📚 CLASS OVERVIEW                                           │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 📖 Play Group                                    │        │
│  │    Ms. Priya                                     │        │
│  │    👥 28 students  ✓ 96% attendance             │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 📖 Pre-KG                                        │        │
│  │    Ms. Anjali                                    │        │
│  │    👥 30 students  ✓ 93% attendance             │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
│  📋 RECENT ACTIVITY                                          │
│  • Teacher attendance marked - 1 hour ago                    │
│  • New parent registered - 2 hours ago                       │
│  • Fee collection update - 3 hours ago                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**User Actions:**
- View school overview statistics
- Click quick actions to navigate
- Monitor class-wise performance
- View recent school activities

---

### Tab 2: Staff Management
```
┌─────────────────────────────────────────────────────────────┐
│  STAFF MANAGEMENT                                            │
│  6 total staff members                                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FILTER TABS:                                                │
│  [ All (6) ] [ Teachers (4) ] [ Others (2) ]                │
│                                                               │
│  STAFF CARDS:                                                │
│  ┌───────────────────────────────────────────────────┐      │
│  │ 👩‍🏫 Ms. Priya Sharma                              │      │
│  │    priya@school.com                               │      │
│  │    [teacher] [📖 Play Group]                      │      │
│  │                                    ● Active    →  │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │ 👩‍🏫 Ms. Neha Gupta                    ⏰          │      │
│  │    neha@school.com                                │      │
│  │    [teacher] [📖 Senior KG]                       │      │
│  │                                 ⏰ On Leave    →  │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**User Actions:**
1. **Filter Staff**: Click tabs to filter by All/Teachers/Others
2. **View Staff Details**: Click on any staff card or → button
   - Shows full details in alert:
     - Name, Role, Email, Phone
     - Class assignment (for teachers)
     - Current status
3. **Monitor Status**: 
   - Green dot (●) = Active
   - Orange clock (⏰) = On Leave

**Database Query:**
```sql
-- Fetch all staff
SELECT * FROM profiles 
WHERE role IN ('teacher', 'accountant', 'admin')
ORDER BY role, full_name;

-- Fetch teachers only
SELECT * FROM profiles 
WHERE role = 'teacher'
ORDER BY full_name;
```

---

### Tab 3: Announcements
Same as Admin Dashboard - Principal can create and manage announcements

### Tab 4: Reports
Same as Admin Dashboard - Principal can view all reports

### Tab 5: Profile
```
┌─────────────────────────────────────────────────────────────┐
│  MY PROFILE                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│              ┌─────────────┐                                 │
│              │     👨‍💼     │ 📷                             │
│              └─────────────┘                                 │
│                                                               │
│           Dr. Rajesh Kumar                                   │
│              Principal                                       │
│                                                               │
│         245        │    22     │     8                       │
│       Students     │   Staff   │  Classes                    │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📋 PROFILE INFORMATION                                      │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 👤 Full Name                                     │        │
│  │    Dr. Rajesh Kumar                              │        │
│  │                                                  │        │
│  │ 📧 Email                                         │        │
│  │    principal@dampreschool.com                    │        │
│  │                                                  │        │
│  │ 📞 Phone                                         │        │
│  │    +91 98765 43210                               │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
│  ⚙️ SETTINGS & SUPPORT                                       │
│  ┌─────────────────────────────────────────────────┐        │
│  │ ⚙️  Account Settings                        →   │        │
│  │ 🔒 Change Password                          →   │        │
│  │ 🔔 Notifications                            →   │        │
│  │ ❓ Help & Support                           →   │        │
│  │ ℹ️  About                                    →   │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │         🚪 Logout                                │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**User Actions:**
1. **Edit Avatar**: Click 📷 button (future feature)
2. **View Profile Stats**: See total students, staff, classes
3. **Access Settings**: Click any settings option
4. **Logout**: Click logout button
   - Confirmation alert
   - Clear session
   - Navigate to login screen

---


## 🔄 COMMUNICATION WORKFLOW

### School → Parents (Announcements)

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN/PRINCIPAL                           │
│                                                               │
│  1. Click "New Announcement" button                          │
│  2. Fill in announcement details:                            │
│     • Title: "Holiday Notice - Feb 19"                       │
│     • Message: "School will remain closed..."                │
│     • Target: All Parents                                    │
│  3. Click "Post Announcement"                                │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│                                                               │
│  INSERT INTO announcements (                                 │
│    created_by = 'admin_id',                                  │
│    title = 'Holiday Notice - Feb 19',                        │
│    body = 'School will remain closed...',                    │
│    target_audience = 'all_parents'                           │
│  )                                                            │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    PUSH NOTIFICATION                         │
│                   (Firebase Cloud Messaging)                 │
│                                                               │
│  Send notification to all parent devices:                    │
│  "New Announcement: Holiday Notice - Feb 19"                 │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    PARENT APP                                │
│                                                               │
│  1. Receives push notification                               │
│  2. Opens app → Announcements section                        │
│  3. Sees new announcement card:                              │
│     ┌─────────────────────────────────────┐                 │
│     │ 📢 Just now • by Admin              │                 │
│     │                                      │                 │
│     │ Holiday Notice - Feb 19             │                 │
│     │ School will remain closed on        │                 │
│     │ February 19th for a public holiday. │                 │
│     │                                      │                 │
│     │ [👥 All Parents]                    │                 │
│     └─────────────────────────────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### Parent → Teacher (Messaging)

```
┌─────────────────────────────────────────────────────────────┐
│                    PARENT APP                                │
│                                                               │
│  1. Navigate to "Messages" or "Contact Teacher"              │
│  2. Select teacher (e.g., Ms. Priya - Play Group)           │
│  3. Type message: "How is my child's progress?"             │
│  4. Click Send                                               │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│                                                               │
│  Step 1: Check if conversation exists                        │
│  SELECT * FROM conversations                                 │
│  WHERE parent_id = 'parent_id'                               │
│    AND teacher_id = 'teacher_id'                             │
│                                                               │
│  Step 2: If not exists, create conversation                  │
│  INSERT INTO conversations (parent_id, teacher_id)           │
│  VALUES ('parent_id', 'teacher_id')                          │
│                                                               │
│  Step 3: Insert message                                      │
│  INSERT INTO messages (                                      │
│    conversation_id = 'conv_id',                              │
│    sender_id = 'parent_id',                                  │
│    content = 'How is my child's progress?'                   │
│  )                                                            │
│                                                               │
│  Step 4: Create notification for teacher                     │
│  INSERT INTO notifications (                                 │
│    user_id = 'teacher_id',                                   │
│    type = 'new_message',                                     │
│    reference_id = 'message_id'                               │
│  )                                                            │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    PUSH NOTIFICATION                         │
│                                                               │
│  Send to teacher's device:                                   │
│  "New message from Priya Kumar"                              │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    TEACHER APP                               │
│                                                               │
│  1. Receives notification                                    │
│  2. Opens Messages section                                   │
│  3. Sees conversation with unread badge:                     │
│     ┌─────────────────────────────────────┐                 │
│     │ 👩 Priya Kumar              [1]     │                 │
│     │ How is my child's progress?         │                 │
│     │ 2 min ago                            │                 │
│     └─────────────────────────────────────┘                 │
│  4. Opens conversation                                       │
│  5. Types reply: "Your child is doing great!"               │
│  6. Clicks Send                                              │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│                                                               │
│  INSERT INTO messages (                                      │
│    conversation_id = 'conv_id',                              │
│    sender_id = 'teacher_id',                                 │
│    content = 'Your child is doing great!'                    │
│  )                                                            │
│                                                               │
│  UPDATE messages                                             │
│  SET is_read = true                                          │
│  WHERE conversation_id = 'conv_id'                           │
│    AND sender_id = 'parent_id'                               │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    PARENT APP                                │
│                                                               │
│  Receives notification and sees reply in conversation        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Admin    │  │ Principal  │  │   Parent   │            │
│  │ Dashboard  │  │ Dashboard  │  │    App     │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │                │                │                    │
└────────┼────────────────┼────────────────┼────────────────────┘
         │                │                │
         └────────────────┴────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    AUTH CONTEXT                               │
│  • User authentication                                        │
│  • Session management                                         │
│  • Role-based routing                                         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  SUPABASE CLIENT                              │
│  • API calls                                                  │
│  • Real-time subscriptions                                    │
│  • File uploads                                               │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  SUPABASE BACKEND                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │     Auth     │  │   Storage    │      │
│  │   Database   │  │   Service    │  │   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  • profiles          • JWT tokens      • File uploads        │
│  • announcements     • OAuth           • Images              │
│  • conversations     • Sessions        • Documents           │
│  • messages                                                   │
│  • notifications                                              │
│  • holidays                                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 KEY FEATURES SUMMARY

### Admin Dashboard Features:
✅ **User Management**
- Approve/reject new users
- View user details
- Filter by status

✅ **Announcements**
- Create school-wide announcements
- Target specific audiences
- Delete announcements

✅ **Reports & Analytics**
- Student reports
- Financial reports
- Staff reports
- Communication metrics

✅ **Settings**
- School information
- Academic settings
- Holiday management

### Principal Dashboard Features:
✅ **Staff Management**
- View all staff members
- Monitor staff status
- Filter by role

✅ **Class Overview**
- Monitor all classes
- View teacher assignments
- Track attendance

✅ **Announcements**
- Same as admin

✅ **Reports**
- Same as admin

✅ **Profile Management**
- Personal profile
- Settings access
- Logout

---

## 🚀 NEXT IMPLEMENTATION STEPS

### Step 1: Update Authentication (Priority)
```typescript
// In context/auth.tsx
async function signInWithEmail(email: string, password: string) {
  // 1. Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) return { error: error.message };
  
  // 2. Fetch user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  // 3. Route based on role
  if (profile.role === 'admin') {
    router.replace('/(admin)');
  } else if (profile.role === 'principal') {
    router.replace('/(principal)');
  } else {
    // Teacher/Parent need code verification
    router.push('/enter-code');
  }
}
```

### Step 2: Connect Announcements to Database
```typescript
// In app/(admin)/announcements.tsx
const handleCreateAnnouncement = async () => {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      created_by: user.id,
      title: title,
      body: body,
      target_audience: targetAudience
    });
  
  if (!error) {
    Alert.alert('Success', 'Announcement posted!');
    // Refresh announcements list
  }
};
```

### Step 3: Build Parent Announcements View
```typescript
// In app/(parent)/announcements.tsx
const fetchAnnouncements = async () => {
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('target_audience', 'all_parents')
    .order('created_at', { ascending: false });
  
  setAnnouncements(data);
};
```

### Step 4: Build Messaging System
- Create conversation UI
- Implement real-time messaging
- Add file attachments
- Push notifications

---

## 📱 DEMO CREDENTIALS

```
Admin:
Email: admin@dampreschool.com
Password: admin123
Code: Not required

Principal:
Email: principal@dampreschool.com
Password: principal123
Code: Not required

Teacher:
Email: teacher@dampreschool.com
Password: teacher123
Code: 654321

Parent:
Email: parent@dampreschool.com
Password: parent123
Code: 123456
```

---

## ✅ WORKFLOW CHECKLIST

- [x] Admin dashboard UI created
- [x] Principal dashboard UI created
- [x] Database schema designed
- [x] Demo data implemented
- [ ] Authentication flow updated
- [ ] Database integration
- [ ] Real-time subscriptions
- [ ] Push notifications
- [ ] File uploads
- [ ] Testing with real data

---

**This workflow document shows the complete user journey and data flow for Admin and Principal dashboards. All UI screens are ready and working with demo data. The next step is database integration!**
