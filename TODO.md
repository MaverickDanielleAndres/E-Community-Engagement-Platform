# TODO: Fix Background and Responsiveness on User Pages

## Tasks
- [x] Update the header layout in `app/main/user/page.tsx` to always put the subtitle "Here's what's happening in your community today" below the "Welcome back" title, and place the refresh button after the user's name.
- [x] Change background from `bg-white` to `bg-transparent` in light mode for `app/main/user/page.tsx`.
- [ ] Apply background fix to remaining user pages: polls, complaints/my, feedback/my, notifications, announcements, messaging.
- [ ] Test the responsiveness and background on all user pages.

## Notes
- Restructured the header: Outer div with flex-col, inner div with flex items-center justify-between for title and button, subtitle below.
- This ensures subtitle is always below, and button is next to the title on all screens.
- Development server is running on http://localhost:3001.
