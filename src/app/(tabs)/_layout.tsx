import { Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.paper,
          borderTopColor: Colors.hairline,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.xs,
        },
        tabBarActiveTintColor: Colors.ink,
        tabBarInactiveTintColor: Colors.ash,
        tabBarLabelStyle: {
          ...Typography.captionBold,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={focused ? Colors.ink : Colors.ash}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="families"
        options={{
          title: 'Familias',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={24}
              color={focused ? Colors.ink : Colors.ash}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Planes',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'layers' : 'layers-outline'}
              size={24}
              color={focused ? Colors.ink : Colors.ash}
            />
          ),
        }}
      />
    </Tabs>
  );
}
