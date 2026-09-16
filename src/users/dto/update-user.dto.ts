import {
  IsAlpha,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity.js';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'The updated first name for the user.',
    example: 'Ada',
    maxLength: 50,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  firstName: string;

  @ApiPropertyOptional({
    description: 'The updated last name for the user.',
    example: 'Lovelace',
    maxLength: 50,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsAlpha()
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    description: 'The updated role assigned to the user.',
    enum: UserRole,
    example: UserRole.EMPLOYEE,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
