# Architecture

React 19 + Vite dashboard → Express REST API → MongoDB/Mongoose.

The backend is organized around placement-operation agents/services:
- **JD Analysis Agent:** AI + deterministic extraction with admin confirmation.
- **Eligibility Agent:** hard-rule verification for CGPA, backlog, branch, experience and mandatory skills.
- **Candidate Matching Agent:** factual skill scoring blended with optional AI semantic reasoning.
- **Scheduling Agent:** conflict-aware panel/room/time selection.
- **Notification Agent:** confirmations and timed reminders.
- **Analytics/Reporting:** workflow counts, skill gaps, impact metrics, exceptions and audit trail.

The frontend exposes the poster workflow as separate operational screens: Dashboard, Job Descriptions, Candidates/Excel import, Eligibility, AI Matching, Interviews, Panels, Rooms, Notifications, Skill Gap and Reports.

Deterministic eligibility remains authoritative; AI provides extraction, semantic matching, explanations and preparation plans.
