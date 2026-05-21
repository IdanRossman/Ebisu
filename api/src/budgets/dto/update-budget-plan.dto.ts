import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateBudgetPlanDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  fundingAmount?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reserveTargetAmount?: number | null;

  @IsIn(['ILS', 'USD', 'EUR', 'GBP'])
  @IsOptional()
  currencyCode?: 'ILS' | 'USD' | 'EUR' | 'GBP';
}
