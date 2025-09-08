// src/admin/admin.module.ts (Corrected)

import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from 'src/database/database.module'; // <-- ADD THIS IMPORT

@Module({
  imports: [DatabaseModule], // <-- ADD THIS LINE
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}