import {
    Controller, Get, Post, Param, Req,
    ParseIntPipe, UseGuards, Query, UseInterceptors, BadRequestException,
    Patch, HttpCode, HttpStatus, Delete, Body, UploadedFile,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import type { User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PropertyOwnerGuard } from './guards/property-owner.guard';

@Controller('properties')
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) {}

    @UseGuards(AuthGuard('jwt'))
    @Post()
    @UseInterceptors(FileFieldsInterceptor([ { name: 'images', maxCount: 3 }, { name: 'audio', maxCount: 1 } ], { storage: diskStorage({ destination: './uploads', filename: (req, file, cb) => { const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join(''); cb(null, `${randomName}${extname(file.originalname)}`); } }) }))
    async create(@Req() req: any) {
        const user = req.user as User;
        const files = req.files as { images?: Express.Multer.File[], audio?: Express.Multer.File[] };
        if (!files || !files.images || files.images.length !== 3) { throw new BadRequestException('Exactly 3 images are required.'); }
        const createPropertyDto = plainToInstance(CreatePropertyDto, { ...req.body, latitude: parseFloat(req.body.latitude), longitude: parseFloat(req.body.longitude), price: parseInt(req.body.price, 10), bedrooms: parseInt(req.body.bedrooms, 10), bathrooms: parseInt(req.body.bathrooms, 10), areaSqm: req.body.areaSqm ? parseInt(req.body.areaSqm, 10) : undefined, isFurnished: req.body.isFurnished === 'true', isNegotiable: req.body.isNegotiable === 'true', includeUtilities: req.body.includeUtilities === 'true' });
        const errors = await validate(createPropertyDto);
        if (errors.length > 0) { throw new BadRequestException(errors.flatMap(error => Object.values(error.constraints || {}))); }
        return this.propertiesService.create(createPropertyDto, user.id, files.images, files.audio?.[0]);
    }

    @Get()
    findAll(@Query('city') city?: string, @Query('type') type?: string) { return this.propertiesService.findAll(city, type); }
  
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) { return this.propertiesService.findOne(id); }

    @Patch(':id/view')
    @HttpCode(HttpStatus.OK)
    incrementView(@Param('id', ParseIntPipe) id: number) { return this.propertiesService.incrementViewCount(id); }

    @UseGuards(AuthGuard('jwt'), PropertyOwnerGuard)
    @Patch(':id')
    @UseInterceptors(FileInterceptor('audio', { storage: diskStorage({ destination: './uploads', filename: (req, file, cb) => { const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join(''); cb(null, `${randomName}${extname(file.originalname)}`); } }) }))
    updateProperty( @Param('id', ParseIntPipe) id: number, @Body() updatePropertyDto: UpdatePropertyDto, @UploadedFile() audio?: Express.Multer.File, ) {
        return this.propertiesService.updateProperty(id, updatePropertyDto, audio);
    }

    @UseGuards(AuthGuard('jwt'), PropertyOwnerGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteProperty(@Param('id', ParseIntPipe) id: number) {
        return this.propertiesService.deleteProperty(id);
    }
}