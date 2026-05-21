import { apiRequest } from '../../../lib/api';
import type { CurrencyCode } from '../../../types';

type CompleteOnboardingInput = {
  displayName: string;
  guidanceGoals: string[];
  currencyCode: CurrencyCode;
};

export function completeOnboardingRemote(input: CompleteOnboardingInput) {
  return apiRequest('/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
