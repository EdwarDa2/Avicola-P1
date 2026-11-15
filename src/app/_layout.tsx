import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/application/state/AppContext';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bone },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="family/new"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="family/[id]"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="plan/new"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="help"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="nutrients"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="resources"
            options={{ headerShown: false }}
          />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
