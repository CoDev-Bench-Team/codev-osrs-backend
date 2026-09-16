import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'The Google OAuth ID token credential returned by Google Sign-In.',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6I...',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  credential: string;
}
