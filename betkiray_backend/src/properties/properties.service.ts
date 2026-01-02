import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { MediaType } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PropertiesService {
    constructor(private readonly databaseService: DatabaseService) { }

    async create(createPropertyDto: CreatePropertyDto, ownerId: string, images: Express.Multer.File[], audio?: Express.Multer.File) {
        const { price, latitude, longitude, bedrooms, bathrooms, ...rest } = createPropertyDto;
        const mediaToCreate: { mediaType: MediaType, mediaUrl: string, sortOrder: number }[] = images.map((image, index) => ({ mediaType: MediaType.IMAGE, mediaUrl: `/uploads/${image.filename}`, sortOrder: index }));
        if (audio) { mediaToCreate.push({ mediaType: MediaType.AUDIO, mediaUrl: `/uploads/${audio.filename}`, sortOrder: 0 }); }
        return this.databaseService.property.create({
            data: { ...rest, price: Number(price), latitude: Number(latitude), longitude: Number(longitude), bedrooms: Number(bedrooms), bathrooms: Number(bathrooms), ownerId, media: { create: mediaToCreate } },
        });
    }

    async updateProperty(propertyId: number, data: UpdatePropertyDto, audio?: Express.Multer.File) {
        const property = await this.databaseService.property.findUnique({ where: { id: propertyId }, include: { media: true } });
        if (!property) throw new NotFoundException(`Property with ID ${propertyId} not found.`);
        if (audio) {
            const oldAudio = property.media.find(m => m.mediaType === MediaType.AUDIO);
            if (oldAudio) {
                await this.databaseService.propertyMedia.delete({ where: { id: oldAudio.id } });
                try { await fs.unlink(path.join('./uploads', oldAudio.mediaUrl.split('/').pop() || '')); } catch (e) { console.error("Failed to delete old audio file:", e); }
            }
            await this.databaseService.propertyMedia.create({ data: { propertyId, mediaType: MediaType.AUDIO, mediaUrl: `/uploads/${audio.filename}` } });
        }
        return this.databaseService.property.update({ where: { id: propertyId }, data: { description: data.description } });
    }

    async deleteProperty(propertyId: number) {
        const property = await this.databaseService.property.findUnique({ where: { id: propertyId }, include: { media: true } });
        if (!property) throw new NotFoundException(`Property with ID ${propertyId} not found.`);
        for (const media of property.media) {
            try { await fs.unlink(path.join('./uploads', media.mediaUrl.split('/').pop() || '')); } catch (e) { console.error("Failed to delete media file:", e); }
        }
        return this.databaseService.property.delete({ where: { id: propertyId } });
    }

    async incrementViewCount(id: number) {
        return this.databaseService.property.update({ where: { id }, data: { viewCount: { increment: 1 } }, select: { viewCount: true } });
    }

    async findAll(city?: string, type?: string) {
        return this.databaseService.property.findMany({
            where: {
                city,
                propertyType: type ? { equals: type as any } : undefined,
                approvalStatus: 'APPROVED' // Only show approved properties to public
            },
            include: { owner: { select: { name: true, email: true } }, media: true },
        });
    }

    async findAllPending() {
        return this.databaseService.property.findMany({
            where: { approvalStatus: 'PENDING' },
            include: { owner: { select: { name: true, email: true } }, media: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const property = await this.databaseService.property.findUnique({
            where: { id },
            include: { owner: { select: { id: true, name: true, email: true, image: true, phone: true } }, media: true, reviews: { include: { user: { select: { name: true, image: true } } } } },
        });
        if (!property) throw new NotFoundException(`Property with ID ${id} not found.`);
        return property;
    }
}