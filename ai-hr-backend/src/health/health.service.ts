import { Injectable } from '@nestjs/common';
import { HealthCheckService, PrismaHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      async () => {
        const healthy = await this.cache.isHealthy();
        return {
          redis: {
            status: healthy ? 'up' : 'down',
          },
        };
      },
    ]);
  }
}
