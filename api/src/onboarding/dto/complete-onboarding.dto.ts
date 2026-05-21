import { IsArray, IsIn, IsString } from 'class-validator';

export class CompleteOnboardingDto {
  @IsString()
  displayName!: string;

  @IsArray()
  @IsString({ each: true })
  guidanceGoals!: string[];

  @IsIn(['ILS', 'USD', 'EUR', 'GBP'])
  currencyCode!: 'ILS' | 'USD' | 'EUR' | 'GBP';
}
