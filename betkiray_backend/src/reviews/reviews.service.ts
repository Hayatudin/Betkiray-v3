import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    userId: string,
    propertyId: number,
    createReviewDto: CreateReviewDto,
  ) {
    // Check if the property exists
    const property = await this.databaseService.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found.`);
    }

    // Check if the user has already reviewed this property
    const existingReview = await this.databaseService.review.findUnique({
      where: {
        Review_user_id_property_id_key: {
          userId,
          propertyId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this property.');
    }

    return this.databaseService.review.create({
      data: {
        ...createReviewDto,
        propertyId,
        userId,
      },
    });
  }
}