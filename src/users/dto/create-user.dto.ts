import {
  IsAlpha,
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity.js';

export class CreateUserDto {
  @ApiProperty({ description: "The user's first name.", example: 'Ada' })
  @IsDefined()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: "The user's last name.", example: 'Lovelace' })
  @IsDefined()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: "The user's email address used for contact and login.",
    example: 'ada@example.com',
  })
  @IsDefined()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password for the new account.',
    example: 'correct-horse-battery-staple',
  })
  @IsDefined()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  password: string;

  @ApiProperty({
    description: 'The role assigned to the new user.',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
