import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateExpenseScheduleDto {
  @IsString()
  @IsOptional()
  budgetItemId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @IsIn(['one_time', 'recurring'])
  @IsOptional()
  scheduleType?: 'one_time' | 'recurring';

  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsNumber()
  @Min(1)
  @IsOptional()
  recurrenceInterval?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  recurrenceDayOfMonth?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  recurrenceWeekday?: number;

  @IsDateString()
  @IsOptional()
  startsOn?: string;

  @IsDateString()
  @IsOptional()
  endsOn?: string;

  @IsDateString()
  @IsOptional()
  nextDueOn?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
