import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HomeProgressScope, WeekStartsOn } from '../../../types';

export const HOME_PROGRESS_SCOPE_KEY = 'home_progress_scope';
export const WEEK_STARTS_ON_KEY = 'week_starts_on';

export async function loadHomeProgressScope(): Promise<HomeProgressScope> {
  const value = await AsyncStorage.getItem(HOME_PROGRESS_SCOPE_KEY);
  return value === 'whole_plan' ? 'whole_plan' : 'living_money';
}

export async function saveHomeProgressScope(scope: HomeProgressScope) {
  await AsyncStorage.setItem(HOME_PROGRESS_SCOPE_KEY, scope);
}

export async function loadWeekStartsOn(): Promise<WeekStartsOn> {
  const value = await AsyncStorage.getItem(WEEK_STARTS_ON_KEY);
  return value === 'monday' ? 'monday' : 'sunday';
}

export async function saveWeekStartsOn(value: WeekStartsOn) {
  await AsyncStorage.setItem(WEEK_STARTS_ON_KEY, value);
}
