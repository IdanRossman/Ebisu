import { Injectable } from '@nestjs/common';
import { throwIfSupabaseError } from '../common/supabase-error';
import { SupabaseService } from '../database/supabase.service';
import { UpdateProfilePreferencesDto } from './dto/update-profile-preferences.dto';
import { UpsertProfileDto } from './dto/upsert-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  }

  async upsert(id: string, input: UpsertProfileDto) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .upsert({
        id,
        display_name: input.displayName,
        guidance_goals: input.guidanceGoals ?? [],
        ...(input.homeProgressScope ? { home_progress_scope: input.homeProgressScope } : {}),
        ...(input.weekStartsOn ? { week_starts_on: input.weekStartsOn } : {}),
        onboarding_completed_at: new Date().toISOString(),
      })
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  async updatePreferences(id: string, input: UpdateProfilePreferencesDto) {
    const patch = {
      ...(input.displayName !== undefined ? { display_name: input.displayName } : {}),
      ...(input.guidanceGoals !== undefined ? { guidance_goals: input.guidanceGoals } : {}),
      ...(input.homeProgressScope !== undefined ? { home_progress_scope: input.homeProgressScope } : {}),
      ...(input.weekStartsOn !== undefined ? { week_starts_on: input.weekStartsOn } : {}),
    };

    const { data, error } = await this.supabase.client
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  async removeSelf(id: string) {
    const { error: spacesError } = await this.supabase.client
      .from('budget_spaces')
      .delete()
      .eq('created_by', id);
    throwIfSupabaseError(spacesError);

    const { data, error } = await this.supabase.client.auth.admin.deleteUser(id);
    if (error) throw error;
    return {
      deleted: true,
      userId: data.user?.id ?? id,
    };
  }
}
