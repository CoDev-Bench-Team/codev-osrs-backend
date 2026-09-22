import { IsDefined, IsInt, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestItemDto {
  @ApiProperty({ description: 'The ID of the requested asset.', example: 1 })
  @IsDefined()
  @IsInt()
  @IsPositive()
  assetId: number;

  @ApiProperty({ description: 'The quantity requested.', example: 1 })
  @IsDefined()
  @IsInt()
  @Min(1)
  quantity: number;
}
