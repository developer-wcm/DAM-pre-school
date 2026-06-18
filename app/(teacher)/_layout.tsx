import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { StyleSheet } from 'react-native'
import { useNotifications } from '../../context/notifications'

export default function TeacherLayout() {
  const { unreadCount } = useNotifications()
  const badge = unreadCount > 0 ? String(Math.min(unreadCount, 99)) : undefined

  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarStyle:             styles.tabBar,
        tabBarActiveTintColor:   '#7B6FE8',
        tabBarInactiveTintColor: '#9A9AB0',
        tabBarLabelStyle:        styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:        'My Class',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title:        'Attendance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title:        'Progress',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title:           'Alerts',
          tabBarBadge:     badge,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title:        'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden stack screens */}
      <Tabs.Screen name="attendance-report" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="progress-report"   options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth:   0,
    elevation:        10,
    shadowColor:      '#9B8FE0',
    shadowOffset:    { width: 0, height: -4 },
    shadowOpacity:    0.1,
    shadowRadius:     12,
    height:           70,
    paddingBottom:    12,
    paddingTop:        8,
  },
  tabLabel: {
    fontSize:   11,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#E74C3C',
    fontSize:        10,
    fontWeight:      '700',
  },
})
