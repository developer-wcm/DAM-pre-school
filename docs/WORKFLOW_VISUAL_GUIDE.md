# 📱 Visual Workflow Guide - Admin & Principal Dashboards

## 🎯 COMPLETE USER JOURNEY MAP

```
                    ┌─────────────────────┐
                    │   APP OPENS         │
                    │   (Splash Screen)   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   LOGIN SCREEN      │
                    │                     │
                    │  📧 Email           │
                    │  🔒 Password        │
                    │                     │
                    │  [Log In]           │
                    │  [Google Sign-In]   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  CHECK USER ROLE    │
                    │  (from database)    │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌───────────────────┐         ┌───────────────────┐
    │  ADMIN/PRINCIPAL  │         │  TEACHER/PARENT   │
    │  (No Code)        │         │  (Code Required)  │
    └─────────┬─────────┘         └─────────┬─────────┘
              │                             │
              │                             ▼
              │                  ┌───────────────────┐
              │                  │  ENTER 6-DIGIT    │
              │                  │  CODE SCREEN      │
              │                  │                   │
              │                  │  [_][_][_][_][_][_]│
              │                  │                   │
              │                  │  [Apply]          │
              │                  └─────────┬─────────┘
              │                            │
              └──────────┬─────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐           ┌─────────────────┐
│ ADMIN DASHBOARD │           │PRINCIPAL DASHBOARD│
│                 │           │                 │
│ 5 TABS:         │           │ 5 TABS:         │
│ • Dashboard     │           │ • Dashboard     │
│ • Users         │           │ • Staff         │
│ • Announce      │           │ • Announce      │
│ • Reports       │           │ • Reports       │
│ • Settings      │           │ • Profile       │
└─────────────────┘           └─────────────────┘
```

---

## 🏢 ADMIN DASHBOARD - TAB NAVIGATION

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                          │
└─────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│Dashboard │  Users   │ Announce │ Reports  │ Settings │
│    🏠    │   👥     │   📢     │   📊     │   ⚙️     │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘
     │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼

┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Overview │ │Approve/ │ │Create & │ │View     │ │School   │
│Stats    │ │Reject   │ │Manage   │ │Analytics│ │Info &   │
│         │ │New      │ │School   │ │         │ │Holidays │
│Quick    │ │Users    │ │Announce │ │Student  │ │         │
│Actions  │ │         │ │ments    │ │Financial│ │Academic │
│         │ │Filter   │ │         │ │Staff    │ │Settings │
│Recent   │ │by       │ │Target   │ │Reports  │ │         │
│Activity │ │Status   │ │Audience │ │         │ │Add/Del  │
│         │ │         │ │         │ │Export   │ │Holidays │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## 👨‍🎓 PRINCIPAL DASHBOARD - TAB NAVIGATION

```
┌─────────────────────────────────────────────────────────────┐
│                   PRINCIPAL DASHBOARD                        │
└─────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│Dashboard │  Staff   │ Announce │ Reports  │ Profile  │
│    🏠    │   👥     │   📢     │   📊     │   👤     │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘
     │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼

┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Overview │ │View All │ │Create & │ │View     │ │Personal │
│Stats    │ │Staff    │ │Manage   │ │Analytics│ │Info     │
│         │ │Members  │ │School   │ │         │ │         │
│Quick    │ │         │ │Announce │ │Student  │ │Profile  │
│Actions  │ │Filter   │ │ments    │ │Financial│ │Stats    │
│         │ │by Role  │ │         │ │Staff    │ │         │
│Class    │ │         │ │Target   │ │Reports  │ │Settings │
│Overview │ │Monitor  │ │Audience │ │         │ │Menu     │
│         │ │Status   │ │         │ │Export   │ │         │
│Recent   │ │(Active/ │ │         │ │         │ │Logout   │
│Activity │ │On Leave)│ │         │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## 🔄 ANNOUNCEMENT CREATION FLOW

```
ADMIN/PRINCIPAL SIDE:
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Click [+] Button on Announcements Tab               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Fill Modal Form                                      │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │  NEW ANNOUNCEMENT                      [X]      │        │
│  │                                                  │        │
│  │  Title:                                          │        │
│  │  [Holiday Notice - Feb 19____________]          │        │
│  │                                                  │        │
│  │  Message:                                        │        │
│  │  [School will remain closed on______]          │        │
│  │  [February 19th for a public holiday]          │        │
│  │  [_________________________________]          │        │
│  │                                                  │        │
│  │  Send To:                                        │        │
│  │  ⦿ All Parents                                  │        │
│  │  ○ Specific Class                               │        │
│  │                                                  │        │
│  │  [📤 Post Announcement]                         │        │
│  └─────────────────────────────────────────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Save to Database                                     │
│                                                               │
│  INSERT INTO announcements (                                 │
│    created_by, title, body, target_audience                  │
│  ) VALUES (                                                   │
│    'admin_id',                                               │
│    'Holiday Notice - Feb 19',                                │
│    'School will remain closed...',                           │
│    'all_parents'                                             │
│  )                                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Send Push Notification                               │
│                                                               │
│  📱 → All Parent Devices                                     │
│  "New Announcement: Holiday Notice - Feb 19"                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
PARENT SIDE:
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Parent Receives & Views                              │
│                                                               │
│  📱 Notification appears on phone                            │
│  👆 Parent taps notification                                 │
│  📱 App opens to Announcements section                       │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 📢 Just now • by Admin                    🗑️   │        │
│  │                                                  │        │
│  │ Holiday Notice - Feb 19                         │        │
│  │ School will remain closed on February 19th      │        │
│  │ for a public holiday. Regular classes will      │        │
│  │ resume on February 20th.                        │        │
│  │                                                  │        │
│  │ [👥 All Parents]                                │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 💬 PARENT-TEACHER MESSAGING FLOW

```
PARENT SIDE:
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Parent Opens Messages                                │
│                                                               │
│  Messages Tab → Select Teacher                               │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 👩‍🏫 Ms. Priya Sharma                            │        │
│  │    Play Group Teacher                            │        │
│  │                                                  │        │
│  │ [Type your message here____________]            │        │
│  │                                                  │        │
│  │ [📎] [📷] [Send]                                │        │
│  └─────────────────────────────────────────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Message Sent to Database                             │
│                                                               │
│  1. Check/Create Conversation:                               │
│     SELECT * FROM conversations                              │
│     WHERE parent_id = 'xxx' AND teacher_id = 'yyy'          │
│                                                               │
│  2. Insert Message:                                          │
│     INSERT INTO messages (                                   │
│       conversation_id, sender_id, content                    │
│     )                                                         │
│                                                               │
│  3. Create Notification:                                     │
│     INSERT INTO notifications (                              │
│       user_id = 'teacher_id',                                │
│       type = 'new_message'                                   │
│     )                                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
TEACHER SIDE:
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Teacher Receives Notification                        │
│                                                               │
│  📱 "New message from Priya Kumar"                           │
│  👆 Teacher taps notification                                │
│  📱 App opens to Messages                                    │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 👩 Priya Kumar                          [1]     │        │
│  │ How is my child's progress?                     │        │
│  │ 2 min ago                                        │        │
│  └─────────────────────────────────────────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Teacher Opens Conversation                           │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 👩 Priya Kumar                                   │        │
│  │                                                  │        │
│  │ ┌──────────────────────────────────┐            │        │
│  │ │ How is my child's progress?      │ 2:30 PM    │        │
│  │ └──────────────────────────────────┘            │        │
│  │                                                  │        │
│  │                    ┌──────────────────────────┐ │        │
│  │         2:35 PM    │ Your child is doing      │ │        │
│  │                    │ great! Very active in    │ │        │
│  │                    │ class activities.        │ │        │
│  │                    └──────────────────────────┘ │        │
│  │                                                  │        │
│  │ [Type reply here_______________] [Send]         │        │
│  └─────────────────────────────────────────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Reply Sent Back to Parent                            │
│                                                               │
│  Parent receives notification and sees reply                 │
│  Conversation continues in real-time                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 USER APPROVAL WORKFLOW

```
NEW USER REGISTRATION:
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User Signs Up                                        │
│                                                               │
│  • Email: priya@example.com                                  │
│  • Password: ********                                        │
│  • Role: Parent                                              │
│  • Full Name: Priya Kumar                                    │
│                                                               │
│  [Sign Up]                                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Account Created (Pending Approval)                   │
│                                                               │
│  INSERT INTO profiles (                                      │
│    id, email, full_name, role, approved                      │
│  ) VALUES (                                                   │
│    'user_id', 'priya@example.com',                          │
│    'Priya Kumar', 'parent', false                           │
│  )                                                            │
│                                                               │
│  User sees: "Account Pending Approval" screen                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
ADMIN SIDE:
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Admin Sees Pending User                              │
│                                                               │
│  Users Tab → Pending Filter                                  │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 👩 Priya Kumar                          ✓  ✗    │        │
│  │    priya@example.com                            │        │
│  │    [parent] • 2 hours ago                       │        │
│  └─────────────────────────────────────────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ APPROVE (✓)      │          │ REJECT (✗)       │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│ UPDATE profiles  │          │ UPDATE profiles  │
│ SET approved =   │          │ SET approved =   │
│ true             │          │ false            │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│ Send             │          │ Send             │
│ Notification:    │          │ Notification:    │
│ "Account         │          │ "Account         │
│ Approved!"       │          │ Rejected"        │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         ▼                             ▼
USER SIDE:
┌──────────────────┐          ┌──────────────────┐
│ User can now     │          │ User cannot      │
│ login and        │          │ access the app   │
│ access app       │          │                  │
└──────────────────┘          └──────────────────┘
```

---

## 📊 REAL-TIME DATA SYNC

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE REAL-TIME                        │
└─────────────────────────────────────────────────────────────┘

ADMIN CREATES ANNOUNCEMENT:
┌──────────────┐
│ Admin Device │ ──┐
└──────────────┘   │
                   │
                   ▼
            ┌──────────────┐
            │   SUPABASE   │
            │   DATABASE   │
            └──────┬───────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ Parent App 1 │    │ Parent App 2 │
│ (Real-time   │    │ (Real-time   │
│  Update)     │    │  Update)     │
└──────────────┘    └──────────────┘

PARENT SENDS MESSAGE:
┌──────────────┐
│ Parent Device│ ──┐
└──────────────┘   │
                   │
                   ▼
            ┌──────────────┐
            │   SUPABASE   │
            │   DATABASE   │
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │ Teacher App  │
            │ (Real-time   │
            │  Update)     │
            └──────────────┘
```

---

## ✅ FEATURE CHECKLIST

### Admin Dashboard:
- [x] Dashboard overview with stats
- [x] User management (approve/reject)
- [x] Announcement creation
- [x] Reports and analytics
- [x] Settings and holidays
- [ ] Database integration
- [ ] Real-time updates
- [ ] Push notifications

### Principal Dashboard:
- [x] Dashboard overview with stats
- [x] Staff management
- [x] Class overview
- [x] Announcement creation
- [x] Reports and analytics
- [x] Profile management
- [ ] Database integration
- [ ] Real-time updates

### Communication:
- [x] Announcement UI (Admin/Principal)
- [ ] Announcement UI (Parent view)
- [ ] Messaging UI (Parent)
- [ ] Messaging UI (Teacher)
- [ ] Real-time messaging
- [ ] Push notifications
- [ ] File attachments

---

**All UI screens are complete and functional with demo data. Next step: Connect to Supabase database!**
