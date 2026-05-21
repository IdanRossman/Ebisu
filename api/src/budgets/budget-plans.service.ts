import { Injectable } from '@nestjs/common';
import { throwIfSupabaseError } from '../common/supabase-error';
import { SupabaseService } from '../database/supabase.service';
import { CreateBudgetPlanDto } from './dto/create-budget-plan.dto';
import { UpdateBudgetPlanDto } from './dto/update-budget-plan.dto';

type BudgetPlanRow = {
  id: string;
  budget_space_id: string;
  name: string;
  period_type: CreateBudgetPlanDto['periodType'];
  starts_on: string;
  ends_on: string;
  currency_code: CreateBudgetPlanDto['currencyCode'];
  funding_amount: number | string | null;
  reserve_target_amount: number | string | null;
};

type BudgetAllocationRow = {
  budget_item_id: string;
  planned_amount: number | string;
};

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function atNoon(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function periodBoundsAfter(plan: BudgetPlanRow, todayKey: string) {
  let start = addDays(atNoon(plan.ends_on), 1);
  let end: Date;

  if (plan.period_type === 'monthly') {
    while (toDateKey(new Date(start.getFullYear(), start.getMonth() + 1, 0, 12)) < todayKey) {
      start = new Date(start.getFullYear(), start.getMonth() + 1, 1, 12);
    }
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 12);
  } else if (plan.period_type === 'weekly') {
    while (toDateKey(addDays(start, 6)) < todayKey) start = addDays(start, 7);
    end = addDays(start, 6);
  } else if (plan.period_type === 'biweekly') {
    while (toDateKey(addDays(start, 13)) < todayKey) start = addDays(start, 14);
    end = addDays(start, 13);
  } else {
    start = atNoon(todayKey);
    end = atNoon(todayKey);
  }

  return { startsOn: toDateKey(start), endsOn: toDateKey(end) };
}

@Injectable()
export class BudgetPlansService {
  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string) {
    const { data, error } = await this.supabase.client
      .from('budget_plans')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  }

  async findForSpace(budgetSpaceId: string) {
    const { data, error } = await this.supabase.client
      .from('budget_plans')
      .select('*')
      .eq('budget_space_id', budgetSpaceId)
      .order('starts_on', { ascending: false });
    throwIfSupabaseError(error);
    return data ?? [];
  }

  async findCurrentForSpace(budgetSpaceId: string, today = new Date()) {
    const plans = await this.findForSpace(budgetSpaceId) as BudgetPlanRow[];
    const latestPlan = plans[0] ?? null;
    if (!latestPlan) return null;

    const todayKey = toDateKey(today);
    if (latestPlan.ends_on >= todayKey || latestPlan.period_type === 'one_time') {
      return latestPlan;
    }

    return this.rollForwardPlan(latestPlan, todayKey);
  }

  private async rollForwardPlan(sourcePlan: BudgetPlanRow, todayKey: string) {
    const { startsOn, endsOn } = periodBoundsAfter(sourcePlan, todayKey);
    const existing = await this.findExistingPeriod(sourcePlan.budget_space_id, sourcePlan.period_type, startsOn, endsOn);
    if (existing) return existing;

    const { data: newPlan, error: planError } = await this.supabase.client
      .from('budget_plans')
      .insert({
        budget_space_id: sourcePlan.budget_space_id,
        name: sourcePlan.name,
        period_type: sourcePlan.period_type,
        starts_on: startsOn,
        ends_on: endsOn,
        currency_code: sourcePlan.currency_code,
        funding_amount: sourcePlan.funding_amount,
        reserve_target_amount: sourcePlan.reserve_target_amount,
      })
      .select()
      .single();
    if (planError?.code === '23505') {
      return this.findExistingPeriod(sourcePlan.budget_space_id, sourcePlan.period_type, startsOn, endsOn);
    }
    throwIfSupabaseError(planError);

    const { data: allocations, error: allocationsError } = await this.supabase.client
      .from('budget_plan_allocations')
      .select('budget_item_id,planned_amount')
      .eq('budget_plan_id', sourcePlan.id);
    throwIfSupabaseError(allocationsError);

    if (newPlan && allocations?.length) {
      const { error: copyError } = await this.supabase.client
        .from('budget_plan_allocations')
        .insert((allocations as BudgetAllocationRow[]).map((allocation) => ({
          budget_space_id: sourcePlan.budget_space_id,
          budget_plan_id: newPlan.id,
          budget_item_id: allocation.budget_item_id,
          planned_amount: allocation.planned_amount,
        })));
      throwIfSupabaseError(copyError);
    }

    return newPlan;
  }

  private async findExistingPeriod(
    budgetSpaceId: string,
    periodType: CreateBudgetPlanDto['periodType'],
    startsOn: string,
    endsOn: string,
  ) {
    const { data, error } = await this.supabase.client
      .from('budget_plans')
      .select('*')
      .eq('budget_space_id', budgetSpaceId)
      .eq('period_type', periodType)
      .eq('starts_on', startsOn)
      .eq('ends_on', endsOn)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  }

  async create(input: CreateBudgetPlanDto) {
    const { data, error } = await this.supabase.client
      .from('budget_plans')
      .insert({
        budget_space_id: input.budgetSpaceId,
        name: input.name,
        period_type: input.periodType,
        starts_on: input.startsOn,
        ends_on: input.endsOn,
        currency_code: input.currencyCode,
        funding_amount: input.fundingAmount ?? null,
        reserve_target_amount: input.reserveTargetAmount ?? null,
      })
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase.client.from('budget_plans').delete().eq('id', id);
    throwIfSupabaseError(error);
    return { deleted: true };
  }

  async update(id: string, input: UpdateBudgetPlanDto) {
    const { data, error } = await this.supabase.client
      .from('budget_plans')
      .update({
        ...(input.fundingAmount !== undefined ? { funding_amount: input.fundingAmount } : {}),
        ...(input.reserveTargetAmount !== undefined ? { reserve_target_amount: input.reserveTargetAmount } : {}),
        ...(input.currencyCode ? { currency_code: input.currencyCode } : {}),
      })
      .eq('id', id)
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }
}
