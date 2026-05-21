import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateSpaceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsIn(['ILS', 'USD', 'EUR', 'GBP'])
  @IsOptional()
  currencyCode?: 'ILS' | 'USD' | 'EUR' | 'GBP';
}
