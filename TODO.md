# Real-Time Messaging Update Plan

## Current Issue
- Real-time subscriptions are set up but trigger API fetches instead of direct state updates
- Users need to refresh to see new messages, causing poor UX

## Tasks
- [x] Modify messages subscription in setupRealtimeSubscriptions to directly update messages state on INSERT events
- [x] Handle UPDATE events for message edits to update state immediately
- [x] Handle DELETE events for message deletions to update state immediately
- [x] Ensure proper message formatting for real-time updates
- [ ] Test that messages appear instantly without refresh
- [ ] Verify message ordering and scrolling behavior
- [ ] Update conversation list with latest message info in real-time

## Files to Modify
- lib/hooks/useMessaging.ts (main changes)
- Potentially update message formatting logic if needed

## Testing
- Send messages between users and verify instant appearance
- Edit messages and verify immediate updates
- Delete messages and verify immediate removal
- Check that scrolling and message ordering work correctly
