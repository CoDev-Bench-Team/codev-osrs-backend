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
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { User } from './entities/user.entity.js';
import { ApiValidationProblemResponse } from '../common/api-validation-problem-response.decorator.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Retrieves all users in the system.' })
  @ApiOkResponse({
    description: 'The users in the system.',
    type: User,
    isArray: true,
  })
  @Roles('admin')
  @Get()
  list() {
    return this.usersService.list();
  }

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Fetches a single user by their numeric identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'The numeric user identifier.',
    type: Number,
  })
  @ApiOkResponse({ description: 'The requested user.', type: User })
  @Roles('admin')
  @Get(':id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.find(id);
  }

  @ApiCookieAuth('session')
  @ApiOperation({
    summary: 'Creates a new user using the supplied account details.',
  })
  @ApiValidationProblemResponse(CreateUserDto)
  @ApiCreatedResponse({ description: 'The newly created user.', type: User })
  @Roles('admin')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiCookieAuth('session')
  @ApiOperation({ summary: "Updates an existing user's profile information." })
  @ApiValidationProblemResponse(UpdateUserDto)
  @ApiParam({
    name: 'id',
    description: 'The numeric user identifier.',
    type: Number,
  })
  @ApiOkResponse({ description: 'The updated user.', type: User })
  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Removes a user from the system by ID.' })
  @ApiParam({
    name: 'id',
    description: 'The numeric user identifier.',
    type: Number,
  })
  @ApiOkResponse({ description: 'The removed user.', type: User })
  @Roles('admin')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}
