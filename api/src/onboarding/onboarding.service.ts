import { Injectable } from '@nestjs/common';
import { ProfilesService } from '../profiles/profiles.service';
import { SpacesService } from '../spaces/spaces.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly spacesService: SpacesService,
  ) {}

  async complete(userId: string, input: CompleteOnboardingDto) {
    const profile = await this.profilesService.upsert(userId, {
      displayName: input.displayName,
      guidanceGoals: input.guidanceGoals,
    });

    const existingSpaces = await this.spacesService.findAllForUser(userId);
    const space = existingSpaces[0] ?? await this.spacesService.create(userId, {
      name: `${input.displayName}'s household`,
      spaceType: 'shared',
      currencyCode: input.currencyCode,
    });

    return { profile, space };
  }
}
