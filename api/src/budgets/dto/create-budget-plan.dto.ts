import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBudgetPlanDto {
  @IsString()
  budgetSpaceId!: string;

  @IsString()
  name!: string;

  @IsIn(['monthly', 'weekly', 'biweekly', 'daily', 'one_time'])
  periodType!: 'monthly' | 'weekly' | 'biweekly' | 'daily' | 'one_time';

  @IsDateString()
  startsOn!: string;

  @IsDateString()
  endsOn!: string;

  @IsIn(['ILS', 'USD', 'EUR', 'GBP'])
  currencyCode!: 'ILS' | 'USD' | 'EUR' | 'GBP';

  @IsNumber()
  @Min(0)
  @IsOptional()
  fundingAmount?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reserveTargetAmount?: number | null;
}
