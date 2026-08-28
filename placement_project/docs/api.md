# API

## Health
- GET `/api/health`

## Authentication
- POST `/api/auth/student-login`
- POST `/api/auth/admin-login`
- POST `/api/auth/register`
- GET `/api/auth/me`

## Placement pipeline
- GET/POST `/api/companies`
- GET/POST `/api/jobs`
- POST `/api/jobs/:id/reanalyze`
- POST `/api/jobs/:id/confirm`
- GET `/api/eligibility`
- GET `/api/matching/:jobId`
- GET `/api/applications`
- POST `/api/applications/:id/approve`
- POST `/api/applications/:id/reject`

## Scheduling and communication
- GET/POST `/api/interviews`
- POST `/api/interviews/:id/approve`
- POST `/api/interviews/:id/reject`
- POST `/api/interviews/:id/complete`
- POST `/api/interviews/:id/result`
- POST `/api/interviews/plan`
- GET/POST `/api/panels`
- GET/POST `/api/rooms`
- GET/POST `/api/notifications`
- POST `/api/notifications/:id/read`

## Data and analytics
- GET/PUT `/api/students/me`
- GET `/api/students`
- POST `/api/students/import` (CSV/XLS/XLSX)
- GET `/api/analytics/dashboard`
- GET `/api/analytics`
- GET `/api/analytics/audit-log`
- POST `/api/skill-gap/generate`
