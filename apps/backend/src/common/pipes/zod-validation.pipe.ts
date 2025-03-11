import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodSchema,
    private isOptional: boolean = false,
  ) {}

  transform(value: any) {
    if (value === undefined && this.isOptional) {
      return undefined;
    }

    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        throw new BadRequestException(
          `Validation failed: ${zodError.errors.map((e) => e.message).join(', ')}`,
        );
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
