# Developer Quick Reference

## How to Use APIs in New Components

### 1. Import API Functions

```jsx
import { authApi, marksApi, resultsApi, attendanceApi } from "../api";
import { useAuth } from "../context/AuthContext";
```

### 2. Get Current User

```jsx
export default function MyComponent() {
  const { user, loading, accessToken } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" />;

  return (
    <div>
      <p>Hello, {user.username}!</p>
      <p>Role: {user.role}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

### 3. Fetch Data from API

```jsx
import { useEffect, useState } from "react";
import { resultsApi } from "../api";

export default function ResultsView() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await resultsApi.myResult(1);
        setResults(response.data);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error">{error}</div>;
  if (!results) return <div>No results found</div>;

  return <div>{/* Render results */}</div>;
}
```

### 4. Submit Form Data

```jsx
const handleSubmit = async (event) => {
  event.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const payload = {
      student: 5,
      exam: 1,
      subject: 1,
      marks_written: 70,
      marks_mcq: 20,
      marks_practical: 0,
    };

    const response = await marksApi.submit(payload);

    // Success - response.data contains the created object
    console.log("Marks saved:", response.data);
    setSuccess("Marks submitted successfully!");
  } catch (err) {
    console.error("Submission error:", err);
    setError(err.response?.data?.detail || "Failed to submit");
  } finally {
    setLoading(false);
  }
};
```

### 5. Handle Query Parameters

```jsx
const handleDateFilter = async (fromDate, toDate) => {
  try {
    const response = await attendanceApi.myAttendance({
      from_date: "2025-01-01", // YYYY-MM-DD
      to_date: "2025-01-31",
    });
    setAttendance(response.data);
  } catch (err) {
    console.error("Error:", err);
  }
};
```

### 6. API Response Handling

```jsx
// Always check response.data
const handleLogin = async () => {
  const response = await authApi.login({
    email: "student1@school.com",
    password: "student123",
  });

  const { access, refresh, user } = response.data;
  // Tokens are automatically saved in AuthContext
  // Redirect happens automatically in useEffect
};
```

---

## Error Handling Best Practices

### Example: Robust Error Handling

```jsx
const makeAPICall = async () => {
  try {
    const response = await resultsApi.myResult(1);

    // Check if data exists
    if (!response.data) {
      throw new Error("No data returned from API");
    }

    setData(response.data);
  } catch (err) {
    // Handle different error types
    if (err.response?.status === 401) {
      // Unauthorized - token expired
      console.error("Session expired");
      // AuthContext will handle logout
    } else if (err.response?.status === 403) {
      // Forbidden - no permission
      setError("You do not have permission to view this");
    } else if (err.response?.status === 404) {
      // Not found
      setError("Resource not found");
    } else if (err.response?.data?.detail) {
      // Backend error message
      setError(err.response.data.detail);
    } else if (err.message === "Network Error") {
      // Network issue
      setError("Network connection failed. Please try again.");
    } else {
      // Generic error
      setError("An error occurred. Please try again later.");
    }

    console.error("Full error:", err);
  }
};
```

---

## Common API Payload Formats

### Attendance Payload

```json
{
  "class_level": 9,
  "section": "A",
  "date": "2025-08-20",
  "records": [
    { "student_id": 5, "status": "Present" },
    { "student_id": 6, "status": "Late" }
  ]
}
```

### Marks Single Entry Payload

```json
{
  "student": 5,
  "exam": 1,
  "subject": 1,
  "marks_written": 70,
  "marks_mcq": 20,
  "marks_practical": 0
}
```

### Marks Bulk Entry Payload

```json
{
  "subject": 1,
  "exam": 1,
  "records": [
    {
      "student_id": 5,
      "marks_written": 70,
      "marks_mcq": 20,
      "marks_practical": 0
    },
    {
      "student_id": 6,
      "marks_written": 65,
      "marks_mcq": 15,
      "marks_practical": 0
    }
  ]
}
```

---

## Authentication Flow in Components

```jsx
// Example: Protected Component
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminPanel() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Not logged in
    return <Navigate to="/" replace />;
  }

  if (user.role !== "admin") {
    // Not authorized for this role
    return <Navigate to="/" replace />;
  }

  // User is authenticated and authorized
  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {user.username}</p>
    </div>
  );
}
```

---

## Debug Tips

### 1. Check Console for API Errors

```jsx
catch (err) {
  console.error('Error:', err);
  console.error('Status:', err.response?.status);
  console.error('Message:', err.response?.data?.detail);
}
```

### 2. View Request/Response in Network Tab

- Open DevTools → Network tab
- Perform API action
- Click request → Headers tab (shows Authorization header)
- Click request → Response tab (shows API response)

### 3. Check Stored Tokens

```javascript
// In browser console
console.log(localStorage.getItem("accessToken"));
console.log(localStorage.getItem("refreshToken"));
```

### 4. Verify API Base URL

```javascript
// In browser console
import { default as api } from "./api";
console.log(api.defaults.baseURL);
```

---

## Common Issues & Solutions

| Issue                   | Cause                 | Solution                        |
| ----------------------- | --------------------- | ------------------------------- |
| 401 Unauthorized        | Token invalid/expired | Clear localStorage, login again |
| 403 Forbidden           | User lacks permission | Check user role                 |
| 404 Not Found           | Wrong API endpoint    | Verify endpoint in api.js       |
| Network Error           | API unreachable       | Check VITE_API_BASE in .env     |
| CORS Error              | Origin not allowed    | Verify backend CORS config      |
| `undefined` in response | Missing data handling | Check API response structure    |

---

## Creating a New API Endpoint

1. **Add to src/api.js**:

```jsx
export const newApi = {
  getStatus: () => api.get("/api/status/"),
  updateStatus: (data) => api.post("/api/status/", data),
};
```

2. **Import in component**:

```jsx
import { newApi } from "../api";
```

3. **Use in component**:

```jsx
const response = await newApi.getStatus();
```

---

**Note**: All API requests automatically include the `Authorization: Bearer {token}` header via the axios interceptor in api.js
