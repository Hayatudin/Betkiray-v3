import { IsString, IsOptional } from 'class-validator';

export class UpdatePropertyDto {
  @IsString()
  @IsOptional()
  description?: string;
}
