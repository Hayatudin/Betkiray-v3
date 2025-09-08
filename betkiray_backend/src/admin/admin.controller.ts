// src/admin/admin.controller.ts
import { Controller, Get, UseGuards, Patch, Param, Body, ParseIntPipe, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

// Apply JWT authentication and the new RolesGuard to the entire controller
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(Role.ADMIN) // This endpoint now requires the ADMIN role
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/status')
  @Roles(Role.ADMIN) // This endpoint also requires the ADMIN role
  updateUserStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, updateUserStatusDto);
  }

  @Get('properties')
  @Roles(Role.ADMIN)
  getAllProperties() {
    return this.adminService.getAllProperties();
  }

  // --- AND ADD THIS ENDPOINT ---
  @Delete('properties/:id')
  @Roles(Role.ADMIN)
  deleteProperty(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteProperty(id);
  }

  @Get('feedback')
  @Roles(Role.ADMIN)
  getAllFeedback() {
    return this.adminService.getAllFeedback();
  }

  // --- AND ADD THIS ENDPOINT ---
  @Delete('feedback/:id')
  @Roles(Role.ADMIN)
  deleteFeedback(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteFeedback(id);
  }
}