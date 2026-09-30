import { Redirect, Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { useLibrary } from '@/src/library';
import { fonts, useTheme } from '@/src/theme';

export default function AppLayout() {
  const theme = useTheme();
  const { onboarded } = useLibrary();

  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.mode === 'dark' ? theme.accent : theme.accent,
        tabBarInactiveTintColor: theme.textFaint,
        tabBarStyle: {
          backgroundColor: theme.bgElevated,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 11,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => <Icon name="library" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="boards"
        options={{
          title: 'Boards',
          tabBarIcon: ({ color }) => <Icon name="boards" color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
