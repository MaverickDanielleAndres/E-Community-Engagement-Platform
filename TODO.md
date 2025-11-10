# Fix Real-Time Messaging Issues

## Issues
- Real-time updates work for resident-to-admin messages in group chat but not for admin-to-resident messages
- Admin sending messages is slow and always shows loading

## Root Causes
- Postgres changes for INSERT may not be reliable across all clients
- GroupChatModal fetches all data after sending, causing slow loading

## Tasks
- [x] Update API endpoint to broadcast new message after insert instead of relying on postgres_changes
- [x] Update useRealtimeConversation to listen for message_insert broadcast event
- [x] Remove fetchGroupChatData() call after sending in GroupChatModal to prevent slow loading
- [ ] Test bidirectional real-time messaging
- [ ] Test faster message sending without loading state
