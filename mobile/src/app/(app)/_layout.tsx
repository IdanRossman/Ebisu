import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { Colors } from '../../constants/theme';

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/sign-in');
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.action.primary} />
      </View>
    );
  }

  if (!user) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="budget-configure" />
      <Stack.Screen name="budget-setup" />
      <Stack.Screen name="recurring-setup" />
      <Stack.Screen name="recurring-payments" />
      <Stack.Screen name="home" />
      <Stack.Screen name="ledger" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.surface.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
