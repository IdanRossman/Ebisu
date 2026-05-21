import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class UpsertProfileDto {
  @IsString()
  displayName!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  guidanceGoals?: string[];

  @IsIn(['living_money', 'whole_plan'])
  @IsOptional()
  homeProgressScope?: 'living_money' | 'whole_plan';

  @IsIn(['sunday', 'monday'])
  @IsOptional()
  weekStartsOn?: 'sunday' | 'monday';
}
