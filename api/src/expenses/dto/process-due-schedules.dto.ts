import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ProcessDueSchedulesDto {
  @IsString()
  budgetSpaceId!: string;

  @IsDateString()
  @IsOptional()
  throughDate?: string;
}
