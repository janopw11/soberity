import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#f7f5ef' },
          headerTintColor: '#183e32',
          contentStyle: { backgroundColor: '#f7f5ef' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Soberity' }} />
        <Stack.Screen name="science" options={{ title: 'Science' }} />
        <Stack.Screen name="events" options={{ title: 'Events & Community' }} />
        <Stack.Screen name="account" options={{ title: 'Your account' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Page not found' }} />
      </Stack>
    </>
  );
}
