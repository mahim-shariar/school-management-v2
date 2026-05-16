# Testing Checklist

## Quick Start

1. **Ensure .env is set**:

   ```
   VITE_API_BASE=https://school-management-project-n5r1.onrender.com
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

3. **Open browser**: `http://localhost:5173`

---

## Test Scenarios

### 1️⃣ Authentication Testing

#### Test Login (Student)

- [ ] Go to login page
- [ ] Enter: `student1@school.com` / `student123`
- [ ] Should redirect to `/student` dashboard
- [ ] NavBar shows username and student role

#### Test Login (Teacher)

- [ ] Go to login page
- [ ] Enter: `teacher1@school.com` / `teacher123`
- [ ] Should redirect to `/teacher/marks`
- [ ] NavBar shows username and teacher role

#### Test Login (Admin)

- [ ] Go to login page
- [ ] Enter: `admin@school.com` / admin123`
- [ ] Should redirect to `/admin` dashboard
- [ ] NavBar shows username and admin role

#### Test Logout

- [ ] Click "Logout" button in NavBar
- [ ] Should be redirected to login page
- [ ] Tokens should be cleared from localStorage

#### Test Invalid Credentials

- [ ] Enter wrong email/password
- [ ] Should show error message
- [ ] Should stay on login page

---

### 2️⃣ Student Dashboard Testing

#### As Student (student1@school.com)

- [ ] Dashboard loads without errors
- [ ] Profile section shows:
  - [ ] Username: student1
  - [ ] Email: student1@school.com
  - [ ] Role: student
- [ ] Attendance Summary displays:
  - [ ] Total days
  - [ ] Present days
  - [ ] Absent days
  - [ ] Late days
  - [ ] Percentage
- [ ] Recent GPA displays value or "--"
- [ ] Exam Results table shows:
  - [ ] Subject names
  - [ ] GPA/Grade points
  - [ ] Total marks
  - [ ] Letter grades

---

### 3️⃣ Teacher Marks Entry Testing

#### As Teacher (teacher1@school.com)

- [ ] Navigate to `/teacher/marks`
- [ ] Page shows dropdowns for:
  - [ ] Section (9A, 9B, 10A)
  - [ ] Exam (Half-Yearly 2025, Annual 2025)
  - [ ] Subject (Bangla, English, Mathematics, Physics, Chemistry)

#### Enter Marks

- [ ] Fill in marks for students:
  - [ ] Written marks (0-75)
  - [ ] MCQ marks (0-25)
  - [ ] Practical marks (0-25)
- [ ] Click "Submit Marks"
- [ ] Should show success message: "Marks submitted successfully."
- [ ] Form fields should clear after submission
- [ ] On error, should show error message

---

### 4️⃣ Teacher Attendance Testing

#### As Teacher (teacher1@school.com)

- [ ] Navigate to `/teacher/attendance`
- [ ] Page shows:
  - [ ] Section dropdown
  - [ ] Date picker (defaults to today)
- [ ] Select students and mark attendance:
  - [ ] Present
  - [ ] Absent
  - [ ] Late
- [ ] Click "Save Attendance"
- [ ] Should show success message
- [ ] On error, should show error message

---

### 5️⃣ Admin Dashboard Testing

#### As Admin (admin@school.com)

- [ ] Navigate to `/admin` dashboard
- [ ] Summary cards display:
  - [ ] Total Students (from merit list)
  - [ ] Attendance Rate
  - [ ] Average GPA
  - [ ] Published Exams
- [ ] "Publish Results" button present
- [ ] Click "Publish Results":
  - [ ] Should show success/failure alert
  - [ ] Results become visible to students

---

### 6️⃣ Protected Routes Testing

#### Unauthorized Access

- [ ] Try accessing `/student` while logged out → Redirects to `/`
- [ ] Try accessing `/teacher/marks` while logged out → Redirects to `/`
- [ ] Try accessing `/admin` while logged out → Redirects to `/`

#### Role-Based Protection

- [ ] Student tries to access `/teacher/marks` → Redirects to `/`
- [ ] Teacher tries to access `/admin` → Redirects to `/`
- [ ] Admin tries to access `/student` → Redirects to `/`

---

### 7️⃣ Error Handling Testing

#### Network Errors

- [ ] Disconnect internet/disable backend
- [ ] Try performing any action
- [ ] Should show error message (not crash)
- [ ] Should console log error details

#### Invalid Data

- [ ] Submit form with missing required fields
- [ ] Check backend validation messages

---

## Browser DevTools Checks

### Network Tab

- [ ] All API calls to correct endpoint
- [ ] Authorization header present: `Authorization: Bearer {token}`
- [ ] Request/Response status codes correct (200, 201, 400, 401)
- [ ] No CORS errors

### Console Tab

- [ ] No JavaScript errors
- [ ] API errors properly logged
- [ ] No warnings about missing dependencies

### Application Tab (Storage)

- [ ] localStorage contains:
  - [ ] `accessToken`
  - [ ] `refreshToken`
- [ ] Tokens clear after logout
- [ ] New tokens on login/refresh

---

## API Response Validation

### Login Response Structure

```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {
    "id": 5,
    "username": "student1",
    "email": "student1@school.com",
    "role": "student"
  }
}
```

### Attendance Response Structure

```json
{
  "records": [{ "date": "2025-08-20", "status": "Present" }],
  "summary": {
    "total_days": 20,
    "present": 18,
    "absent": 1,
    "late": 1,
    "percentage": 90
  }
}
```

### Results Response Structure

```json
{
  "student_name": "Student1 Rahman",
  "gpa": 5.0,
  "total_marks": 590,
  "class_position": 1,
  "is_passed": true,
  "marks": [...]
}
```

---

## Troubleshooting

| Issue                 | Solution                                                     |
| --------------------- | ------------------------------------------------------------ |
| 401 Unauthorized      | Token expired or invalid. Clear localStorage and login again |
| 404 Not Found         | Check API base URL in .env                                   |
| CORS Error            | Ensure backend allows requests from frontend URL             |
| Blank/Loading forever | Check browser console for errors. Verify API is running      |
| Form won't submit     | Check DevTools Network tab for failed requests               |
| Logout not working    | Clear localStorage manually, then refresh                    |

---

## Success Criteria

✅ All 14 API endpoints properly integrated
✅ Authentication flow working (login/logout/refresh)
✅ All pages load without console errors
✅ Error messages display user-friendly messages
✅ Authorization header auto-attached to all requests
✅ Protected routes prevent unauthorized access
✅ Form data properly formats before API calls
✅ Success/error feedback provided to user

---

**Last Updated**: May 12, 2026
