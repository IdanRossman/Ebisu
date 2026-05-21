import { IsIn, IsString } from 'class-validator';

export class CreateSpaceDto {
  @IsString()
  name!: string;

  @IsIn(['personal', 'shared'])
  spaceType!: 'personal' | 'shared';

  @IsIn(['ILS', 'USD', 'EUR', 'GBP'])
  currencyCode!: 'ILS' | 'USD' | 'EUR' | 'GBP';

}
