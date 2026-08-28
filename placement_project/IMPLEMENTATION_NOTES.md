# Poster-aligned implementation

The project has been implemented as a real placement-operations workflow rather than a collection of static screens.

## Live workflow

`Company Job → AI JD Analysis → Admin Requirement Confirmation → Eligibility Engine → Candidate Matching + Ranking → Admin Approval → Scheduling Agent → Notification/Reminders → Interview → Result → Reports`

## What is implemented

### 1. Problem / solution workflow
- Company and job records are managed in MongoDB.
- Job descriptions are parsed by `services/jdParser.js` using Groq when configured, with deterministic fallback extraction.
- Admin must confirm extracted requirements before the placement pipeline can run.

### 2. Eligibility Agent
- Checks branch, CGPA, backlogs, graduation year, experience and mandatory skills.
- Mandatory rules are deterministic and cannot be overridden by AI.
- AI can explain the result and provide preparation advice.

### 3. Candidate Matching Agent
- Computes a factual skill/criteria score.
- Optionally blends an AI semantic score.
- AI cannot erase hard eligibility gaps.
- Persists `AI_RECOMMENDED` applications for eligible candidates with score, matched skills, missing skills, explanation and interview focus.

### 4. Human-in-the-loop approval
- Matching never creates an interview.
- Admin sees ranked recommendations in **Dashboard** and **AI Matching**.
- Admin can approve or reject a recommendation.
- Approval is audited and invokes scheduling.

### 5. Scheduling Agent
- Selects conflict-free panel/room/time combinations.
- Prefers panels whose specialization matches the job.
- Can use an optional preferred date.
- Performs a final conflict check before creating the interview.
- Supports online interview links for online jobs.

### 6. Notifications
- Interview confirmation is created only after scheduling succeeds.
- Reminder service supports 7-day, 3-day, 1-day and 1-hour windows.
- Students can mark notifications as read.

### 7. Excel / CSV student data
- `.xlsx`, `.xls` and `.csv` imports are supported.
- Header aliases are mapped automatically.
- Invalid rows, duplicates and missing data are reported.
- Accepted data is stored in MongoDB as the source of truth.
- Imported/updated students are re-evaluated against confirmed open jobs.

### 8. Dashboard / architecture visualization
The admin dashboard now mirrors the poster workflow with live stages:
`Company Job → AI Analysis → Eligibility → AI Matching → Admin Approval → Scheduling → Notification → Reporting`.

It also shows pending recommendations, unresolved exceptions and operational counts.

### 9. Reports / expected impact
The Reports page now provides:
- eligibility/application totals
- average matching score
- scheduled interviews
- automation coverage
- application status breakdown
- top candidate ranking
- skill-demand gaps
- exceptions
- administrator audit trail

### 10. Demo authentication
`seed-demo` creates real login-capable accounts:
- Admin: `tyr07@gmail.com` / existing account password
- Student: `rahul@example.com` / `password123`
- Student: `priya@example.com` / `password123`
- Student: `arjun@example.com` / `password123`

The demo seed intentionally creates **no interview before approval**. Approving Rahul from AI Matching is the action that invokes the real Scheduling Agent and notification workflow.

## Validation performed

- All backend and AI JavaScript files pass `node --check`.
- Frontend source was reviewed for workflow/state consistency and the major student/admin action visibility issue in Interviews was corrected.
- Full npm dependency installation/build could not be completed in the execution environment because package installation timed out; `node_modules` is intentionally not included in the project archive.
