# Task: Fix user feedback history details to show text instead of UUIDs

## Steps:

- [x] 1. Update types/feedback.ts: Add resolved_details?: string to DynamicFeedback interface.
- [x] 2. Update app/api/feedback/route.ts: Enrich feedback data in GET with resolved_details logic (resolve complaint_id, poll_id, etc., and extract text fields).
- [x] 3. Update app/main/user/feedback/my/page.tsx: Update interface and renderDetails to prioritize resolved_details.
- [ ] 4. Test changes: Run `npm run dev`, navigate to /main/user/feedback/my, verify details show readable text.
- [x] 5. Update TODO.md with completion status.

## Notes:
- Resolution logic assumes common fields: complaint_id (from complaints.description), poll_id (from polls.question).
- If more entity types needed, extend the resolver function.
- Ensure backwards compatibility for legacy feedback without form_data.
