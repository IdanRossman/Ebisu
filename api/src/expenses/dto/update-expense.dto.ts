import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  budgetItemId?: string;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  categoryNameSnapshot?: string | null;

  @IsString()
  @IsOptional()
  subcategoryNameSnapshot?: string | null;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  payeeName?: string;

  @IsDateString()
  @IsOptional()
  spentOn?: string;
}
