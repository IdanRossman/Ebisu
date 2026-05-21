import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  budgetSpaceId!: string;

  @IsString()
  budgetPlanId!: string;

  @IsString()
  budgetItemId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsOptional()
  categoryNameSnapshot?: string;

  @IsString()
  @IsOptional()
  subcategoryNameSnapshot?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  payeeName?: string;

  @IsDateString()
  spentOn!: string;

  @IsString()
  @IsOptional()
  sourceScheduleId?: string;
}
