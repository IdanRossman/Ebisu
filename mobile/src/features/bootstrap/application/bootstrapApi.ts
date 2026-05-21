import { apiRequest } from '../../../lib/api';
import type { BudgetPlan } from '../../../types';

export type BootstrapResponse = {
  profile: {
    id: string;
    display_name: string;
    home_progress_scope: 'living_money' | 'whole_plan';
    week_starts_on: 'sunday' | 'monday';
    onboarding_completed_at: string | null;
  } | null;
  onboardingComplete: boolean;
  currentSpace: {
    id: string;
    name: string;
    currency_code: string;
  } | null;
  currentPlan: {
    id: string;
    name: string;
    period_type: BudgetPlan['rhythm'];
    starts_on: string;
    ends_on: string;
    currency_code: BudgetPlan['currency'];
    funding_amount: number | string | null;
    reserve_target_amount: number | string | null;
    created_at: string;
    updated_at: string;
  } | null;
};

let bootstrapInFlight: Promise<BootstrapResponse> | null = null;

export function loadBootstrap() {
  if (bootstrapInFlight) return bootstrapInFlight;
  bootstrapInFlight = apiRequest<BootstrapResponse>('/bootstrap').finally(() => {
    bootstrapInFlight = null;
  });
  return bootstrapInFlight;
}
