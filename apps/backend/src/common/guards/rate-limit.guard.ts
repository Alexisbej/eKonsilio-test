import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requestMap = new Map<string, number[]>();
  private readonly options: RateLimitOptions;

  constructor(options?: Partial<RateLimitOptions>) {
    this.options = {
      windowMs: options?.windowMs || 60 * 1000, // 1 minute
      max: options?.max || 100, // 100 requests per minute
    };
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const now = Date.now();

    const timestamps = this.requestMap.get(ip) || [];

    const windowStart = now - this.options.windowMs;
    const recentTimestamps = timestamps.filter(
      (timestamp) => timestamp > windowStart,
    );

    if (recentTimestamps.length >= this.options.max) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentTimestamps.push(now);
    this.requestMap.set(ip, recentTimestamps);

    return true;
  }
}
