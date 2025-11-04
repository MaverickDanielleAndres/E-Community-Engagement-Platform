# Admin Notification Refinement TODO

## Current State Analysis
- Admins currently receive notifications for:
  - New complaint submissions ✓ (keep)
  - New ID verification requests ✓ (keep)
  - Poll creation (to community members, not admins) ❌ (remove)
  - Poll closure (to community members) ❌ (change to admins with count)

- Admins do NOT receive notifications for:
  - Feedback submissions ❌ (add)

## Required Changes
1. **Add admin notification for feedback submission**
   - File: `app/api/feedback/route.ts`
   - Add notification creation in POST method after feedback is created ✓

2. **Remove poll creation notifications**
   - File: `app/api/polls/route.ts`
   - Remove the notification creation block in POST method ✓

3. **Change poll closure notifications**
   - File: `app/api/polls/[pollId]/route.ts`
   - Change notification recipients from community members to admins
   - Include number of submissions in notification body ✓

## Testing
- Test feedback submission notification ✓
- Test poll creation (should not notify anyone) ✓
- Test poll closure notification to admins with count ✓
- Verify complaint and ID verification notifications still work ✓
