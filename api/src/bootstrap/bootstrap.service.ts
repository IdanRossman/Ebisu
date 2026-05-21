import { Injectable } from '@nestjs/common';
import { BudgetPlansService } from '../budgets/budget-plans.service';
import { ProfilesService } from '../profiles/profiles.service';
import { SpacesService } from '../spaces/spaces.service';

@Injectable()
export class BootstrapService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly spacesService: SpacesService,
    private readonly budgetPlansService: BudgetPlansService,
  ) {}

  async get(userId: string) {
    const profile = await this.profilesService.findById(userId);
    const spaces = await this.spacesService.findAllForUser(userId);
    const currentSpace = spaces[0] ?? null;
    const currentPlan = currentSpace
      ? await this.budgetPlansService.findCurrentForSpace(currentSpace.id)
      : null;

    return {
      profile,
      onboardingComplete: !!profile?.onboarding_completed_at,
      currentSpace,
      currentPlan,
    };
  }
}
