# 🏫 DAM Pre-School - Complete Organization Chart

## 📊 ORGANIZATIONAL HIERARCHY

```
                    ┌─────────────────────┐
                    │   SCHOOL BOARD      │
                    │   (Management)      │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌───────────────────┐         ┌───────────────────┐
    │   👨‍💼 ADMIN        │         │  👨‍🎓 PRINCIPAL     │
    │   (Mr. Sharma)    │         │  (Dr. Rajesh)     │
    │                   │         │                   │
    │  OPERATIONS &     │         │  ACADEMICS &      │
    │  ADMINISTRATION   │         │  LEADERSHIP       │
    └─────────┬─────────┘         └─────────┬─────────┘
              │                             │
              │                             │
    ┌─────────┴─────────┐         ┌─────────┴─────────┐
    │                   │         │                   │
    ▼                   ▼         ▼                   ▼
┌─────────┐      ┌─────────┐  ┌─────────┐      ┌─────────┐
│ Parents │      │  Fees   │  │Teachers │      │ Classes │
│ (Users) │      │ System  │  │ (Staff) │      │(8 total)│
└─────────┘      └─────────┘  └─────────┘      └─────────┘
    │                              │                  │
    │                              │                  │
    ▼                              ▼                  ▼
┌─────────┐                   ┌─────────┐      ┌─────────┐
│   245   │                   │   18    │      │   245   │
│Students │                   │Teachers │      │Students │
└─────────┘                   └─────────┘      └─────────┘
```

---

## 👥 ROLE DISTRIBUTION

### 🏢 ADMINISTRATIVE SIDE (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│                    👨‍💼 ADMIN                                 │
│                  (Mr. Sharma)                                │
│           Administrative Officer                             │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │  USER   │    │ SYSTEM  │    │  FEE    │
    │APPROVAL │    │SETTINGS │    │MANAGEMENT│
    └─────────┘    └─────────┘    └─────────┘
         │               │               │
         ▼               ▼               ▼
    • Parents      • School Info   • Collection
    • Teachers     • Holidays      • Reports
    • Accountant   • Academic Yr   • Tracking
```

### 🎓 ACADEMIC SIDE (Principal)

```
┌─────────────────────────────────────────────────────────────┐
│                  👨‍🎓 PRINCIPAL                               │
│                (Dr. Rajesh Kumar)                            │
│                School Principal                              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │  STAFF  │    │ CLASSES │    │ACADEMIC │
    │MANAGEMENT│    │MONITORING│   │DECISIONS│
    └─────────┘    └─────────┘    └─────────┘
         │               │               │
         ▼               ▼               ▼
    • 18 Teachers  • 8 Classes    • Curriculum
    • 1 Accountant • Attendance   • Standards
    • Performance  • Progress     • Quality
```

---

## 🔄 WORKFLOW INTERACTION

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    NEW PARENT JOINS                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ SIGN UP     │
                  │ (Parent)    │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ PENDING     │
                  │ APPROVAL    │
                  └──────┬──────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   👨‍💼 ADMIN REVIEWS    │
            │   Approves/Rejects     │
            └────────┬───────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌─────────┐           ┌─────────┐
    │APPROVED │           │REJECTED │
    └────┬────┘           └─────────┘
         │
         ▼
    ┌─────────┐
    │ PARENT  │
    │ ACCESSES│
    │   APP   │
    └────┬────┘
         │
         ▼
    ┌─────────────────────────────────┐
    │ Can view:                        │
    │ • Child's progress               │
    │ • Announcements (from both)      │
    │ • Fee status                     │
    │ • Message teachers               │
    └──────────────────────────────────┘
```

### Teacher Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   NEW TEACHER JOINS                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   👨‍💼 ADMIN CREATES    │
            │   • User account       │
            │   • Sets role=teacher  │
            │   • Approves account   │
            └────────┬───────────────┘
                     │
                     ▼
            ┌────────────────────────┐
            │  👨‍🎓 PRINCIPAL ASSIGNS │
            │  • Assigns class       │
            │  • Provides training   │
            │  • Sets expectations   │
            └────────┬───────────────┘
                     │
                     ▼
            ┌────────────────────────┐
            │   TEACHER ACTIVE       │
            │   • Teaches class      │
            │   • Marks attendance   │
            │   • Updates progress   │
            │   • Messages parents   │
            └────────────────────────┘
```

---

## 📱 APP ACCESS LEVELS

```
┌─────────────────────────────────────────────────────────────┐
│                    APP USER TYPES                            │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   👨‍💼 ADMIN   │  │ 👨‍🎓 PRINCIPAL │  │ 👩‍🏫 TEACHER  │  │  👨‍👩‍👧 PARENT │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       │                 │                 │                 │
   NO CODE          NO CODE          6-DIGIT CODE      6-DIGIT CODE
   REQUIRED         REQUIRED         REQUIRED          REQUIRED
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   ADMIN      │  │  PRINCIPAL   │  │   TEACHER    │  │   PARENT     │
│  DASHBOARD   │  │  DASHBOARD   │  │  DASHBOARD   │  │  DASHBOARD   │
│              │  │              │  │              │  │              │
│ • Users      │  │ • Staff      │  │ • My Class   │  │ • Child Info │
│ • Settings   │  │ • Classes    │  │ • Attendance │  │ • Fees       │
│ • Holidays   │  │ • Reports    │  │ • Progress   │  │ • Messages   │
│ • Fees       │  │ • Profile    │  │ • Profile    │  │ • Academic   │
│ • Announce   │  │ • Announce   │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🎯 DECISION MAKING AUTHORITY

```
DECISION TYPE                WHO DECIDES?
─────────────────────────────────────────────────────────
User Approvals               👨‍💼 Admin
System Settings              👨‍💼 Admin
Holiday Calendar             👨‍💼 Admin
Fee Structure                👨‍💼 Admin
─────────────────────────────────────────────────────────
Teacher Assignments          👨‍🎓 Principal
Class Management             👨‍🎓 Principal
Curriculum Decisions         👨‍🎓 Principal
Academic Standards           👨‍🎓 Principal
─────────────────────────────────────────────────────────
Announcements                👨‍💼 Admin OR 👨‍🎓 Principal
Reports (View)               👨‍💼 Admin AND 👨‍🎓 Principal
Parent Communication         👨‍💼 Admin AND 👨‍🎓 Principal
─────────────────────────────────────────────────────────
```

---

## 📊 DATA FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ profiles │  │announcements│ │ messages │  │ holidays │   │
│  └────┬─────┘  └─────┬──────┘  └────┬─────┘  └────┬─────┘   │
└───────┼──────────────┼──────────────┼─────────────┼─────────┘
        │              │              │             │
        │              │              │             │
┌───────┼──────────────┼──────────────┼─────────────┼─────────┐
│       │              │              │             │          │
│       ▼              ▼              ▼             ▼          │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │  ADMIN  │   │PRINCIPAL│   │ TEACHER │   │ PARENT  │    │
│  │         │   │         │   │         │   │         │    │
│  │ • CRUD  │   │ • Read  │   │ • Read  │   │ • Read  │    │
│  │ • Approve│  │ • Create│   │ • Create│   │ • Create│    │
│  │ • Delete │   │ • Update│   │ • Update│   │         │    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
│                                                               │
│              DIFFERENT PERMISSIONS                           │
│              DIFFERENT ACCESS LEVELS                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏫 SCHOOL STRUCTURE

```
DAM PRE-SCHOOL
├── MANAGEMENT TEAM
│   ├── 👨‍💼 Admin (Mr. Sharma)
│   │   └── Handles: Operations, Users, Settings, Fees
│   │
│   └── 👨‍🎓 Principal (Dr. Rajesh Kumar)
│       └── Handles: Academics, Staff, Classes, Quality
│
├── TEACHING STAFF (18 Teachers)
│   ├── Play Group (2 teachers)
│   │   ├── Ms. Priya Sharma
│   │   └── Ms. Sneha Patel
│   │
│   ├── Pre-KG (2 teachers)
│   │   └── Ms. Anjali Mehta
│   │
│   ├── Junior KG (2 teachers)
│   │   └── Ms. Kavita Singh
│   │
│   └── Senior KG (2 teachers)
│       └── Ms. Neha Gupta
│
├── SUPPORT STAFF
│   └── 👨‍💼 Accountant (Mr. Rohan Kumar)
│       └── Reports to: Admin
│
└── STUDENTS (245 total)
    ├── Play Group: 28 students
    ├── Pre-KG: 30 students
    ├── Junior KG: 32 students
    └── Senior KG: 30 students
```

---

## 🔐 SECURITY & ACCESS

```
ROLE          LOGIN METHOD        CODE REQUIRED    DASHBOARD
─────────────────────────────────────────────────────────────
Admin         Email/Google        ❌ No            Admin Dashboard
Principal     Email/Google        ❌ No            Principal Dashboard
Teacher       Email/Google        ✅ Yes (654321)  Teacher Dashboard
Parent        Email/Google        ✅ Yes (123456)  Parent Dashboard
Accountant    Email/Google        ✅ Yes           Accountant Dashboard
```

---

## ✅ SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  👨‍💼 ADMIN                          👨‍🎓 PRINCIPAL           │
│  ═══════                          ═══════════               │
│                                                               │
│  • Different Person               • Different Person         │
│  • Different Role                 • Different Role           │
│  • Different Dashboard            • Different Dashboard      │
│  • Different Permissions          • Different Permissions    │
│                                                               │
│  ADMIN = Office Manager           PRINCIPAL = School Leader  │
│  Focus: Operations                Focus: Academics           │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │         BOTH WORK TOGETHER                       │        │
│  │         BUT HAVE SEPARATE JOBS                   │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

**This organization chart shows the complete school structure with Admin and Principal as two separate people with distinct roles and responsibilities.**
