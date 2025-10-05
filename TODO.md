# TODO: Update Close Poll Functionality

## Information Gathered
- The close poll functionality is in `app/main/admin/polls/[pollId]/page.tsx`
- Current `handleClosePoll` function closes the dialog after the API call completes
- Toast system is available via `useToast` hook from `ToastContext`
- The page uses `ConfirmDialog` component for confirmation

## Plan
- Import `useToast` hook in the component
- Modify `handleClosePoll` to:
  - Close the confirmation dialog immediately on confirm
  - Make the API call to close the poll
  - On success: update poll state and show success toast
  - On error: show error toast and potentially re-open dialog or handle gracefully

## Dependent Files to be edited
- `app/main/admin/polls/[pollId]/page.tsx`

## Followup steps
- Test the functionality to ensure modal closes immediately and toast appears on success
- Verify error handling works properly
