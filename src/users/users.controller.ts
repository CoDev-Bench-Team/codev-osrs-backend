import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

/**
 * Controller for managing user records and user-related API operations.
 *
 * Provides endpoints to list, retrieve, create, update, and delete users.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Retrieves all users in the system.
   *
   * @returns A list of all registered users.
   */
  @Get()
  list() {
    return this.usersService.list();
  }

  /**
   * Fetches a single user by their numeric identifier.
   *
   * @param id The unique ID of the user to retrieve.
   * @returns The matching user record.
   */
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.find(id);
  }

  /**
   * Creates a new user using the supplied account details.
   *
   * @param createUserDto The user data required to register a new account.
   * @returns The newly created user record.
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Updates an existing user's profile information.
   *
   * @param id The ID of the user to update.
   * @param updateUserDto The fields to change on the target user.
   * @returns The updated user record.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Removes a user from the system by ID.
   *
   * @param id The unique ID of the user to delete.
   * @returns The deleted user record or deletion result.
   */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}
