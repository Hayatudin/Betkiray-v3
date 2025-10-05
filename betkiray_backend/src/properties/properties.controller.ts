import {
    Controller, Get, Post, Param, Req,
    ParseIntPipe, UseGuards, Query, UseInterceptors, BadRequestException,
    Patch,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
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
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'images', maxCount: 3 },
        { name: 'audio', maxCount: 1 }
    ], {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    async create(@Req() req: any) {
        const user = req.user as User;
        const files = req.files as { images?: Express.Multer.File[], audio?: Express.Multer.File[] };
        const body = req.body;

        if (!files || !files.images || files.images.length !== 3) {
            throw new BadRequestException('Exactly 3 images are required.');
        }
        const images = files.images;
        const audio = files.audio?.[0]; 

        const createPropertyDto = plainToInstance(CreatePropertyDto, {
            ...body,
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
        
        const errors = await validate(createPropertyDto);
        if (errors.length > 0) {
            const messages = errors.flatMap(error => Object.values(error.constraints || {}));
            throw new BadRequestException(messages);
        }

        return this.propertiesService.create(createPropertyDto, user.id, images, audio);
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
    @HttpCode(HttpStatus.OK)
    incrementView(@Param('id', ParseIntPipe) id: number) {
        return this.propertiesService.incrementViewCount(id);
    }
}