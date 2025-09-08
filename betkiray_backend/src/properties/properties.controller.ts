import {
    Controller, Get, Post, Body, Param, Req, // <-- Import Req
    ParseIntPipe, UseGuards, Query, UseInterceptors, UploadedFiles, BadRequestException,
    Patch,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Controller('properties')
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) {}

    @UseGuards(AuthGuard('jwt'))
    @Post()
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 3 }], {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    // --- THIS IS THE FINAL, WORKING METHOD ---
    // We inject the raw request object using @Req()
    async create(@Req() req: any) {
        // Get the user, files, and body directly from the request object.
        // This bypasses any decorator conflicts.
        const user = req.user as User;
        const files = req.files as { images?: Express.Multer.File[] };
        const body = req.body;

        // Check for files first
        if (!files || !files.images || files.images.length !== 3) {
            throw new BadRequestException('Exactly 3 images are required.');
        }
        const images = files.images;

        // 1. Manually create the DTO instance from the raw body
        const createPropertyDto = plainToInstance(CreatePropertyDto, {
            ...body,
            // Manually convert data types
            latitude: parseFloat(body.latitude),
            longitude: parseFloat(body.longitude),
            price: parseInt(body.price, 10),
            bedrooms: parseInt(body.bedrooms, 10),
            bathrooms: parseInt(body.bathrooms, 10),
            areaSqm: body.areaSqm ? parseInt(body.areaSqm, 10) : undefined,
            isFurnished: body.isFurnished === 'true',
            isNegotiable: body.isNegotiable === 'true',
            includeUtilities: body.includeUtilities === 'true',
        });
        
        // 2. Manually trigger validation
        const errors = await validate(createPropertyDto);
        if (errors.length > 0) {
            const messages = errors.flatMap(error => error.constraints ? Object.values(error.constraints) : []);
            throw new BadRequestException(messages);
        }

        // 3. If validation passes, call the service
        return this.propertiesService.create(createPropertyDto, user.id, images);
    }

    @Get()
    findAll(@Query('city') city?: string, @Query('type') type?: string) {
        return this.propertiesService.findAll(city, type);
    }
  
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.propertiesService.findOne(id);
    }

    @Patch(':id/view')
    @HttpCode(HttpStatus.OK) // Respond with 200 OK
    incrementView(@Param('id', ParseIntPipe) id: number) {
        return this.propertiesService.incrementViewCount(id);
    }
}