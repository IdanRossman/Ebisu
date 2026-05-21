import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ExpenseSchedulesService } from './expense-schedules.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { ExpenseOccurrencesService } from './expense-occurrences.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseSchedulesService, ExpenseOccurrencesService],
  exports: [ExpensesService, ExpenseSchedulesService, ExpenseOccurrencesService],
})
export class ExpensesModule {}
