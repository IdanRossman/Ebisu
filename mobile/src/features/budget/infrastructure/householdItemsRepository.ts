import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HouseholdBudgetItem } from '../../../types';

export const HOUSEHOLD_BUDGET_ITEMS_KEY = 'household_budget_items_v1';

export async function loadHouseholdBudgetItems() {
  const raw = await AsyncStorage.getItem(HOUSEHOLD_BUDGET_ITEMS_KEY);
  return raw ? JSON.parse(raw) as HouseholdBudgetItem[] : [];
}

export async function saveHouseholdBudgetItems(items: HouseholdBudgetItem[]) {
  await AsyncStorage.setItem(HOUSEHOLD_BUDGET_ITEMS_KEY, JSON.stringify(items));
}

export async function deleteHouseholdBudgetItems() {
  await AsyncStorage.removeItem(HOUSEHOLD_BUDGET_ITEMS_KEY);
}
