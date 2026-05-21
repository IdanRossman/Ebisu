import { Controller, Get, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { BootstrapService } from './bootstrap.service';

@Controller('bootstrap')
@UseGuards(SupabaseAuthGuard)
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.bootstrapService.get(user.id);
  }
}
