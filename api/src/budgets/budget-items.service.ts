import { BadRequestException, Injectable } from '@nestjs/common';
import { throwIfSupabaseError } from '../common/supabase-error';
import { SupabaseService } from '../database/supabase.service';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';

const MAX_BUDGET_ITEM_DEPTH = 3;

@Injectable()
export class BudgetItemsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findForSpace(budgetSpaceId: string) {
    const { data, error } = await this.supabase.client
      .from('budget_items')
      .select('*')
      .eq('budget_space_id', budgetSpaceId)
      .order('sort_order', { ascending: true });
    throwIfSupabaseError(error);
    return data;
  }

  async create(input: CreateBudgetItemDto) {
    await this.assertDepthWithinLimit(input.parentId);

    const { data, error } = await this.supabase.client
      .from('budget_items')
      .insert({
        budget_space_id: input.budgetSpaceId,
        parent_id: input.parentId ?? null,
        section_key: input.sectionKey,
        name: input.name,
        sort_order: input.sortOrder ?? 0,
      })
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  async createTree(
    budgetSpaceId: string,
    items: Array<{
      clientId: string;
      parentClientId?: string;
      sectionKey: 'steady_obligations' | 'household_vessels';
      name: string;
      sortOrder: number;
    }>,
  ) {
    const { items: createdItems } = await this.createTreeWithClientIds(budgetSpaceId, items);
    return createdItems;
  }

  async createTreeWithClientIds(
    budgetSpaceId: string,
    items: Array<{
      clientId: string;
      parentClientId?: string;
      sectionKey: 'steady_obligations' | 'household_vessels';
      name: string;
      sortOrder: number;
    }>,
  ) {
    const createdIds = new Map<string, string>();
    const pending = [...items];

    while (pending.length > 0) {
      const readyIndex = pending.findIndex((item) => !item.parentClientId || createdIds.has(item.parentClientId));
      if (readyIndex === -1) {
        throw new BadRequestException('Budget item tree contains a missing parent or cycle.');
      }

      const [item] = pending.splice(readyIndex, 1);
      const created = await this.create({
        budgetSpaceId,
        parentId: item.parentClientId ? createdIds.get(item.parentClientId) : undefined,
        sectionKey: item.sectionKey,
        name: item.name,
        sortOrder: item.sortOrder,
      });
      createdIds.set(item.clientId, created.id);
    }

    return {
      items: await this.findForSpace(budgetSpaceId),
      createdIds,
    };
  }

  async update(id: string, input: UpdateBudgetItemDto) {
    const { data, error } = await this.supabase.client
      .from('budget_items')
      .update({
        ...(input.name ? { name: input.name } : {}),
      })
      .eq('id', id)
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  async archive(id: string) {
    const { data, error } = await this.supabase.client
      .from('budget_items')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  private async assertDepthWithinLimit(parentId?: string) {
    if (!parentId) return;

    let depth = 1;
    let currentParentId: string | null = parentId;

    while (currentParentId) {
      depth += 1;
      if (depth > MAX_BUDGET_ITEM_DEPTH) {
        throw new BadRequestException(`Budget items may only be nested ${MAX_BUDGET_ITEM_DEPTH} levels deep.`);
      }

      const { data, error } = await this.supabase.client
        .from('budget_items')
        .select('parent_id')
        .eq('id', currentParentId)
        .single();
      throwIfSupabaseError(error);
      currentParentId = data?.parent_id ?? null;
    }
  }
}
