import { apiRequest } from '../../../lib/api';
import type { CurrencyCode, HomeProgressScope, WeekStartsOn } from '../../../types';

export function deleteCurrentProfileRemote() {
  return apiRequest<{ deleted: true; userId: string }>('/me', {
    method: 'DELETE',
  });
}

export function updateCurrentProfilePreferencesRemote(input: {
  displayName?: string;
  homeProgressScope?: HomeProgressScope;
  weekStartsOn?: WeekStartsOn;
}) {
  const body = {
    ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
    ...(input.homeProgressScope !== undefined ? { homeProgressScope: input.homeProgressScope } : {}),
    ...(input.weekStartsOn !== undefined ? { weekStartsOn: input.weekStartsOn } : {}),
  };

  return apiRequest('/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function updateBudgetSpaceRemote(spaceId: string, input: { name?: string; currencyCode?: CurrencyCode }) {
  return apiRequest(`/spaces/${spaceId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
