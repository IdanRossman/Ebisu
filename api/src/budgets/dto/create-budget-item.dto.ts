import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBudgetItemDto {
  @IsString()
  budgetSpaceId!: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsIn(['steady_obligations', 'household_vessels'])
  sectionKey!: 'steady_obligations' | 'household_vessels';

  @IsString()
  name!: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
