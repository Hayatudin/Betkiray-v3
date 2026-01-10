import { IsString, IsOptional } from 'class-validator';

export class RejectPropertyDto {
    @IsString()
    @IsOptional()
    rejectionReason?: string;
}
