import { IsOptional, IsString } from 'class-validator';

export class UpdateBudgetItemDto {
  @IsString()
  @IsOptional()
  name?: string;
}
