import AsyncStorage from '@react-native-async-storage/async-storage';
import { BudgetWatchTarget } from '../../../types';

export const BUDGET_WATCH_TARGETS_KEY = 'budget_watch_targets_v1';

export async function loadBudgetWatchTargets() {
  const raw = await AsyncStorage.getItem(BUDGET_WATCH_TARGETS_KEY);
  if (!raw) return [];
  try {
    const targets = JSON.parse(raw) as BudgetWatchTarget[];
    return Array.isArray(targets) ? targets : [];
  } catch {
    return [];
  }
}

export async function saveBudgetWatchTargets(targets: BudgetWatchTarget[]) {
  await AsyncStorage.setItem(BUDGET_WATCH_TARGETS_KEY, JSON.stringify(targets));
}

export async function deleteBudgetWatchTargets() {
  await AsyncStorage.removeItem(BUDGET_WATCH_TARGETS_KEY);
}
