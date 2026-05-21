import type { BudgetPlan } from '../../../types';
import { activeSectionItems, categoryPlannedAmount, categorySpentAmount } from '../../budget/domain/budget';

export type HomeGreetingContext = {
  displayName?: string;
  budget: BudgetPlan;
  now?: Date;
  insights?: {
    hasOverspentVessel?: boolean;
  };
};

export type HomeGreeting = {
  periodLabel: string;
  message: string;
};

function phaseOfPeriod(budget: BudgetPlan, now: Date) {
  const start = new Date(`${budget.periodStart}T00:00:00`);
  const end = new Date(`${budget.periodEnd}T00:00:00`);
  const total = Math.max(1, end.getTime() - start.getTime());
  const elapsed = Math.max(0, Math.min(1, (now.getTime() - start.getTime()) / total));
  if (elapsed <= 0.15) return 'opening';
  if (elapsed < 0.45) return 'early';
  if (elapsed < 0.65) return 'middle';
  if (elapsed < 0.9) return 'late';
  return 'closing';
}

function timeOfDay(now: Date) {
  const hour = now.getHours();
  if (hour < 5) return 'late_night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function hasOverspentHouseholdVessel(budget: BudgetPlan) {
  return activeSectionItems(budget.householdVessels).some((item) => (
    categorySpentAmount(item) > categoryPlannedAmount(item)
  ));
}

export function buildHomeGreeting({
  displayName,
  budget,
  now = new Date(),
  insights,
}: HomeGreetingContext): HomeGreeting {
  const name = displayName?.trim() ? `, ${displayName.trim()}` : '';
  const periodPhase = phaseOfPeriod(budget, now);
  const overspent = insights?.hasOverspentVessel ?? hasOverspentHouseholdVessel(budget);

  const periodLabel = budget.periodStart.slice(0, 7);

  if (overspent) {
    return {
      periodLabel,
      message: `Some vessels are lighter than we hoped${name}. No shame in noticing early.`,
    };
  }

  if (periodPhase === 'opening') {
    return {
      periodLabel,
      message: `A fresh period begins${name}. Prosperity likes a steady hand.`,
    };
  }

  if (periodPhase === 'middle') {
    return {
      periodLabel,
      message: `Half the period has passed${name}. A gentle look now can spare worry later.`,
    };
  }

  if (periodPhase === 'late') {
    return {
      periodLabel,
      message: `The period is bending toward its close${name}. Let us tend what remains.`,
    };
  }

  if (periodPhase === 'closing') {
    return {
      periodLabel,
      message: `This period has traveled far${name}. Let us see what still remains before it rests.`,
    };
  }

  const dayTone = timeOfDay(now);
  if (dayTone === 'morning') {
    return {
      periodLabel,
      message: `Good morning${name}. Small careful choices have a way of becoming peaceful months.`,
    };
  }
  if (dayTone === 'afternoon') {
    return {
      periodLabel,
      message: `Good afternoon${name}. A brief look now can spare much worry later.`,
    };
  }
  if (dayTone === 'late_night') {
    return {
      periodLabel,
      message: `Late night${name}. A quiet check-in before rest?`,
    };
  }
  return {
    periodLabel,
    message: `Good evening${name}. Let us see how the household is holding.`,
  };
}
