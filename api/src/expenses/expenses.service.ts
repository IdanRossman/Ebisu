import { BadRequestException, Injectable } from '@nestjs/common';
import { throwIfSupabaseError } from '../common/supabase-error';
import { SupabaseService } from '../database/supabase.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findForPlan(budgetPlanId: string) {
    const { data, error } = await this.supabase.client
      .from('expense_entries')
      .select('*')
      .eq('budget_plan_id', budgetPlanId)
      .order('spent_on', { ascending: false })
      .order('created_at', { ascending: false });
    throwIfSupabaseError(error);
    return data;
  }

  async create(userId: string, input: CreateExpenseDto) {
    const budgetSpaceId = await this.resolveExpenseSpace(input.budgetPlanId, input.budgetItemId);
    const insertPayload = {
      budget_space_id: budgetSpaceId,
      budget_plan_id: input.budgetPlanId,
      budget_item_id: input.budgetItemId,
      source_schedule_id: input.sourceScheduleId ?? null,
      category_name_snapshot: input.categoryNameSnapshot ?? null,
      subcategory_name_snapshot: input.subcategoryNameSnapshot ?? null,
      amount: input.amount,
      payee_name: input.payeeName ?? '',
      note: input.note ?? '',
      spent_on: input.spentOn,
      created_by: userId,
    };

    const { data, error } = await this.supabase.client
      .from('expense_entries')
      .insert(insertPayload)
      .select()
      .single();
    if (error?.message.includes('category_name_snapshot') || error?.message.includes('subcategory_name_snapshot')) {
      const {
        category_name_snapshot: _categoryNameSnapshot,
        subcategory_name_snapshot: _subcategoryNameSnapshot,
        ...legacyInsertPayload
      } = insertPayload;
      const { data: legacyData, error: legacyError } = await this.supabase.client
        .from('expense_entries')
        .insert(legacyInsertPayload)
        .select()
        .single();
      throwIfSupabaseError(legacyError);
      return legacyData;
    }
    throwIfSupabaseError(error);
    return data;
  }

  private async resolveExpenseSpace(budgetPlanId: string, budgetItemId: string) {
    const { data: plan, error: planError } = await this.supabase.client
      .from('budget_plans')
      .select('id,budget_space_id')
      .eq('id', budgetPlanId)
      .maybeSingle();
    throwIfSupabaseError(planError);
    if (!plan) {
      throw new BadRequestException('Budget plan was not found.');
    }

    const { data: item, error: itemError } = await this.supabase.client
      .from('budget_items')
      .select('id,budget_space_id')
      .eq('id', budgetItemId)
      .maybeSingle();
    throwIfSupabaseError(itemError);
    if (!item) {
      throw new BadRequestException('Budget item was not found.');
    }
    if (item.budget_space_id !== plan.budget_space_id) {
      throw new BadRequestException('Budget item does not belong to the selected budget space.');
    }

    return plan.budget_space_id as string;
  }

  async update(id: string, input: UpdateExpenseDto) {
    const patch: Record<string, unknown> = {};
    if (input.budgetItemId !== undefined) patch.budget_item_id = input.budgetItemId;
    if (input.categoryNameSnapshot !== undefined) patch.category_name_snapshot = input.categoryNameSnapshot ?? null;
    if (input.subcategoryNameSnapshot !== undefined) patch.subcategory_name_snapshot = input.subcategoryNameSnapshot ?? null;
    if (input.amount !== undefined) patch.amount = input.amount;
    if (input.payeeName !== undefined) patch.payee_name = input.payeeName ?? '';
    if (input.note !== undefined) patch.note = input.note ?? '';
    if (input.spentOn !== undefined) patch.spent_on = input.spentOn;

    const { data, error } = await this.supabase.client
      .from('expense_entries')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase.client.from('expense_entries').delete().eq('id', id);
    throwIfSupabaseError(error);
    return { deleted: true };
  }
}
