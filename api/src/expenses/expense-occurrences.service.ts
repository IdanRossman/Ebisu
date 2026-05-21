import { Injectable } from '@nestjs/common';
import { throwIfSupabaseError } from '../common/supabase-error';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class ExpenseOccurrencesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findForSpace(budgetSpaceId: string) {
    const { data, error } = await this.supabase.client
      .from('expense_occurrences')
      .select('*')
      .eq('budget_space_id', budgetSpaceId)
      .order('due_on', { ascending: true });
    throwIfSupabaseError(error);
    return data;
  }

  async createPlannedOccurrence(input: {
    budgetSpaceId: string;
    budgetItemId: string;
    sourceScheduleId: string;
    name: string;
    amount: number;
    dueOn: string;
    note: string;
  }) {
    const { data, error } = await this.supabase.client
      .from('expense_occurrences')
      .upsert({
        budget_space_id: input.budgetSpaceId,
        budget_item_id: input.budgetItemId,
        source_schedule_id: input.sourceScheduleId,
        name: input.name,
        amount: input.amount,
        due_on: input.dueOn,
        note: input.note,
        status: 'planned',
      }, {
        onConflict: 'source_schedule_id,due_on',
        ignoreDuplicates: true,
      })
      .select()
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  }
}
