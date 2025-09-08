// src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class AdminService {
  constructor(private readonly databaseService: DatabaseService) {}

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
}