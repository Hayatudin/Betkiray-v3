import { Controller, Get, UseGuards, Patch, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@UseGuards(AuthGuard('jwt'))
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  async me(@GetUser() user: User) {
    return user;
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async updateProfile(
    @GetUser() user: User,
    @Body() body: any,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const updateProfileDto = plainToInstance(UpdateProfileDto, body);
    const errors = await validate(updateProfileDto);

    if (errors.length > 0) {
      const messages = errors.flatMap(error => Object.values(error.constraints || {}));
      throw new BadRequestException(messages);
    }

    return this.profileService.updateUserProfile(user.id, updateProfileDto, image);
  }
}