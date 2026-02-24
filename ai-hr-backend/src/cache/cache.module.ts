import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const Redis = (await import('ioredis')).default;
        const client = new Redis({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password') || undefined,
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
        });
        return client;
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: ['REDIS_CLIENT', CacheService],
})
export class AppCacheModule {}
