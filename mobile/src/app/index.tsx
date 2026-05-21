import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth';
import { hasCompletedOnboarding } from '../lib/budget';
import { Colors } from '../constants/theme';
import { loadBootstrap } from '../features/bootstrap/application/bootstrapApi';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    async function route() {
      if (!user) {
        router.replace('/sign-in');
        return;
      }

      const bootstrap = await loadBootstrap().catch(() => null);
      const onboardingComplete = bootstrap?.onboardingComplete ?? await hasCompletedOnboarding();

      if (!onboardingComplete) {
        router.replace('/onboarding');
        return;
      }

      router.replace('/home');
    }

    route();
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.action.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
