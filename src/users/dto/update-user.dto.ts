import {
  IsAlpha,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity.js';

/**
 * Partial payload for updating an existing user's record.
 *
 * Any provided field will replace the corresponding value on the target user.
 */
export class UpdateUserDto {
  /**
   * The updated first name for the user.
   */
  @IsOptional()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  firstName: string;

  /**
   * The updated last name for the user.
   */
  @IsOptional()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  lastName: string;

  /**
   * The updated role assigned to the user.
   */
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
