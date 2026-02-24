import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AppCacheModule } from './cache/cache.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeaveModule } from './modules/leave/leave.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { MeetingModule } from './modules/meeting/meeting.module';
import { GrievanceModule } from './modules/grievance/grievance.module';
import { ReportModule } from './modules/report/report.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AppCacheModule,
    QueueModule,
    StorageModule,
    HealthModule,
    AuthModule,
    RbacModule,
    OrganizationModule,
    EmployeeModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    RecruitmentModule,
    MeetingModule,
    GrievanceModule,
    ReportModule,
    SettingsModule,
    AiAssistantModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
