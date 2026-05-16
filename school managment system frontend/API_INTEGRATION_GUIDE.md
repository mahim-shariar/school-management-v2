# API Integration Guide

## Overview

This project is fully integrated with the School Management System backend API. All components are connected and ready to use.

## Base URL

**Production:** `https://school-management-project-n5r1.onrender.com`

## Implemented Features

### ✅ Authentication

- **Login**: POST `/api/auth/login/` - User authentication with email/password
- **Refresh Token**: POST `/api/auth/token/refresh/` - Get new access token
- **Get User**: GET `/api/auth/me/` - Fetch current logged-in user details
- **Logout**: Clears tokens from localStorage

**Test Credentials:**

```
Admin:    admin@school.com / admin123
Teacher:  teacher1@school.com / teacher123
Student:  student1@school.com / student123
Parent:   parent1@school.com / parent123
```

### ✅ Marks Management

- **Single Entry**: POST `/api/marks/`
  - Submit marks for one student
  - Requires: student ID, exam ID, subject ID, marks breakdown

- **Bulk Entry**: POST `/api/marks/bulk/`
  - Submit marks for multiple students at once
  - Used on TeacherMarksPage

### ✅ Results

- **My Results**: GET `/api/results/{examId}/my/`
  - Student views their own exam results
- **Section Results**: GET `/api/results/{examId}/section/{classLevel}/{section}/`
  - View all students' results in a section

- **Merit List**: GET `/api/results/{examId}/merit-list/`
  - School-wide merit list/ranking

- **Publish Results**: POST `/api/exams/{examId}/publish/`
  - Admin only - Make results visible to students

### ✅ Attendance

- **Mark Attendance**: POST `/api/attendance/mark/`
  - Record daily attendance with status (Present, Absent, Late)

- **My Attendance**: GET `/api/attendance/my/`
  - Student views their own attendance
  - Query params: `from_date`, `to_date` (YYYY-MM-DD format)

- **Child Attendance**: GET `/api/attendance/children/{childId}/`
  - Parent views child's attendance

- **Section Attendance**: GET `/api/attendance/section/{classLevel}/{section}/`
  - View all students' attendance for a date

- **Attendance Report**: GET `/api/attendance/report/`
  - Query params: `month`, `year`, `class_level`

## Component Usage

### StudentDashboard

```jsx
import { resultsApi, attendanceApi } from "../api";

// Get attendance for current month
const response = await attendanceApi.myAttendance({
  from_date: "2025-01-01",
  to_date: "2025-01-31",
});

// Get exam results
const results = await resultsApi.myResult(1);
```

### TeacherMarksPage

```jsx
import { marksApi } from "../api";

// Submit bulk marks
await marksApi.submitBulk({
  subject: 1,
  exam: 1,
  records: [
    {
      student_id: 5,
      marks_written: 70,
      marks_mcq: 20,
      marks_practical: 0,
    },
  ],
});
```

### TeacherAttendancePage

```jsx
import { attendanceApi } from "../api";

// Mark attendance
await attendanceApi.mark({
  class_level: 9,
  section: "A",
  date: "2025-08-20",
  records: [{ student_id: 5, status: "Present" }],
});
```

### AdminDashboard

```jsx
import { resultsApi } from "../api";

// Publish results
await resultsApi.publishResult(1);

// Get merit list
const merit = await resultsApi.meritList(1);
```

## Authentication Flow

1. **Login** → Receive `access_token` and `refresh_token`
2. **Store Tokens** → Saved in `localStorage`
3. **Auto-Attach** → `api.js` interceptor automatically adds `Authorization: Bearer {token}` header
4. **Refresh** → When token expires, use refresh token to get new access token
5. **Logout** → Clear tokens and redirect to login

## Error Handling

All API calls use try-catch blocks with user-friendly error messages:

```jsx
try {
  const response = await authApi.login({ email, password });
  // Success handling
} catch (err) {
  console.error("Login error:", err);
  setError("Invalid credentials. Check email and password.");
}
```

## File Structure

```
src/
├── api.js                    ← All API endpoints
├── context/
│   └── AuthContext.jsx       ← Authentication state & methods
├── components/
│   ├── NavBar.jsx            ← Navigation with user info & logout
│   └── LoadingSpinner.jsx    ← Loading indicator
├── pages/
│   ├── LoginPage.jsx         ← User login
│   ├── StudentDashboard.jsx  ← Student results & attendance
│   ├── TeacherMarksPage.jsx  ← Mark entry
│   ├── TeacherAttendancePage.jsx ← Attendance marking
│   └── AdminDashboard.jsx    ← Admin controls
└── routes/
    └── ProtectedRoute.jsx    ← Role-based route protection
```

## Environment Variables

Create `.env` file in project root:

```
VITE_API_BASE=https://school-management-project-n5r1.onrender.com
```

Or for local development:

```
VITE_API_BASE=http://localhost:8000
```

## API Endpoints Reference

| Endpoint                                 | Method | Auth | Description              |
| ---------------------------------------- | ------ | ---- | ------------------------ |
| `/api/auth/login/`                       | POST   | ✗    | User login               |
| `/api/auth/token/refresh/`               | POST   | ✗    | Refresh access token     |
| `/api/auth/me/`                          | GET    | ✓    | Get current user         |
| `/api/marks/`                            | POST   | ✓    | Submit single mark entry |
| `/api/marks/bulk/`                       | POST   | ✓    | Submit bulk marks        |
| `/api/results/{id}/my/`                  | GET    | ✓    | Get my results           |
| `/api/results/{id}/section/{cls}/{sec}/` | GET    | ✓    | Get section results      |
| `/api/results/{id}/merit-list/`          | GET    | ✗    | Get merit list           |
| `/api/exams/{id}/publish/`               | POST   | ✓    | Publish results          |
| `/api/attendance/mark/`                  | POST   | ✓    | Mark attendance          |
| `/api/attendance/my/`                    | GET    | ✓    | Get my attendance        |
| `/api/attendance/children/{id}/`         | GET    | ✓    | Get child's attendance   |
| `/api/attendance/section/{cls}/{sec}/`   | GET    | ✓    | Get section attendance   |
| `/api/attendance/report/`                | GET    | ✓    | Get attendance report    |

## Notes

- All dates should be in `YYYY-MM-DD` format
- All API calls include Authorization header automatically
- User data is stored in AuthContext after login
- Protected routes check user role before allowing access
- LoadingSpinner appears while data is fetching
