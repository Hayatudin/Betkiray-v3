import { PropertyType, BillingPeriod } from "@prisma/client";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  // --- FIX IS HERE ---
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  @Min(1)
  price: number;

  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsNumber()
  @Min(1)
  bedrooms: number;

  @IsNumber()
  @Min(1)
  bathrooms: number;

  @IsNumber()
  @IsOptional()
  areaSqm?: number;

  @IsBoolean()
  @IsOptional()
  isFurnished?: boolean;

  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;


  @IsBoolean() // <-- ADD THIS BLOCK
  @IsOptional()
  includeUtilities?: boolean;
}