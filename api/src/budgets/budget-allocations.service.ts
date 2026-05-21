import { Injectable } from '@nestjs/common';
import { throwIfSupabaseError } from '../common/supabase-error';
import { SupabaseService } from '../database/supabase.service';
import { UpsertBudgetAllocationDto } from './dto/upsert-budget-allocation.dto';

@Injectable()
export class BudgetAllocationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findForPlan(budgetPlanId: string) {
    const { data, error } = await this.supabase.client
      .from('budget_plan_allocations')
      .select('*')
      .eq('budget_plan_id', budgetPlanId);
    throwIfSupabaseError(error);
    return data;
  }

  async upsert(input: UpsertBudgetAllocationDto) {
    const { data, error } = await this.supabase.client
      .from('budget_plan_allocations')
      .upsert({
        budget_space_id: input.budgetSpaceId,
        budget_plan_id: input.budgetPlanId,
        budget_item_id: input.budgetItemId,
        planned_amount: input.plannedAmount,
      }, { onConflict: 'budget_plan_id,budget_item_id' })
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }
}
