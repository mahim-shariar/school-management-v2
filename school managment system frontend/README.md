# School Management Frontend

A React + Vite + Tailwind frontend for the Bangladesh School Management System challenge.

## What is included

- Login page with JWT authentication flow
- Role-based pages for Student, Teacher, and Admin
- API integration hooks for the core endpoints
- Protected route handling and auth state management
- Tailwind styling with simple responsive layout

## Run locally

```bash
npm install
npm run dev
```

## Backend API configuration

Set the API base URL in `.env` or use the default `http://localhost:8000`.

Example `.env`:

```env
VITE_API_BASE=http://localhost:8000
```

## Notes

- This project only includes the frontend.
- Backend endpoints are expected to follow the project spec, such as `/api/auth/login/`, `/api/results/{exam_id}/my/`, etc.
