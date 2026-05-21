import { Body, Controller, Delete, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { UpdateProfilePreferencesDto } from './dto/update-profile-preferences.dto';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('me')
@UseGuards(SupabaseAuthGuard)
export class MeController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  findCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.findById(user.id);
  }

  @Put()
  upsertCurrent(@CurrentUser() user: AuthenticatedUser, @Body() body: UpsertProfileDto) {
    return this.profilesService.upsert(user.id, body);
  }

  @Patch()
  updateCurrent(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateProfilePreferencesDto) {
    return this.profilesService.updatePreferences(user.id, body);
  }

  @Delete()
  removeCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.removeSelf(user.id);
  }
}
