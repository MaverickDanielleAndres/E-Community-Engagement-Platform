# Dark Mode Fix Progress

## Steps to Complete:

- [ ] 1. Update components/ui/KPICard.tsx: Add dark: Tailwind variants for card backgrounds (e.g., bg-white -> bg-white dark:bg-slate-800), text colors (e.g., text-gray-900 -> text-gray-900 dark:text-slate-100), borders, and shadows to ensure proper contrast in dark mode.

- [ ] 2. Update components/ui/ChartCard.tsx: Add dark: variants for chart containers, titles, backgrounds (e.g., dark:bg-slate-900), and text (e.g., dark:text-white).

- [ ] 3. Update components/ui/DataTable.tsx: Add dark: variants for table elements including rows/cells (e.g., bg-white -> dark:bg-slate-800), headers (e.g., bg-gray-50 -> dark:bg-slate-700), text, and hover states (e.g., hover:bg-gray-100 -> dark:hover:bg-slate-700).

- [ ] 4. Update components/ui/EmptyState.tsx: Add dark: variants for backgrounds, icons, and text to prevent light content in dark mode.

- [ ] 5. Update app/main/admin/page.tsx: Review and add dark: classes to any inline styles or components without theme support.

- [ ] 6. Update app/main/user/layout.tsx: Ensure container uses consistent dark mode classes like "bg-slate-50 dark:bg-slate-950".

- [ ] 7. Update app/main/guest/layout.tsx: Ensure container uses consistent dark mode classes like "bg-slate-50 dark:bg-slate-950".

- [ ] 8. Review and update components/ui/AdminSidebar.tsx: Add dark: variants if any light-specific elements are found.

- [ ] 9. Review and update components/ui/AdminHeader.tsx: Add dark: variants if any light-specific elements are found.

- [ ] 10. Test: Run the dev server, toggle dark mode, and verify no white/light content across admin, user, and guest pages.

- [ ] 11. Final verification: Use browser to check all pages; update TODO with completion notes.
