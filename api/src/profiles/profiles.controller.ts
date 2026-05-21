import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.profilesService.findById(id);
  }

  @Put(':id')
  upsert(@Param('id') id: string, @Body() body: UpsertProfileDto) {
    return this.profilesService.upsert(id, body);
  }
}
