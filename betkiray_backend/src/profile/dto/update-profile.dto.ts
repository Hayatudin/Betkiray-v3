import { IsString, IsOptional, IsPhoneNumber, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;
}
