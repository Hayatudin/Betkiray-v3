// src/auth/dto/google-auth.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  id_token: string;
}