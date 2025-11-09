# Real-Time Messaging Enhancement Plan

## Tasks
- [x] Modify `lib/hooks/useMessaging.ts` to add refresh broadcast channel listener and sender
- [x] Modify `lib/hooks/useAdminMessaging.ts` to add refresh broadcast channel listener and sender
- [ ] Test real-time messaging between user and admin
- [ ] Verify conversations update immediately without manual refresh
- [ ] Check for console errors related to subscriptions or broadcasts

## Information Gathered
- `useMessaging` hook subscribes to messages for all user conversations (including admin) and updates the conversation list and selected conversation in real-time.
- `useAdminMessaging` hook subscribes to messages for the specific conversation when the admin modal is open, updating the conversation in real-time.
- Both use postgres_changes on the messages table, which should handle real-time updates.
- To enhance reliability, we can add a broadcast refresh channel that sends and listens for refresh events when messages are sent.

## Plan
- Modify `lib/hooks/useMessaging.ts` to add a refresh broadcast channel listener and send refresh broadcasts after sending messages.
- Modify `lib/hooks/useAdminMessaging.ts` to add a refresh broadcast channel listener and send refresh broadcasts after sending messages.
- This ensures that when a user sends a message, the admin's open modal refreshes, and vice versa, providing real-time updates like resident conversations.

## Dependent Files to be edited
- `lib/hooks/useMessaging.ts`
- `lib/hooks/useAdminMessaging.ts`
