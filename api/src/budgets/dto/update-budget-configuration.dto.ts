import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class UpdateBudgetConfigurationItemDto {
  @IsString()
  id!: string;

  @IsString()
  @IsOptional()
  parentId?: string | null;

  @IsIn(['steady_obligations', 'household_vessels'])
  sectionKey!: 'steady_obligations' | 'household_vessels';

  @IsString()
  name!: string;

  @IsNumber()
  sortOrder!: number;

  @IsNumber()
  @Min(0)
  plannedAmount!: number;

  @IsString()
  @IsOptional()
  archivedAt?: string | null;
}

export class UpdateBudgetConfigurationDto {
  @IsString()
  budgetSpaceId!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fundingAmount?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reserveTargetAmount?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBudgetConfigurationItemDto)
  items!: UpdateBudgetConfigurationItemDto[];
}
