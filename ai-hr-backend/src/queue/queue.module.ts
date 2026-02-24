import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

export const QUEUE_NAMES = {
  PAYROLL: 'payroll',
  EMAIL: 'email',
  REPORT: 'report',
  AI: 'ai',
  DOCUMENT: 'document',
} as const;

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password') || undefined,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
