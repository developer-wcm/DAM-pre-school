// =============================================================
// Teacher – Notification Center
// =============================================================

import NotificationCenterScreen from '../../components/NotificationCenterScreen'

export default function TeacherNotificationsScreen() {
  return (
    <NotificationCenterScreen
      role="teacher"
      title="Notifications"
      backTarget="/(teacher)"
    />
  )
}
