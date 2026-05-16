import axios from "axios";

const apiBase =
  import.meta.env.VITE_API_BASE ||
  "https://school-management-project-n5r1.onrender.com";

const api = axios.create({
  baseURL: apiBase,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/api/auth/login/") &&
      !originalRequest.url.includes("/api/auth/token/refresh/")
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const response = await api.post("/api/auth/token/refresh/", {
          refresh: refreshToken,
        });
        const accessToken = response.data.access;
        localStorage.setItem("accessToken", accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        onRefreshed(accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user_data");
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// AUTHENTICATION APIs
export const authApi = {
  register: (payload) => api.post("/api/auth/register/", payload),
  login: (data) => api.post("/api/auth/login/", data),
  logout: (payload) => api.post("/api/auth/logout/", payload),
  refresh: (refreshToken) =>
    api.post("/api/auth/token/refresh/", { refresh: refreshToken }),
  me: () => api.get("/api/auth/me/"),
  studentProfile: () => api.get("/api/auth/student/profile/"),
  linkChild: (payload) => api.post("/api/auth/link-child/", payload),
  myChildren: () => api.get("/api/auth/my-children/"),
  // Admin/teacher parent-child linking
  adminLinkParent: (payload) => api.post("/api/auth/admin-link-parent/", payload),
  adminUnlinkParent: (id) => api.delete(`/api/auth/admin-link-parent/${id}`),
  parentChildLinks: () => api.get("/api/auth/parent-child-links/"),
  users: (params) => api.get("/api/auth/users/", { params }),
};

// DASHBOARD APIs
export const dashboardApi = {
  stats: () => api.get("/api/dashboard/stats/"),
};

// MARKS APIs
export const marksApi = {
  submit: (payload) => api.post("/api/marks/", payload),
  getStudents: (classLevel, section) =>
    api.get("/api/marks/bulk/", {
      params: { class_level: classLevel, section },
    }),
  submitBulk: (payload, params) =>
    api.post("/api/marks/bulk/", payload, { params }),
};

// RESULT APIs
export const resultsApi = {
  myResult: (examId) => api.get(`/api/results/${examId}/my/`),
  childResult: (examId, childId) => api.get(`/api/results/${examId}/children/${childId}/`),
  sectionResults: (examId, classLevel, section) =>
    api.get(`/api/results/${examId}/section/${classLevel}/${section}/`),
  meritList: (examId) => api.get(`/api/results/${examId}/merit-list/`),
  publishResult: (examId) => api.post(`/api/exams/${examId}/publish/`),
};

// ATTENDANCE APIs
export const attendanceApi = {
  mark: (payload) => api.post("/api/attendance/mark/", payload),
  myAttendance: (params) => api.get("/api/attendance/my/", { params }),
  childAttendance: (childId, params) =>
    api.get(`/api/attendance/children/${childId}/`, { params }),
  sectionAttendance: (classLevel, section, date) =>
    api.get(`/api/attendance/section/${classLevel}/${section}/`, {
      params: { date },
    }),
  report: (params) => api.get("/api/attendance/report/", { params }),
};

// SUBJECT APIs
export const subjectApi = {
  list: (classLevel) =>
    api.get("/api/subjects/", { params: { class_level: classLevel } }),
  create: (payload) => api.post("/api/subjects/", payload),
  remove: (id) => api.delete(`/api/subjects/${id}`),
};

// ASSIGNMENT APIs
export const assignmentApi = {
  list: (params) => api.get("/api/assignments/", { params }),
  create: (payload) => api.post("/api/assignments/", payload),
  myAssignments: () => api.get("/api/assignments/my/"),
  myStats: () => api.get("/api/assignments/stats/my/"),
  childStats: (childId) => api.get(`/api/assignments/stats/children/${childId}/`),
  submit: (id) => api.post(`/api/assignments/${id}/submit/`),
  submissions: (id) => api.get(`/api/assignments/${id}/submissions/`),
  grade: (assignmentId, subId, payload) =>
    api.patch(`/api/assignments/${assignmentId}/submissions/${subId}/`, payload),
};

// TEACHER-CLASS APIs (Admin assigns teachers to classes/subjects)
export const teacherClassApi = {
  list: (params) => api.get("/api/teacher-classes/", { params }),
  create: (payload) => api.post("/api/teacher-classes/", payload),
  remove: (id) => api.delete(`/api/teacher-classes/${id}`),
  teachers: () => api.get("/api/teacher-classes/teachers/"),
};

// TIMETABLE APIs
export const timetableApi = {
  list: (params) => api.get("/api/timetable/", { params }),
  mySchedule: () => api.get("/api/timetable/my-schedule/"),
  upsert: (payload) => api.post("/api/timetable/", payload),
  remove: (id) => api.delete(`/api/timetable/${id}`),
};

// FEE APIs
export const feeApi = {
  list: (params) => api.get("/api/fees/", { params }),
  my: () => api.get("/api/fees/my/"),
  childFees: (childId) => api.get(`/api/fees/children/${childId}/`),
  create: (payload) => api.post("/api/fees/", payload),
  bulk: (payload) => api.post("/api/fees/bulk/", payload),
  pay: (id, payload) => api.patch(`/api/fees/${id}/pay/`, payload),
  remove: (id) => api.delete(`/api/fees/${id}`),
  stats: () => api.get("/api/fees/stats/"),
};

// NOTICE APIs
export const noticeApi = {
  list: () => api.get("/api/notices/"),
  create: (payload) => api.post("/api/notices/", payload),
  togglePin: (id) => api.patch(`/api/notices/${id}/pin/`),
  remove: (id) => api.delete(`/api/notices/${id}`),
};

// EVENT / CALENDAR APIs
export const eventApi = {
  list: (params) => api.get("/api/events/", { params }),
  create: (payload) => api.post("/api/events/", payload),
  remove: (id) => api.delete(`/api/events/${id}`),
};

// LEAVE APIs
export const leaveApi = {
  apply: (payload) => api.post("/api/leaves/", payload),
  my: () => api.get("/api/leaves/my/"),
  list: (params) => api.get("/api/leaves/", { params }),
  review: (id, payload) => api.patch(`/api/leaves/${id}/review/`, payload),
};

// LIBRARY APIs
export const libraryApi = {
  books: (params) => api.get("/api/library/books/", { params }),
  addBook: (payload) => api.post("/api/library/books/", payload),
  removeBook: (id) => api.delete(`/api/library/books/${id}`),
  issues: (params) => api.get("/api/library/issues/", { params }),
  myIssues: () => api.get("/api/library/issues/my/"),
  issueBook: (payload) => api.post("/api/library/issues/", payload),
  returnBook: (id) => api.patch(`/api/library/issues/${id}/return/`),
};

// TRANSPORT APIs
export const transportApi = {
  routes: () => api.get("/api/transport/routes/"),
  createRoute: (payload) => api.post("/api/transport/routes/", payload),
  removeRoute: (id) => api.delete(`/api/transport/routes/${id}`),
  assignments: () => api.get("/api/transport/assignments/"),
  assign: (payload) => api.post("/api/transport/assignments/", payload),
  unassign: (id) => api.delete(`/api/transport/assignments/${id}`),
  my: (params) => api.get("/api/transport/my/", { params }),
};

// EXAM SCHEDULE APIs
export const examScheduleApi = {
  list: (params) => api.get("/api/exam-schedules/", { params }),
  upsert: (payload) => api.post("/api/exam-schedules/", payload),
  remove: (id) => api.delete(`/api/exam-schedules/${id}`),
};

// SCHOOL SETTINGS APIs
export const schoolSettingsApi = {
  get: () => api.get("/api/school/settings/"),
  update: (payload) => api.patch("/api/school/settings/", payload),
};

// PUBLIC WEBSITE APIs (no auth required)
export const publicApi = {
  school: () => api.get("/api/public/school"),
  staff: (params) => api.get("/api/public/staff", { params }),
  gallery: (params) => api.get("/api/public/gallery", { params }),
  achievements: () => api.get("/api/public/achievements"),
  news: () => api.get("/api/public/news"),
};

// STAFF (admin)
export const staffApi = {
  list: () => api.get("/api/staff/"),
  create: (payload) => api.post("/api/staff/", payload),
  update: (id, payload) => api.patch(`/api/staff/${id}`, payload),
  remove: (id) => api.delete(`/api/staff/${id}`),
};

// GALLERY (admin)
export const galleryApi = {
  list: () => api.get("/api/gallery/"),
  create: (payload) => api.post("/api/gallery/", payload),
  remove: (id) => api.delete(`/api/gallery/${id}`),
};

// ACHIEVEMENTS (admin)
export const achievementApi = {
  list: () => api.get("/api/achievements/"),
  create: (payload) => api.post("/api/achievements/", payload),
  remove: (id) => api.delete(`/api/achievements/${id}`),
};

// SYLLABUS APIs
export const syllabusApi = {
  list: (params) => api.get("/api/syllabus/", { params }),
  get: (id) => api.get(`/api/syllabus/${id}`),
  years: () => api.get("/api/syllabus/years/"),
  create: (payload) => api.post("/api/syllabus/", payload),
  update: (id, payload) => api.patch(`/api/syllabus/${id}`, payload),
  remove: (id) => api.delete(`/api/syllabus/${id}`),
};

export default api;
