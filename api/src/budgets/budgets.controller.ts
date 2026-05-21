import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { BudgetAllocationsService } from './budget-allocations.service';
import { BudgetItemsService } from './budget-items.service';
import { BudgetPlansService } from './budget-plans.service';
import { CreateBudgetPlanDto } from './dto/create-budget-plan.dto';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { ReplaceWatchTargetsDto } from './dto/replace-watch-targets.dto';
import { UpsertBudgetAllocationDto } from './dto/upsert-budget-allocation.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';
import { WatchTargetsService } from './watch-targets.service';
import { CreateShapedPlanDto } from './dto/create-shaped-plan.dto';
import { ShapedPlansService } from './shaped-plans.service';
import { UpdateBudgetPlanDto } from './dto/update-budget-plan.dto';
import { BudgetConfigurationService } from './budget-configuration.service';
import { UpdateBudgetConfigurationDto } from './dto/update-budget-configuration.dto';

@Controller('budgets')
@UseGuards(SupabaseAuthGuard)
export class BudgetsController {
  constructor(
    private readonly budgetPlansService: BudgetPlansService,
    private readonly budgetItemsService: BudgetItemsService,
    private readonly budgetAllocationsService: BudgetAllocationsService,
    private readonly watchTargetsService: WatchTargetsService,
    private readonly shapedPlansService: ShapedPlansService,
    private readonly budgetConfigurationService: BudgetConfigurationService,
  ) {}

  @Get()
  findPlansForSpace(@Query('spaceId') spaceId: string) {
    return this.budgetPlansService.findForSpace(spaceId);
  }

  @Get('items')
  findItems(@Query('spaceId') spaceId: string) {
    return this.budgetItemsService.findForSpace(spaceId);
  }

  @Get('watch-targets')
  findWatchTargets(@Query('spaceId') spaceId: string) {
    return this.watchTargetsService.findForSpace(spaceId);
  }

  @Get(':id')
  findPlanById(@Param('id') id: string) {
    return this.budgetPlansService.findById(id);
  }

  @Post()
  createPlan(@Body() body: CreateBudgetPlanDto) {
    return this.budgetPlansService.create(body);
  }

  @Post('shaped-plan')
  createShapedPlan(@Body() body: CreateShapedPlanDto) {
    return this.shapedPlansService.create(body);
  }

  @Delete(':id')
  removePlan(@Param('id') id: string) {
    return this.budgetPlansService.remove(id);
  }

  @Patch(':id')
  updatePlan(@Param('id') id: string, @Body() body: UpdateBudgetPlanDto) {
    return this.budgetPlansService.update(id, body);
  }

  @Put(':id/configuration')
  updateConfiguration(@Param('id') id: string, @Body() body: UpdateBudgetConfigurationDto) {
    return this.budgetConfigurationService.update(id, body);
  }

  @Post('items')
  createItem(@Body() body: CreateBudgetItemDto) {
    return this.budgetItemsService.create(body);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() body: UpdateBudgetItemDto) {
    return this.budgetItemsService.update(id, body);
  }

  @Delete('items/:id')
  archiveItem(@Param('id') id: string) {
    return this.budgetItemsService.archive(id);
  }

  @Get(':planId/allocations')
  findAllocations(@Param('planId') planId: string) {
    return this.budgetAllocationsService.findForPlan(planId);
  }

  @Put('allocations')
  upsertAllocation(@Body() body: UpsertBudgetAllocationDto) {
    return this.budgetAllocationsService.upsert(body);
  }

  @Put('watch-targets')
  replaceWatchTargets(@CurrentUser() user: AuthenticatedUser, @Body() body: ReplaceWatchTargetsDto) {
    return this.watchTargetsService.replaceForPlan(user.id, body);
  }
}
