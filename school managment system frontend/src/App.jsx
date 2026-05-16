import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import StudentAttendancePage from "./pages/StudentAttendancePage";
import StudentProgressPage from "./pages/StudentProgressPage";
import StudentAssignmentsPage from "./pages/StudentAssignmentsPage";
import ParentDashboard from "./pages/ParentDashboard";
import TeacherMarksPage from "./pages/TeacherMarksPage";
import TeacherAttendancePage from "./pages/TeacherAttendancePage";
import TeacherResultsPage from "./pages/TeacherResultsPage";
import TeacherGradeBookPage from "./pages/TeacherGradeBookPage";
import TeacherAssignmentsPage from "./pages/TeacherAssignmentsPage";
import AttendanceReportPage from "./pages/AttendanceReportPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminSubjectsPage from "./pages/AdminSubjectsPage";
import AdminParentLinkPage from "./pages/AdminParentLinkPage";
import AdminTeacherClassPage from "./pages/AdminTeacherClassPage";
import AdminTimetablePage from "./pages/AdminTimetablePage";
import AdminSchoolSettingsPage from "./pages/AdminSchoolSettingsPage";
import NoticeBoardPage from "./pages/NoticeBoardPage";
import TimetablePage from "./pages/TimetablePage";
import FeeManagementPage from "./pages/FeeManagementPage";
import AcademicCalendarPage from "./pages/AcademicCalendarPage";
import LibraryPage from "./pages/LibraryPage";
import LeavePage from "./pages/LeavePage";
import TransportPage from "./pages/TransportPage";
import ExamSchedulePage from "./pages/ExamSchedulePage";
import SyllabusPage from "./pages/SyllabusPage";
import PublicSchoolPage from "./pages/PublicSchoolPage";
import AdminWebsitePage from "./pages/AdminWebsitePage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/school" element={<PublicSchoolPage />} />

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={["student"]}><StudentAttendancePage /></ProtectedRoute>} />
        <Route path="/student/progress" element={<ProtectedRoute allowedRoles={["student"]}><StudentProgressPage /></ProtectedRoute>} />
        <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={["student"]}><StudentAssignmentsPage /></ProtectedRoute>} />
        <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={["student"]}><TimetablePage /></ProtectedRoute>} />
        <Route path="/student/fees" element={<ProtectedRoute allowedRoles={["student"]}><FeeManagementPage /></ProtectedRoute>} />
        <Route path="/student/transport" element={<ProtectedRoute allowedRoles={["student"]}><TransportPage /></ProtectedRoute>} />
        <Route path="/student/exams" element={<ProtectedRoute allowedRoles={["student"]}><ExamSchedulePage /></ProtectedRoute>} />

        {/* Teacher */}
        <Route path="/teacher/marks" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherMarksPage /></ProtectedRoute>} />
        <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherAttendancePage /></ProtectedRoute>} />
        <Route path="/teacher/results" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherResultsPage /></ProtectedRoute>} />
        <Route path="/teacher/gradebook" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherGradeBookPage /></ProtectedRoute>} />
        <Route path="/teacher/assignments" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherAssignmentsPage /></ProtectedRoute>} />
        <Route path="/teacher/timetable" element={<ProtectedRoute allowedRoles={["teacher"]}><TimetablePage /></ProtectedRoute>} />
        <Route path="/teacher/parent-link" element={<ProtectedRoute allowedRoles={["teacher"]}><AdminParentLinkPage /></ProtectedRoute>} />

        {/* Parent */}
        <Route path="/parent" element={<ProtectedRoute allowedRoles={["parent"]}><ParentDashboard /></ProtectedRoute>} />
        <Route path="/parent/fees" element={<ProtectedRoute allowedRoles={["parent"]}><FeeManagementPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSubjectsPage /></ProtectedRoute>} />
        <Route path="/admin/parent-link" element={<ProtectedRoute allowedRoles={["admin"]}><AdminParentLinkPage /></ProtectedRoute>} />
        <Route path="/admin/teacher-classes" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTeacherClassPage /></ProtectedRoute>} />
        <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTimetablePage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSchoolSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/website" element={<ProtectedRoute allowedRoles={["admin"]}><AdminWebsitePage /></ProtectedRoute>} />
        <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={["admin"]}><FeeManagementPage /></ProtectedRoute>} />
        <Route path="/attendance/report" element={<ProtectedRoute allowedRoles={["admin"]}><AttendanceReportPage /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="/notices" element={<ProtectedRoute allowedRoles={["student", "teacher", "parent", "admin"]}><NoticeBoardPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute allowedRoles={["student", "teacher", "parent", "admin"]}><AcademicCalendarPage /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute allowedRoles={["student", "teacher", "admin"]}><LibraryPage /></ProtectedRoute>} />
        <Route path="/leaves" element={<ProtectedRoute allowedRoles={["student", "teacher", "admin"]}><LeavePage /></ProtectedRoute>} />
        <Route path="/transport" element={<ProtectedRoute allowedRoles={["admin"]}><TransportPage /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><ExamSchedulePage /></ProtectedRoute>} />
        <Route path="/syllabus" element={<ProtectedRoute allowedRoles={["student", "teacher", "parent", "admin"]}><SyllabusPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="/logout" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
