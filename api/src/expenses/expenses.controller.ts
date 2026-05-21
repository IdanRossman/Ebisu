import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseScheduleDto } from './dto/create-expense-schedule.dto';
import { UpdateExpenseScheduleDto } from './dto/update-expense-schedule.dto';
import { ProcessDueSchedulesDto } from './dto/process-due-schedules.dto';
import { ExpenseOccurrencesService } from './expense-occurrences.service';
import { ExpenseSchedulesService } from './expense-schedules.service';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
@UseGuards(SupabaseAuthGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly expenseSchedulesService: ExpenseSchedulesService,
    private readonly expenseOccurrencesService: ExpenseOccurrencesService,
  ) {}

  @Get()
  findForPlan(@Query('planId') planId: string) {
    return this.expensesService.findForPlan(planId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateExpenseDto) {
    return this.expensesService.create(user.id, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateExpenseDto) {
    return this.expensesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }

  @Get('schedules')
  findSchedulesForSpace(@Query('spaceId') spaceId: string) {
    return this.expenseSchedulesService.findForSpace(spaceId);
  }

  @Post('schedules')
  createSchedule(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateExpenseScheduleDto) {
    return this.expenseSchedulesService.create(user.id, body);
  }

  @Patch('schedules/:id')
  updateSchedule(@Param('id') id: string, @Body() body: UpdateExpenseScheduleDto) {
    return this.expenseSchedulesService.update(id, body);
  }

  @Delete('schedules/:id')
  archiveSchedule(@Param('id') id: string) {
    return this.expenseSchedulesService.archive(id);
  }

  @Post('schedules/process-due')
  processDueSchedules(@Body() body: ProcessDueSchedulesDto) {
    return this.expenseSchedulesService.processDue(body.budgetSpaceId, body.throughDate);
  }

  @Get('occurrences')
  findOccurrencesForSpace(@Query('spaceId') spaceId: string) {
    return this.expenseOccurrencesService.findForSpace(spaceId);
  }
}
