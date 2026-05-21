import { IsNumber, IsString, Min } from 'class-validator';

export class UpsertBudgetAllocationDto {
  @IsString()
  budgetSpaceId!: string;

  @IsString()
  budgetPlanId!: string;

  @IsString()
  budgetItemId!: string;

  @IsNumber()
  @Min(0)
  plannedAmount!: number;
}
