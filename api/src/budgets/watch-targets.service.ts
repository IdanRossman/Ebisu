import { Injectable } from '@nestjs/common';
import { throwIfSupabaseError } from '../common/supabase-error';
import { SupabaseService } from '../database/supabase.service';
import { ReplaceWatchTargetsDto } from './dto/replace-watch-targets.dto';

@Injectable()
export class WatchTargetsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findForSpace(budgetSpaceId: string) {
    const { data, error } = await this.supabase.client
      .from('budget_watch_targets')
      .select('*')
      .eq('budget_space_id', budgetSpaceId)
      .order('created_at', { ascending: true });
    throwIfSupabaseError(error);
    return data;
  }

  async replaceForPlan(userId: string, input: ReplaceWatchTargetsDto) {
    const { error: deleteError } = await this.supabase.client
      .from('budget_watch_targets')
      .delete()
      .eq('budget_space_id', input.budgetSpaceId);
    throwIfSupabaseError(deleteError);

    if (input.targets.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('budget_watch_targets')
      .insert(input.targets.map((target) => ({
        budget_space_id: input.budgetSpaceId,
        budget_item_id: target.budgetItemId,
        created_by: userId,
      })))
      .select();
    throwIfSupabaseError(error);
    return data;
  }
}
