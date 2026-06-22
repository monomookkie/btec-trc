# BTEC LMS — Blood Testing Education Center

Learning Management System for Blood Testing Education Center, National Blood Center, Thai Red Cross Society.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MariaDB (MySQL) |
| ORM | Prisma |
| Auth | JWT (stored in sessionStorage) |
| Deploy — Frontend | Vercel |
| Deploy — Backend | Railway |

---

## Project Structure

```
BTCE-LMS/
├── frontend/
│   └── src/
│       ├── App.jsx                   # Route definitions, auth guard
│       ├── main.jsx
│       ├── api/
│       │   └── index.js              # All API calls (fetch wrapper)
│       ├── hooks/
│       │   ├── useAuth.js            # Login, logout, token management
│       │   └── useToast.js           # Toast notification state
│       ├── components/
│       │   ├── Sidebar.jsx           # Navigation sidebar
│       │   ├── TopBar.jsx            # Top bar with page title
│       │   └── ui/
│       │       ├── Avatar.jsx        # User initials avatar
│       │       ├── Badge.jsx         # Status badge chip
│       │       ├── ConfirmDialog.jsx # Delete confirmation modal
│       │       ├── Icon.jsx          # SVG icon library
│       │       ├── Modal.jsx         # Generic modal wrapper
│       │       ├── Skeleton.jsx      # Skeleton loading screens
│       │       └── Toast.jsx         # Toast notification component
│       └── pages/
│           ├── auth/
│           │   └── LoginPage.jsx     # Login + Register form
│           ├── ProfilePage.jsx       # Edit profile, change password
│           ├── admin/
│           │   ├── AdminDashboard.jsx    # Overview stats + Announcement management
│           │   ├── CourseManagement.jsx  # Create/edit courses, materials, quiz, enroll users
│           │   ├── UsersPage.jsx         # User directory, create/edit/delete users
│           │   ├── CertificateEngine.jsx # View issued certs, external certs
│           │   ├── Reports.jsx           # Compliance report, training analytics
│           │   └── TrainingLogger.jsx    # Log offline training sessions
│           └── user/
│               ├── UserDashboard.jsx     # Welcome, announcements carousel, course progress
│               ├── BrowseCourses.jsx     # Course catalogue, materials, Post-Test quiz
│               ├── MyCertificates.jsx    # View & download course certificates
│               └── MyReport.jsx          # Personal training history
│
└── backend/
    ├── prisma/
    │   ├── schema.prisma             # Database schema
    │   └── seed.js                   # Sample data seed
    └── src/
        ├── server.js                 # Express app entry point
        ├── lib/
        │   └── prisma.js             # Prisma singleton client
        ├── middleware/
        │   └── auth.js               # JWT verify, requireAuth, requireAdmin
        └── routes/
            ├── auth.js               # POST /register, /login
            ├── users.js              # CRUD users, PUT /me (profile update)
            ├── courses.js            # CRUD courses + materials
            ├── enrollments.js        # Enroll, track progress, submit quiz, auto-issue cert
            ├── certificates.js       # View certs, manual issue, external certs
            ├── announcements.js      # CRUD announcements
            ├── reports.js            # Compliance + summary reports
            └── trainingLogs.js       # CRUD training logs + attendees
```

---

## Database Models

```
User              — id, name, email, password, role, dept, position, avatar
Course            — id, title, category, description, status, duration, passScore, questions
Material          — id, courseId, type, title, url, dataUrl, weight
Enrollment        — id, userId, courseId, progress, completedMaterials, quizPassed, score, completed
Certificate       — id, enrollmentId, userId, courseId, certNumber, score, issuedAt
TrainingLog       — id, title, date, trainer, location, duration, type, topics, doc
TrainingAttendee  — trainingId, userId
Announcement      — id, title, content, type, date, fileData, link
CertTemplate      — id, name, orgName, primaryColor, logoText, isDefault
ExternalCert      — id, userId, title, issuer, issuedAt, expiresAt, fileData
```

---

## Roles

| Role | Access |
|---|---|
| `ADMIN` | Full access — manage courses, users, certs, announcements, reports |
| `USER` | View courses, track progress, take quiz, download certificates |

---

## Certificate Flow

1. User enrolls in a course
2. User completes all materials (progress = 100%)
3. If course has Post-Test → user must pass quiz (score ≥ passScore)
4. System auto-issues certificate with cert number `BTEC-YYYY-MMDD-XXXX`
5. User can download certificate as PDF from My Certificates page

---

## Developer

This system was developed and is maintained by **Rapepan**.

| Field | Details |
|--------|---------|
| Role | Full-stack Developer |
| Email | rapepan23.rpp@gmail.com |
| GitHub | [@rapepan](https://github.com/rapepan) |
