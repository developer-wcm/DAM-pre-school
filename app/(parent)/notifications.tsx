// =============================================================
// Parent – Notification Center
// =============================================================

import NotificationCenterScreen from '../../components/NotificationCenterScreen'

export default function ParentNotificationsScreen() {
  return (
    <NotificationCenterScreen
      role="parent"
      title="Notifications"
      backTarget="/(parent)"
    />
  )
}
