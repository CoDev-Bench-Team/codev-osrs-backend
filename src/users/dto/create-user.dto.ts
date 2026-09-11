import {
  IsAlpha,
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity.js';

export class CreateUserDto {
  @IsDefined()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  firstName: string;

  @IsDefined()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  lastName: string;

  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  password: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
