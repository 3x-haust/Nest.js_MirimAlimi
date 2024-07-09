import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(
      createUserDto.email,
      createUserDto.name,
      createUserDto.role,
      createUserDto.classId,
    );
  }

  @Get(':uid')
  async getUserByUid(@Param('uid') uid: string) {
    return this.usersService.getUserByUid(uid);
  }

  @Put(':id')
  @Roles('admin')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Get()
  @Roles('admin')
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }
}
