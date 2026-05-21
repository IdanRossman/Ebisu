import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WatchTargetDto {
  @IsString()
  budgetItemId!: string;
}

export class ReplaceWatchTargetsDto {
  @IsString()
  budgetSpaceId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WatchTargetDto)
  targets!: WatchTargetDto[];
}
