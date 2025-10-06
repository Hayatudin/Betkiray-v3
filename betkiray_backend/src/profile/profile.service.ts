import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly databaseService: DatabaseService) {}

  async updateUserProfile(userId: string, data: UpdateProfileDto, image?: Express.Multer.File) {
    const user = await this.databaseService.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const updateData: { name?: string; phone?: string; image?: string } = { ...data };
    if (image) {
      updateData.image = `/uploads/${image.filename}`;
    }

    const updatedUser = await this.databaseService.user.update({
      where: { id: userId },
      data: updateData,
    });

    delete (updatedUser as any).password;
    return updatedUser;
  }
}
