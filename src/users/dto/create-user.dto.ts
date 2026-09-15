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

/**
 * Payload used to create a new user account.
 *
 * Includes the required personal details, login email, password, and permission role.
 */
export class CreateUserDto {
  /**
   * The user's first name.
   */
  @IsDefined()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  firstName: string;

  /**
   * The user's last name.
   */
  @IsDefined()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  lastName: string;

  /**
   * The user's email address used for contact and login.
   */
  @IsDefined()
  @IsEmail()
  email: string;

  /**
   * The password for the new account.
   */
  @IsDefined()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  password: string;

  /**
   * The role assigned to the new user.
   */
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
