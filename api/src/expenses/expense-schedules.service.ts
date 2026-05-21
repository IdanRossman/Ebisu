import { Injectable } from '@nestjs/common';
import { throwIfSupabaseError } from '../common/supabase-error';
import { SupabaseService } from '../database/supabase.service';
import { CreateExpenseScheduleDto } from './dto/create-expense-schedule.dto';
import { UpdateExpenseScheduleDto } from './dto/update-expense-schedule.dto';
import { ExpenseOccurrencesService } from './expense-occurrences.service';
import { advanceDueDate, type RecurrenceFrequency } from './expense-recurrence';

@Injectable()
export class ExpenseSchedulesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly expenseOccurrencesService: ExpenseOccurrencesService,
  ) {}

  async findForSpace(budgetSpaceId: string) {
    const { data, error } = await this.supabase.client
      .from('expense_schedules')
      .select('*')
      .eq('budget_space_id', budgetSpaceId)
      .order('next_due_on', { ascending: true });
    throwIfSupabaseError(error);
    return data;
  }

  async create(userId: string, input: CreateExpenseScheduleDto) {
    const { data, error } = await this.supabase.client
      .from('expense_schedules')
      .insert({
        budget_space_id: input.budgetSpaceId,
        budget_item_id: input.budgetItemId,
        name: input.name,
        amount: input.amount,
        schedule_type: input.scheduleType,
        recurrence_frequency: input.recurrenceFrequency ?? null,
        recurrence_interval: input.recurrenceInterval ?? 1,
        recurrence_day_of_month: input.recurrenceDayOfMonth ?? null,
        recurrence_weekday: input.recurrenceWeekday ?? null,
        starts_on: input.startsOn,
        ends_on: input.endsOn ?? null,
        next_due_on: input.nextDueOn,
        note: input.note ?? '',
        created_by: userId,
      })
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  async update(id: string, input: UpdateExpenseScheduleDto) {
    const { data, error } = await this.supabase.client
      .from('expense_schedules')
      .update({
        ...(input.budgetItemId ? { budget_item_id: input.budgetItemId } : {}),
        ...(input.name ? { name: input.name } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.scheduleType ? { schedule_type: input.scheduleType } : {}),
        ...(input.recurrenceFrequency !== undefined ? { recurrence_frequency: input.recurrenceFrequency } : {}),
        ...(input.recurrenceInterval !== undefined ? { recurrence_interval: input.recurrenceInterval } : {}),
        ...(input.recurrenceDayOfMonth !== undefined ? { recurrence_day_of_month: input.recurrenceDayOfMonth } : {}),
        ...(input.recurrenceWeekday !== undefined ? { recurrence_weekday: input.recurrenceWeekday } : {}),
        ...(input.startsOn ? { starts_on: input.startsOn } : {}),
        ...(input.endsOn !== undefined ? { ends_on: input.endsOn } : {}),
        ...(input.nextDueOn ? { next_due_on: input.nextDueOn } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
      })
      .eq('id', id)
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  async archive(id: string) {
    const { data, error } = await this.supabase.client
      .from('expense_schedules')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    throwIfSupabaseError(error);
    return data;
  }

  async processDue(budgetSpaceId: string, throughDate = new Date().toISOString().slice(0, 10)) {
    const { data: schedules, error } = await this.supabase.client
      .from('expense_schedules')
      .select('*')
      .eq('budget_space_id', budgetSpaceId)
      .eq('schedule_type', 'recurring')
      .is('archived_at', null)
      .lte('next_due_on', throughDate)
      .order('next_due_on', { ascending: true });
    throwIfSupabaseError(error);

    let createdOccurrences = 0;
    let advancedSchedules = 0;

    for (const schedule of schedules ?? []) {
      let nextDueOn = schedule.next_due_on as string;
      const frequency = schedule.recurrence_frequency as RecurrenceFrequency;
      const interval = Number(schedule.recurrence_interval ?? 1);
      let advanced = false;

      while (nextDueOn <= throughDate && (!schedule.ends_on || nextDueOn <= schedule.ends_on)) {
        const occurrence = await this.expenseOccurrencesService.createPlannedOccurrence({
          budgetSpaceId: schedule.budget_space_id,
          budgetItemId: schedule.budget_item_id,
          sourceScheduleId: schedule.id,
          name: schedule.name,
          amount: Number(schedule.amount),
          dueOn: nextDueOn,
          note: schedule.note ?? '',
        });
        if (occurrence) createdOccurrences += 1;
        nextDueOn = advanceDueDate(nextDueOn, frequency, interval, schedule.recurrence_day_of_month);
        advanced = true;
      }

      if (advanced) {
        const { error: updateError } = await this.supabase.client
          .from('expense_schedules')
          .update({ next_due_on: nextDueOn })
          .eq('id', schedule.id);
        throwIfSupabaseError(updateError);
        advancedSchedules += 1;
      }
    }

    return { createdOccurrences, advancedSchedules, throughDate };
  }
}
