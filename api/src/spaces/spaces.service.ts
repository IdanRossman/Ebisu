import { Injectable } from '@nestjs/common';
import { throwIfSupabaseError } from '../common/supabase-error';
import { SupabaseService } from '../database/supabase.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAllForUser(userId: string) {
    const { data, error } = await this.supabase.client
      .from('budget_spaces')
      .select('*, budget_space_members!inner(user_id, role)')
      .eq('budget_space_members.user_id', userId)
      .order('created_at', { ascending: true });
    throwIfSupabaseError(error);
    return data ?? [];
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.client
      .from('budget_spaces')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  }

  async create(userId: string, input: CreateSpaceDto) {
    const { data: space, error: spaceError } = await this.supabase.client
      .from('budget_spaces')
      .insert({
        name: input.name,
        space_type: input.spaceType,
        currency_code: input.currencyCode,
        created_by: userId,
      })
      .select()
      .single();
    throwIfSupabaseError(spaceError);

    const { error: memberError } = await this.supabase.client
      .from('budget_space_members')
      .insert({
        budget_space_id: space.id,
        user_id: userId,
        role: 'owner',
      });
    throwIfSupabaseError(memberError);
    return space;
  }

  async update(id: string, input: UpdateSpaceDto) {
    const { data, error } = await this.supabase.client
      .from('budget_spaces')
      .update({
        ...(input.name ? { name: input.name } : {}),
        ...(input.currencyCode ? { currency_code: input.currencyCode } : {}),
      })
      .eq('id', id)
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase.client.from('budget_spaces').delete().eq('id', id);
    throwIfSupabaseError(error);
    return { deleted: true };
  }
}
