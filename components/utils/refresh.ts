export async function refreshHeaderAndSidebar(setIsRefreshing?: (value: boolean) => void) {
  if (setIsRefreshing) setIsRefreshing(true)
  try {
    // Refetch notifications
    const notificationsResponse = await fetch('/api/notifications')
    // Refetch user data
    const userResponse = await fetch('/api/me/summary')
    // Refetch community data
    const communityResponse = await fetch('/api/user/community')

    // Trigger sidebar refresh
    localStorage.setItem('sidebarRefresh', 'true')
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'sidebarRefresh',
      newValue: 'true'
    }))
  } catch (error) {
    console.error('Error refreshing header and sidebar:', error)
  } finally {
    if (setIsRefreshing) setIsRefreshing(false)
  }
}
