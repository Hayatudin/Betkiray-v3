// betkiray/src/properties/pipes/parse-form-data-json.pipe.ts

import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata, // Import ArgumentMetadata
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer'; // Import plainToInstance

@Injectable()
export class ParseFormDataJsonPipe implements PipeTransform {
  // Add 'metadata' to the transform method signature
  async transform(value: string, metadata: ArgumentMetadata) {
    if (typeof value !== 'string') {
      throw new BadRequestException('Data field must be a JSON string.');
    }
    try {
      // Get the DTO type from the metadata
      const { metatype } = metadata;
      if (!metatype) {
        throw new BadRequestException('Metadata not found for transformation.');
      }

      // Parse the string back into a plain object
      const parsed = JSON.parse(value);

      // --- THIS IS THE KEY CHANGE ---
      // Convert the plain object to an instance of the DTO class.
      // This allows the global ValidationPipe to work correctly.
      const object = plainToInstance(metatype, parsed);

      // We return the class instance
      return object;
      
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid JSON format in data field.');
    }
  }
}