import { Injectable } from '@nestjs/common';
import { throwIfSupabaseError } from '../common/supabase-error';
import { SupabaseService } from '../database/supabase.service';
import { UpdateBudgetConfigurationDto } from './dto/update-budget-configuration.dto';

@Injectable()
export class BudgetConfigurationService {
  constructor(private readonly supabase: SupabaseService) {}

  async update(planId: string, input: UpdateBudgetConfigurationDto) {
    const now = new Date().toISOString();

    const { error: planError } = await this.supabase.client
      .from('budget_plans')
      .update({
        funding_amount: input.fundingAmount ?? null,
        reserve_target_amount: input.reserveTargetAmount ?? null,
        updated_at: now,
      })
      .eq('id', planId);
    throwIfSupabaseError(planError);

    const existingIds = new Set<string>();
    const createdIds = new Map<string, string>();
    const parentRows = input.items.filter((item) => !item.parentId);
    const childRows = input.items.filter((item) => item.parentId);

    for (const item of parentRows) {
      const id = await this.upsertItem(input.budgetSpaceId, item, null, now);
      existingIds.add(id);
      createdIds.set(item.id, id);
      await this.upsertAllocation(input.budgetSpaceId, planId, id, item.plannedAmount);
    }

    for (const item of childRows) {
      const parentId = createdIds.get(item.parentId as string) ?? item.parentId;
      const id = await this.upsertItem(input.budgetSpaceId, item, parentId ?? null, now);
      existingIds.add(id);
      createdIds.set(item.id, id);
      await this.upsertAllocation(input.budgetSpaceId, planId, id, item.plannedAmount);
    }

    const { data: currentItems, error: currentItemsError } = await this.supabase.client
      .from('budget_items')
      .select('id')
      .eq('budget_space_id', input.budgetSpaceId)
      .is('archived_at', null);
    throwIfSupabaseError(currentItemsError);

    const archivedIds = (currentItems ?? [])
      .map((item) => item.id)
      .filter((id) => !existingIds.has(id));

    if (archivedIds.length) {
      const { error: archiveError } = await this.supabase.client
        .from('budget_items')
        .update({ archived_at: now })
        .in('id', archivedIds);
      throwIfSupabaseError(archiveError);
    }

    return { updated: true };
  }

  private async upsertItem(
    budgetSpaceId: string,
    item: UpdateBudgetConfigurationDto['items'][number],
    parentId: string | null,
    now: string,
  ) {
    if (item.id.startsWith('draft-')) {
      const { data, error } = await this.supabase.client
        .from('budget_items')
        .insert({
          budget_space_id: budgetSpaceId,
          parent_id: parentId,
          section_key: item.sectionKey,
          name: item.name,
          sort_order: item.sortOrder,
          archived_at: item.archivedAt ?? null,
        })
        .select('id')
        .single();
      throwIfSupabaseError(error);
      if (!data) {
        throw new Error('Budget item was not created.');
      }
      return data.id as string;
    }

    const { error } = await this.supabase.client
      .from('budget_items')
      .update({
        parent_id: parentId,
        section_key: item.sectionKey,
        name: item.name,
        sort_order: item.sortOrder,
        archived_at: item.archivedAt ?? null,
      })
      .eq('id', item.id);
    throwIfSupabaseError(error);
    return item.id;
  }

  private async upsertAllocation(
    budgetSpaceId: string,
    budgetPlanId: string,
    budgetItemId: string,
    plannedAmount: number,
  ) {
    const { error } = await this.supabase.client
      .from('budget_plan_allocations')
      .upsert({
        budget_space_id: budgetSpaceId,
        budget_plan_id: budgetPlanId,
        budget_item_id: budgetItemId,
        planned_amount: plannedAmount,
      }, { onConflict: 'budget_plan_id,budget_item_id' });
    throwIfSupabaseError(error);
  }
}
