import {
  IsAlpha,
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserLocation, UserRole } from '../entities/user.entity.js';

export class CreateUserDto {
  @ApiProperty({
    description: "The user's email address used for contact and login.",
    example: 'ada@example.com',
    format: 'email',
  })
  @IsDefined()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "The user's first name.",
    example: 'Ada',
    maxLength: 50,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: "The user's last name.",
    example: 'Lovelace',
    maxLength: 50,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: "The user's Google profile image URL.",
    example: 'https://example.com/avatar.png',
    maxLength: 2048,
    format: 'uri',
  })
  @IsDefined()
  @IsNotEmpty()
  @IsUrl()
  @MaxLength(2048)
  avatarUrl: string;

  @ApiProperty({
    description: 'The role assigned to the new user.',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: "The user's closest office location.",
    enum: UserLocation,
    example: UserLocation.CEBU,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserLocation)
  location: UserLocation;
}
