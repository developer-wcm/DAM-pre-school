import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#7B6FE8',
        tabBarInactiveTintColor: '#9A9AB0',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Child',
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>🩷</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: 'Fees',
          tabBarIcon: ({ color }) => <Text style={styles.icon}>💳</Text>,
        }}
      />
      <Tabs.Screen
        name="academic"
        options={{
          title: 'Academic',
          tabBarIcon: ({ color }) => <Text style={styles.icon}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Text style={styles.icon}>👤</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    height: 70,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  icon: {
    fontSize: 22,
  },
  iconActive: {
    fontSize: 24,
  },
});
