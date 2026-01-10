import { Controller, Get, Post, Param, Delete, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SavedService } from './saved.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';

@UseGuards(AuthGuard('jwt')) // Protect all routes in this controller
@Controller('saved')
export class SavedController {
  constructor(private readonly savedService: SavedService) {}

  @Post(':propertyId')
  create(@GetUser() user: User, @Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.savedService.create(user.id, propertyId);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.savedService.findAll(user.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT) // Return 204 No Content on successful deletion
  @Delete(':propertyId')
  remove(@GetUser() user: User, @Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.savedService.remove(user.id, propertyId);
  }
}