# Admin and User Sidebar Overlap Fix

## Tasks
- [x] Modify `app/main/admin/layout.tsx` to remove `marginLeft` from the content div, allowing the sidebar to overlap instead of pushing content.
- [x] Add conditional `marginLeft` to `AdminHeader` on small screens when sidebar is expanded.
- [x] Add conditional `marginLeft` to main content on small screens when sidebar is expanded.
- [x] Update `components/ui/AdminHeader.tsx` to use `bg-slate-900/80` and `bg-white/80` for backdrop blur.
- [x] Change `AdminHeader` z-index from `z-40` to `z-20` to position below sidebar.
- [x] Apply same changes to user layout: `app/main/user/layout.tsx`, `components/ui/UserHeader.tsx`.
- [x] Update `UserHeader` to use `bg-slate-900/80` and `bg-white/80` for backdrop blur.
- [x] Update `components/ui/UserSidebar.tsx` to hide sidebar on small screens when collapsed (x: -56).
- [x] Update `components/ui/AdminSidebar.tsx` to hide sidebar on small screens when collapsed (x: -56).
- [x] Remove conditional marginLeft from main content in both layouts since sidebar now hides when collapsed.
- [x] Test the layout on mobile and tablet to ensure no overflow issues.
- [x] Verify sidebar toggle functionality works correctly with overlap.
- [x] Apply same changes to user layout: `app/main/user/layout.tsx`, `components/ui/UserHeader.tsx`.

## Notes
- Sidebar is already positioned as `fixed` with `z-30`, so it will overlay content.
- Header adjusts its margin only on small screens when sidebar is expanded to prevent overlap.
- Main content adjusts its margin only on small screens when sidebar is expanded to prevent overlap.
- Headers use backdrop blur with transparency for better overlay appearance.
- Headers are positioned below sidebar with z-20 to prevent overlap issues.
- On small screens, sidebar slides out of view when collapsed to prevent covering main content.
