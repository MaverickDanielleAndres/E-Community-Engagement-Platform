# Admin Sidebar Overlap Fix

## Tasks
- [x] Modify `app/main/admin/layout.tsx` to remove `marginLeft` from the content div, allowing the sidebar to overlap instead of pushing content.
- [x] Add conditional `marginLeft` to `AdminHeader` on small screens when sidebar is expanded.
- [x] Add conditional `marginLeft` to main content on small screens when sidebar is expanded.
- [x] Test the layout on mobile and tablet to ensure no overflow issues.
- [x] Verify sidebar toggle functionality works correctly with overlap.

## Notes
- Sidebar is already positioned as `fixed` with `z-30`, so it will overlay content.
- Header adjusts its margin only on small screens when sidebar is expanded to prevent overlap.
- Main content adjusts its margin only on small screens when sidebar is expanded to prevent overlap.
