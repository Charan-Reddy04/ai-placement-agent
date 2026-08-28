# AI Campus Placement Operations & Interview Coordination Agent

Hackathon-ready MERN + AI prototype for campus placement operations.

## Features
- Role-based authentication
- Student and company management
- Job description extraction
- AI-assisted eligibility explanations with deterministic mandatory rules
- AI candidate matching with deterministic factual scoring and explanations
- Interview scheduling
- Panel and room coordination
- Notifications
- Placement dashboard
- Skill-gap analytics
- Human approval gate before interview scheduling and final selection
- Native Excel (.xlsx/.xls) and CSV student import
- Audit trail for placement decisions

## Stack
Frontend: React + Vite
Backend: Node.js + Express + MongoDB/Mongoose
AI: Groq OpenAI-compatible Chat Completions API (works with any Groq-hosted model, e.g. `openai/gpt-oss-120b` or `llama-3.3-70b-versatile`)

## Getting started

`node_modules` is **not** included in this zip on purpose — dependencies are platform-specific
(native binaries for Rollup/esbuild differ between Windows/Mac/Linux), so committing them causes
exactly the kind of "it doesn't work on my machine" failures this rebuild fixes. Install fresh instead:

```bash
# from the project root
npm run install-all      # installs backend + frontend deps
cp backend/.env.example backend/.env   # then edit backend/.env, see below
npm run dev               # runs backend (5000) + frontend (5173) together
```

Or install/run each side separately:
```bash
cd backend && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

### Required setup
1. **MongoDB** — either run one locally (`mongodb://127.0.0.1:27017/ai-placement-agent`, the default)
   or point `MONGO_URI` in `backend/.env` at an Atlas cluster.
2. **Groq API key** — get a free key at https://console.groq.com/keys and put it in `backend/.env`
   as `GROK_API_KEY`. Set `GROK_MODEL` to any Groq-hosted model id, e.g. `openai/gpt-oss-120b`
   (default here) or `llama-3.3-70b-versatile`.
3. Run `npm run seed` inside `backend/` once, to create the demo admin/student accounts and sample
   companies/jobs/panels/rooms described below.

The prototype also works without an AI API key: JD extraction, eligibility and matching fall back
to deterministic logic, they just skip the AI explanation/semantic-scoring layer. Check the backend
terminal for `AI ... fallback:` warnings if something looks off — that tells you the AI call itself
is failing (bad/missing key, rate limit, or network) rather than a bug in the app logic.

## One-scenario walkthrough demo (TechNova Solutions)

For a review/demo, `backend/seed-demo.js` populates one focused, realistic scenario end-to-end
through the **real** services/agents (JD parsing, eligibility, matching, scheduling and notifications are wired to the live workflow) —
not hand-crafted fake records:

```bash
cd backend && npm install && npm run seed:demo && npm run dev
cd frontend && npm install && npm run dev
```

It creates **TechNova Solutions**, a **Full Stack Developer** job (JD parsed by the JD Analysis
Agent), three candidates — **Rahul Sharma** (eligible, strong match), **Priya Reddy** (eligible,
partial backend skill gap), **Arjun Kumar** (CGPA 7.2 < 7.5 → not eligible) — plus a **Technical Panel A**
and **Lab 2** room. No interview is pre-created: approving a candidate from **AI Matching** invokes the
real Scheduling Agent, which selects a conflict-free panel/room/time and then creates the notification.

Demo student account: `rahul@example.com` / `password123`. Admin account: `tyr07@gmail.com` using the existing password,
`priya@example.com`, `arjun@example.com`.

Suggested walkthrough:
1. Log in as admin → **Dashboard** → see TechNova Solutions, 1 open job, eligible/shortlisted counts.
2. **Job descriptions** → open the Full Stack Developer job → AI-extracted skills/CGPA/branches.
3. **Eligibility** → Rahul & Priya eligible, Arjun not eligible (CGPA reason shown).
4. **Candidate matching** → Rahul ranked #1, Priya #2, with matched/missing skills + explanation.
5. **AI Matching** → Rahul ranked #1 → choose an optional preferred interview date → click **Approve & Schedule**. The Scheduling Agent checks panel/room conflicts, creates the interview and fires the confirmation notification.
6. **Interviews** → see Rahul's scheduled interview, generate the AI preparation plan, then use **Mark interview completed** and record the final result.
7. Log out, log in as Rahul → **Notifications** → see the interview-confirmed notification, mark it read.
8. **Skill Gap** page → see demand/availability gaps and placement-readiness metrics.
9. Back in admin → **Reports** → live impact metrics, top candidates, skill gaps, exceptions and audit trail.


## Authentication & Authorization

The project now has separate **Student Login** and **Admin Login** flows.

### Demo accounts after `npm run seed`

- Admin: `tyr07@gmail.com` / existing account password
- Students: `aarav@example.com`, `priya@example.com`, `rahul@example.com`, `sneha@example.com`, `vikram@example.com`, `ananya@example.com`
- Demo student password: `password123`

### Security model

- Passwords are hashed with bcrypt.
- JWT access tokens expire according to `JWT_EXPIRES_IN` (default `1d`).
- Public registration can create **student accounts only**; users cannot self-register as admins.
- Admin login uses `/api/auth/admin-login`.
- Student login uses `/api/auth/student-login`.
- Protected backend routes require `Authorization: Bearer <token>`.
- Admin-only operations are enforced on the backend, not just hidden in the UI.
- Student APIs are scoped to the authenticated student's profile for interviews and notifications.
- `/api/auth/me` validates the current session when the frontend starts.
- Change `JWT_SECRET` before production deployment and never commit `.env`.


## AI placement automation

This build uses **Groq** through the OpenAI-compatible Chat Completions API, defaulting to the
`openai/gpt-oss-120b` model (fast, strong JSON adherence). Any other Groq-hosted chat model works too.

Backend `.env`:
```env
GROK_API_URL=https://api.groq.com/openai/v1
GROK_API_KEY=your_groq_api_key
GROK_MODEL=openai/gpt-oss-120b
```

### Automated flow
1. Admin creates a company/job.
2. The JD Analysis Agent extracts skills and eligibility criteria.
3. Admin reviews and confirms the extracted requirements.
4. Deterministic eligibility rules are evaluated (CGPA, backlogs, branch, experience and mandatory skills).
5. AI-assisted candidate matching adds semantic reasoning, strengths, skill gaps and interview focus.
6. Eligible/high-fit students receive an `AI_RECOMMENDED` application. No interview is created automatically.
7. Admin approves or rejects the recommendation.
8. After approval, the Scheduling Agent selects a conflict-free panel/room/time and creates the interview.
9. Interview confirmation notifications and reminder notifications are created for the student.
10. AI interview preparation plans and smart placement plans can be generated from the job + student context.
11. Reports and audit logs capture outcomes, exceptions and administrator actions.
12. Admin approval remains the final human gate; AI never makes the final hiring decision.

Student skills can be updated through `PUT /api/students/me`; skill aliases such as **MERN**, **ReactJS**, **NodeJS**, etc. are normalized and expanded so matching does not fail because of naming differences.

If the Groq API is unavailable, JD extraction/matching/eligibility have deterministic fallbacks rather than returning a fake AI result.

### Feature → implementation map

| Feature | Where it lives |
|---|---|
| Job-description & eligibility extraction | `POST /api/jobs` and `POST /api/jobs/:id/reanalyze` → `services/jdParser.js` (AI + deterministic fallback). Re-analysis resets the requirement-confirmation gate; the admin must review and confirm again before eligibility/matching runs. |
| Student eligibility verification | `services/eligibilityService.js`, run automatically for every job/student pair; viewable on the **Eligibility** page. |
| Skill-based matching with explanations | `services/matchingService.js` + **AI Matching** page (`MatchCard`), deterministic score blended with AI semantic score, capped so AI can't erase a hard skill gap. |
| Interview & test scheduling | `services/schedulingService.js` (`autoSchedule`), AI picks the best conflict-free slot; also `POST /api/interviews/plan` → "AI interview prep plan" button on the **Interviews** page (available to admins and the student on their own interview). |
| Panel & room coordination | **Panels** / **Rooms** pages + `schedulingService.js` conflict checks; auto-provisions a fallback panel/room if none exist. |
| Student notifications & reminders | `services/notificationService.js`, surfaced on the **Notifications** page. |
| Placement dashboard (pending actions & exceptions) | **Dashboard** page, `analyticsController.getDashboard`. |
| Skill-gap & placement-readiness analytics | Aggregate view on the **Skill Gap** page (`analyticsController.getAnalytics`); per-candidate AI learning plan via `POST /api/skill-gap/generate`, wired as an "AI skill-gap & learning plan" button per candidate on the **AI Matching** page. |

## Real app behavior for friend testing

This project is designed to work with a real MongoDB-backed user/student lifecycle, not only pre-seeded students.

### New student
- Open `/register`.
- Create a student account with name, email, password and placement profile data.
- The registration endpoint creates a `User` with role `student` and a linked `Student` document.
- The browser is redirected to the normal student login page; the student logs in with the new credentials.
- The new student can open **Opportunities**, see only open/admin-confirmed jobs, check eligibility, and apply.
- Registration automatically refreshes that student's eligibility/matching records against every currently open confirmed job.
- If a Student record was already imported into MongoDB with the same email but had no login, registration links the new User to that existing profile rather than creating a duplicate.

### Existing students
Existing MongoDB Student documents remain the source of truth. The safe demo seed does not delete them. When an admin confirms a new job, the placement pipeline evaluates the complete current Student collection.

### Admin
The existing admin account `tyr07@gmail.com` is preserved. The admin reviews AI job extraction, confirms requirements, reviews ranked candidates, approves/rejects candidates, invokes scheduling, and monitors notifications/reports.

### Safe demo command
`npm run seed:demo` does not wipe users or students. It creates/updates one demo company/job, clears only placement records belonging to that demo job, and evaluates the current MongoDB student pool.
