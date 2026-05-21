import { Injectable } from '@nestjs/common';
import { BudgetAllocationsService } from './budget-allocations.service';
import { BudgetItemsService } from './budget-items.service';
import { BudgetPlansService } from './budget-plans.service';
import { CreateShapedPlanDto } from './dto/create-shaped-plan.dto';

@Injectable()
export class ShapedPlansService {
  constructor(
    private readonly budgetPlansService: BudgetPlansService,
    private readonly budgetItemsService: BudgetItemsService,
    private readonly budgetAllocationsService: BudgetAllocationsService,
  ) {}

  async create(input: CreateShapedPlanDto) {
    const plan = await this.budgetPlansService.create(input);
    const { items, createdIds } = await this.budgetItemsService.createTreeWithClientIds(
      input.budgetSpaceId,
      input.items.map(({ plannedAmount: _plannedAmount, ...item }) => item),
    );

    const allocations = await Promise.all(
      input.items.map((item) => this.budgetAllocationsService.upsert({
        budgetSpaceId: input.budgetSpaceId,
        budgetPlanId: plan.id,
        budgetItemId: createdIds.get(item.clientId) as string,
        plannedAmount: item.plannedAmount,
      })),
    );

    return { plan, items, allocations };
  }
}
