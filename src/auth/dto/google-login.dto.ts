import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'The Google OAuth credential.' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  credential: string;
}
