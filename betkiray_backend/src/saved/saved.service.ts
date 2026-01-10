import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class SavedService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(userId: string, propertyId: number) {
    // First, check if the property actually exists
    const property = await this.databaseService.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found.`);
    }

    return this.databaseService.savedProperty.create({
      data: {
        userId,
        propertyId,
      },
    });
  }

  async findAll(userId: string) {
    return this.databaseService.savedProperty.findMany({
      where: { userId },
      // Include the full property details for each saved item
      include: {
        property: {
          include: {
            media: true,
          }
        },
      },
    });
  }

  async remove(userId: string, propertyId: number) {
    // By using 'deleteMany', the operation will succeed even if the record
    // was already deleted. It simply deletes all entries that match the criteria.
    // This is much safer and prevents the P2025 error.
    return this.databaseService.savedProperty.deleteMany({
      where: {
        userId,
        propertyId,
      },
    });
  }
}