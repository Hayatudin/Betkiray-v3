// src/notifications/notifications.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { RegisterPushDto } from './dto/register-push.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  register(@GetUser() user: User, @Body() registerPushDto: RegisterPushDto) {
    return this.notificationsService.registerPushToken(user.id, registerPushDto.token);
  }
}