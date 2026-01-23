/**
 * App Layout (Protected Routes)
 * All routes in this group require authentication
 */

import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
