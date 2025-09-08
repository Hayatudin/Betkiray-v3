// betkiray/src/properties/properties.service.ts (Corrected)

import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(
        createPropertyDto: CreatePropertyDto, 
        ownerId: string, 
        images: Array<Express.Multer.File>
    ) {
        const { price, latitude, longitude, bedrooms, bathrooms, ...rest } = createPropertyDto;

        return this.databaseService.property.create({
            data: {
                ...rest,
                price: Number(price),
                latitude: Number(latitude),
                longitude: Number(longitude),
                bedrooms: Number(bedrooms),
                bathrooms: Number(bathrooms),
                ownerId,
                media: {
                    create: images.map((image, index) => ({
                        mediaType: 'IMAGE',
                        mediaUrl: `/uploads/${image.filename}`,
                        sortOrder: index,
                    })),
                },
            },
        });
    }

    async incrementViewCount(id: number) {
        // First, check if the property exists.
        const property = await this.databaseService.property.findUnique({ where: { id } });
        if (!property) {
            throw new NotFoundException(`Property with ID ${id} not found.`);
        }

        // Use Prisma's atomic increment operation to safely update the count.
        // This prevents race conditions if multiple people view at the same time.
        return this.databaseService.property.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
            // We only need to return the new count.
            select: {
                viewCount: true,
            },
        });
    }

    async findAll(city?: string, type?: string) {
        return this.databaseService.property.findMany({
            where: {
                city: city,
                propertyType: type ? { equals: type as any } : undefined,
            },
            include: {
                owner: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                media: true,
            },
        });
    }

    async findOne(id: number) {
        const property = await this.databaseService.property.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true, // <-- THIS IS THE FIX. Add this line.
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                media: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                image: true,
                            }
                        }
                    }
                }
            },
        });

        if (!property) {
            throw new NotFoundException(`Property with ID ${id} not found.`);
        }
        return property;
    }
}