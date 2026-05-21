import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { SpacesService } from './spaces.service';

@Controller('spaces')
@UseGuards(SupabaseAuthGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  findAllForUser(@CurrentUser() user: AuthenticatedUser) {
    return this.spacesService.findAllForUser(user.id);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.spacesService.findById(id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateSpaceDto) {
    return this.spacesService.create(user.id, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateSpaceDto) {
    return this.spacesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.spacesService.remove(id);
  }
}
