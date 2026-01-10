import { PropertyType, BillingPeriod } from "@prisma/client";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum, Min, IsPhoneNumber } from 'class-validator';
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

  @IsString()
  @IsOptional()
  subCity?: string;

  @IsPhoneNumber() 
  @IsNotEmpty()
  phone: string;

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  price: number;

  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @IsEnum(PropertyType)
  propertyType: PropertyType;
  
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms: number;
  
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  areaSqm?: number;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isFurnished?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  includeUtilities?: boolean;
}