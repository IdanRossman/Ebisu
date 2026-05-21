// Base user type - kept in sync with auth.tsx
export type { User } from '../lib/auth';

export type CurrencyCode = 'ILS' | 'USD' | 'EUR' | 'GBP';

export type HouseholdBudgetItem = {
  id: string;
  parentId?: string | null;
  sectionKey: BudgetSectionKey;
  name: string;
  sortOrder: number;
  archivedAt?: string;
};

export type OnboardingFirstPath = 'monthly_plan' | 'recurring_expenses';

export type BudgetSubcategory = {
  id: string;
  name: string;
  plannedAmount: number;
  spentAmount: number;
  archivedAt?: string;
};

export type BudgetSectionKey = 'steady_obligations' | 'household_vessels';

export type BudgetSectionItem = {
  id: string;
  name: string;
  plannedAmount: number;
  spentAmount: number;
  skipped: boolean;
  subcategories?: BudgetSubcategory[];
  archivedAt?: string;
};

export type ExpenseEntry = {
  id: string;
  section: BudgetSectionKey;
  categoryId: string;
  subcategoryId?: string | null;
  categoryNameSnapshot?: string;
  subcategoryNameSnapshot?: string | null;
  amount: number;
  payeeName: string;
  note: string;
  date: string;
  createdAt: string;
};

export type ExpenseSchedule = {
  id: string;
  budgetItemId: string;
  name: string;
  amount: number;
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurrenceInterval: number;
  recurrenceDayOfMonth?: number | null;
  recurrenceWeekday?: number | null;
  nextDueOn: string;
  note: string;
};

export type ExpenseOccurrence = {
  id: string;
  budgetItemId: string;
  sourceScheduleId: string;
  name: string;
  amount: number;
  dueOn: string;
  note: string;
  status: 'planned' | 'paid' | 'skipped';
};

export type BudgetPlan = {
  id: string;
  name: string;
  rhythm: BudgetPlanningRhythm;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  currency: CurrencyCode;
  fundingAmount: number | null;
  reserveTargetAmount: number | null;
  steadyObligations: BudgetSectionItem[];
  householdVessels: BudgetSectionItem[];
  expenses: ExpenseEntry[];
  createdAt: string;
  updatedAt: string;
};

export type BudgetPlanningRhythm = 'weekly' | 'biweekly' | 'monthly' | 'one_time';
export type HomeProgressScope = 'living_money' | 'whole_plan';
export type WeekStartsOn = 'sunday' | 'monday';

export type DraftBudgetPlan = {
  id: string;
  status: 'draft';
  name: string;
  rhythm: BudgetPlanningRhythm | null;
  fundingAmount: number | null;
  reserveTargetAmount: number | null;
  currency: CurrencyCode | null;
  currentStep: 'metadata' | 'funding' | 'steady_obligations' | 'categories' | 'review';
  categories: DraftBudgetCategory[];
  steadyObligations: DraftBudgetCategory[];
  householdVessels: DraftBudgetCategory[];
  createdAt: string;
  updatedAt: string;
};

export type DraftBudgetCategory = {
  id: string;
  name: string;
  amount: string;
  subcategories: DraftBudgetSubcategory[];
};

export type DraftBudgetSubcategory = {
  id: string;
  name: string;
  amount: string;
};

export type BudgetWatchTarget = {
  id: string;
  section: BudgetSectionKey;
  categoryId: string;
  subcategoryId?: string | null;
};

export type BudgetWatchCard = BudgetWatchTarget & {
  label: string;
  remaining: number;
};
