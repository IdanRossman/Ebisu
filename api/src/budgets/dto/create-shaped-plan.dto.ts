import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CreateBudgetPlanDto } from './create-budget-plan.dto';

export class CreateShapedPlanItemDto {
  @IsString()
  clientId!: string;

  @IsString()
  @IsOptional()
  parentClientId?: string;

  @IsIn(['steady_obligations', 'household_vessels'])
  sectionKey!: 'steady_obligations' | 'household_vessels';

  @IsString()
  name!: string;

  @IsNumber()
  sortOrder!: number;

  @IsNumber()
  @Min(0)
  plannedAmount!: number;
}

export class CreateShapedPlanDto extends CreateBudgetPlanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShapedPlanItemDto)
  items!: CreateShapedPlanItemDto[];
}
