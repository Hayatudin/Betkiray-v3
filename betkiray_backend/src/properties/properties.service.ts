// betkiray/src/properties/properties.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { MediaType } from '@prisma/client';

@Injectable()
export class PropertiesService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(
        createPropertyDto: CreatePropertyDto, 
        ownerId: string, 
        images: Array<Express.Multer.File>,
        audio: Express.Multer.File | undefined
    ) {
        const { price, latitude, longitude, bedrooms, bathrooms, ...rest } = createPropertyDto;

        const mediaToCreate: { mediaType: MediaType, mediaUrl: string, sortOrder: number }[] = images.map((image, index) => ({
            mediaType: 'IMAGE',
            mediaUrl: `/uploads/${image.filename}`,
            sortOrder: index,
        }));

        if (audio) {
            mediaToCreate.push({
                mediaType: 'AUDIO',
                mediaUrl: `/uploads/${audio.filename}`,
                sortOrder: 0, 
            });
        }

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
                    create: mediaToCreate,
                },
            },
        });
    }

    async incrementViewCount(id: number) {
        const property = await this.databaseService.property.findUnique({ where: { id } });
        if (!property) {
            throw new NotFoundException(`Property with ID ${id} not found.`);
        }

        return this.databaseService.property.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
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
                        id: true, 
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