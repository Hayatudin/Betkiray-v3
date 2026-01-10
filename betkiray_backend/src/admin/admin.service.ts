// src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class AdminService {
  constructor(private readonly databaseService: DatabaseService) { }

  async getAllUsers() {
    return this.databaseService.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getUserById(userId: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          include: {
            media: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      propertyCount: user.properties.length,
    };
  }

  async getAllFeedback() {
    return this.databaseService.feedback.findMany({
      // Include the user's details so the admin knows who sent the feedback
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Show the newest feedback first
      },
    });
  }

  // --- AND ADD THIS METHOD ---
  async deleteFeedback(feedbackId: number) {
    // Check if feedback exists before attempting to delete
    const feedback = await this.databaseService.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${feedbackId} not found.`);
    }

    return this.databaseService.feedback.delete({
      where: { id: feedbackId },
    });
  }

  async getAllProperties() {
    return this.databaseService.property.findMany({
      // Include some related data that will be useful for the admin UI
      include: {
        owner: {
          select: {
            name: true, // Get the name of the property owner
            email: true,
          },
        },
        media: {
          orderBy: {
            sortOrder: 'asc', // Ensure the first image is the cover image
          },
          take: 1, // We only need the first image for the list view
        },
      },
      orderBy: {
        createdAt: 'desc', // Show the newest properties first
      },
    });
  }

  async getPendingProperties() {
    return this.databaseService.property.findMany({
      where: { approvalStatus: 'PENDING' },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        media: {
          orderBy: {
            sortOrder: 'asc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approveProperty(propertyId: number) {
    const property = await this.databaseService.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found.`);
    }

    return this.databaseService.property.update({
      where: { id: propertyId },
      data: {
        approvalStatus: 'APPROVED',
        rejectionReason: null // Clear any previous rejection reason
      },
    });
  }

  async rejectProperty(propertyId: number, reason?: string) {
    const property = await this.databaseService.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found.`);
    }

    return this.databaseService.property.update({
      where: { id: propertyId },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: reason
      },
    });
  }

  // --- AND ADD THIS METHOD ---
  async deleteProperty(propertyId: number) {
    // First, check if the property exists to give a clear error message
    const property = await this.databaseService.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found.`);
    }

    // Note: In a production app, you would also add code here to delete
    // the associated images from your './uploads' folder.

    // Prisma's 'onDelete: Cascade' will handle deleting related media, reviews, etc.
    return this.databaseService.property.delete({
      where: { id: propertyId },
    });
  }

  async updateUserStatus(userId: string, updateUserStatusDto: UpdateUserStatusDto) {
    const user = await this.databaseService.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    return this.databaseService.user.update({
      where: { id: userId },
      data: { isBanned: updateUserStatusDto.isBanned },
      select: { id: true, isBanned: true }, // Return only what's necessary
    });
  }

  async getStats() {
    // Get total properties count
    const totalProperties = await this.databaseService.property.count();

    // Get pending approvals count
    const pendingApprovals = await this.databaseService.property.count({
      where: { approvalStatus: 'PENDING' },
    });

    // Get total users count
    const totalUsers = await this.databaseService.user.count();

    // Calculate monthly earnings
    // For now, let's calculate based on a 10% platform fee on approved properties created this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyProperties = await this.databaseService.property.findMany({
      where: {
        approvalStatus: 'APPROVED',
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      select: {
        price: true,
      },
    });

    // Calculate 10% platform fee from monthly approved properties
    const monthlyEarnings = monthlyProperties.reduce(
      (sum, property) => sum + Number(property.price) * 0.1,
      0
    );

    return {
      totalProperties,
      pendingApprovals,
      totalUsers,
      monthlyEarnings: Math.round(monthlyEarnings), // Round to nearest whole number
    };
  }
}