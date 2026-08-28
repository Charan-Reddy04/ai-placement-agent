# Real-world placement workflow

## Student lifecycle
1. Student opens the portal.
2. New student selects **Register** and creates a student account.
3. Registration creates a `User` and a linked `Student` profile. If a placement-cell Student already exists with the same email but has no login, the account is linked to that existing profile instead of creating a duplicate.
4. Student logs in normally.
5. Student opens **Opportunities** and sees only open, admin-confirmed jobs.
6. The portal evaluates eligibility from the student's current profile and shows the reasons.
7. Eligible students can apply.
8. Application state is visible to the student; interviews and notifications appear in their portal.
9. Updating the profile automatically refreshes eligibility and AI matching across open confirmed jobs.

## Admin lifecycle
1. Existing admin (`tyr07@gmail.com`) logs in.
2. Admin creates a company job and pastes the JD.
3. AI extracts skills, eligibility rules and other job facts.
4. Admin reviews/edits the extracted requirements.
5. Admin confirms the requirements.
6. Eligibility + candidate matching runs across all current Student records in MongoDB.
7. AI recommendations are ranked with matched skills, gaps and explanations.
8. Admin approves/rejects candidates. AI never approves itself.
9. Approved candidates enter interview scheduling.
10. Scheduling coordinates panel, room, date and time.
11. Students receive notifications and reminders.
12. Admin completes interviews and records Selected/Not Selected results.
13. Reports and audit logs track the entire workflow.

## New student automation
A newly registered student is immediately evaluated against every currently open, requirements-confirmed job. If a new job is later confirmed, the full student pool is evaluated again. This means the system behaves like a live placement application rather than a static seeded demo.
