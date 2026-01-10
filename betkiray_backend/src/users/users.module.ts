import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService],
  // Export UsersService so other modules (like AuthModule) can use it
  exports: [UsersService], 
})
export class UsersModule {}