import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodSchema,
    private isOptional: boolean = false,
  ) {}

  transform(value: any) {
    // If the value is undefined and it's optional, return undefined
    if (value === undefined && this.isOptional) {
      return undefined;
    }

    try {
      return this.schema.parse(value);
    } catch (error) {
      throw new BadRequestException(
        `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`,
      );
    }
  }
}
