// src/notifications/dto/register-push.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterPushDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
