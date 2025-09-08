import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: Prisma.UserCreateInput) {
    return this.databaseService.user.create({ data: createUserDto });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.databaseService.user.update({
      where: { id },
      data,
    });
  }

  // Finds a user by their email address
  async findByEmail(email: string) {
    return this.databaseService.user.findUnique({
      where: {
        email,
      },
    });
  }

  // Finds a user by their unique ID
  async findById(id: string) {
    return this.databaseService.user.findUnique({
      where: {
        id,
      },
    });
  }
}