import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteHouseholdBudgetItems,
  HOUSEHOLD_BUDGET_ITEMS_KEY,
  loadHouseholdBudgetItems,
  saveHouseholdBudgetItems,
} from '../features/budget/infrastructure/householdItemsRepository';
import {
  deleteBudgetPlan as deleteBudget,
  BUDGET_COMPLETE_KEY,
  hasBudgetPlan,
  loadBudgetPlan,
  BUDGET_PLAN_KEY,
  saveBudgetPlan,
} from '../features/budget/infrastructure/budgetRepository';
import {
  BUDGET_WATCH_TARGETS_KEY,
  deleteBudgetWatchTargets,
  loadBudgetWatchTargets,
  saveBudgetWatchTargets,
} from '../features/budget/infrastructure/watchRepository';
import { CurrencyCode } from '../types';

export * from '../features/budget/domain/budget';
export * from '../features/budget/domain/householdItems';
export * from '../features/budget/domain/money';
export {
  BUDGET_COMPLETE_KEY,
  BUDGET_WATCH_TARGETS_KEY,
  HOUSEHOLD_BUDGET_ITEMS_KEY,
  hasBudgetPlan,
  loadBudgetWatchTargets,
  loadHouseholdBudgetItems,
  loadBudgetPlan,
  BUDGET_PLAN_KEY,
  saveBudgetWatchTargets,
  saveHouseholdBudgetItems,
  saveBudgetPlan,
};

export const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';
export const DISPLAY_NAME_KEY = 'display_name';
export const GUIDANCE_GOALS_KEY = 'guidance_goals';
export const HOUSEHOLD_CURRENCY_KEY = 'household_currency';
export const ONBOARDING_FIRST_PATH_KEY = 'onboarding_first_path';

export const CURRENCY_OPTIONS = [
  { code: 'ILS', label: 'Israeli shekel', symbol: '₪' },
  { code: 'USD', label: 'US dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British pound', symbol: '£' },
] as const;

export const SUGGESTED_BUDGET_CATEGORIES = [
  { id: 'housing', name: 'Rent / housing', prompt: 'A roof is the first vessel. What should this month hold for home?' },
  { id: 'groceries', name: 'Groceries', prompt: 'Rice, fruit, coffee, small comforts. What shall the kitchen receive?' },
  { id: 'bills', name: 'Bills', prompt: 'The quiet obligations should be named before they surprise us.' },
  { id: 'eating-out', name: 'Eating out', prompt: 'Leave room for meals away from home, if this month asks for them.' },
  { id: 'transport', name: 'Transport', prompt: 'Journeys have a cost. What should movement be given?' },
  { id: 'home', name: 'Home', prompt: 'For repairs, soap, candles, and all the small things a household becomes.' },
  { id: 'savings', name: 'Savings', prompt: 'A portion set aside is a promise to your future household.' },
  { id: 'other', name: 'Other', prompt: 'Every month has unnamed visitors. Give them a modest place, or let them pass.' },
] as const;

export async function loadHouseholdCurrency() {
  return (await AsyncStorage.getItem(HOUSEHOLD_CURRENCY_KEY)) as CurrencyCode | null;
}

export async function deleteBudgetPlan() {
  await Promise.all([deleteBudget(), deleteBudgetWatchTargets()]);
}

export async function deleteAllBudgetPrototypeData() {
  await Promise.all([deleteBudgetPlan(), deleteHouseholdBudgetItems()]);
}

export async function hasCompletedOnboarding() {
  return (await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)) === 'true';
}
