import {
  IsAlpha,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity.js';

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  firstName: string;

  @IsOptional()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  lastName: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
