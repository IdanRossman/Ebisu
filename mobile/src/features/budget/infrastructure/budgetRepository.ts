import AsyncStorage from '@react-native-async-storage/async-storage';
import { BudgetPlan } from '../../../types';
import { rollBudgetPlanForwardIfNeeded } from '../domain/budget';
import { loadWeekStartsOn } from '../../preferences/infrastructure/homePreferencesRepository';

export const BUDGET_PLAN_KEY = 'budget_plan_v2';
export const BUDGET_COMPLETE_KEY = 'budget_plan_complete';

export async function loadBudgetPlan() {
  const raw = await AsyncStorage.getItem(BUDGET_PLAN_KEY);
  if (!raw) return null;
  try {
    const plan = JSON.parse(raw) as BudgetPlan;
    const currentPlan = rollBudgetPlanForwardIfNeeded(plan, await loadWeekStartsOn());
    if (currentPlan.id !== plan.id) {
      await saveBudgetPlan(currentPlan);
    }
    return currentPlan;
  } catch {
    return null;
  }
}

export async function saveBudgetPlan(plan: BudgetPlan) {
  await AsyncStorage.multiSet([
    [BUDGET_PLAN_KEY, JSON.stringify(plan)],
    [BUDGET_COMPLETE_KEY, 'true'],
  ]);
}

export async function deleteBudgetPlan() {
  await AsyncStorage.multiRemove([BUDGET_PLAN_KEY, BUDGET_COMPLETE_KEY]);
}

export async function hasBudgetPlan() {
  return (await AsyncStorage.getItem(BUDGET_COMPLETE_KEY)) === 'true' && !!(await loadBudgetPlan());
}
