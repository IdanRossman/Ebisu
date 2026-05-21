import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { BudgetAllocationsService } from './budget-allocations.service';
import { BudgetItemsService } from './budget-items.service';
import { BudgetPlansService } from './budget-plans.service';
import { BudgetsController } from './budgets.controller';
import { WatchTargetsService } from './watch-targets.service';
import { ShapedPlansService } from './shaped-plans.service';
import { BudgetConfigurationService } from './budget-configuration.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [BudgetsController],
  providers: [BudgetPlansService, BudgetItemsService, BudgetAllocationsService, WatchTargetsService, ShapedPlansService, BudgetConfigurationService],
  exports: [BudgetPlansService, BudgetItemsService, BudgetAllocationsService, WatchTargetsService, ShapedPlansService, BudgetConfigurationService],
})
export class BudgetsModule {}
