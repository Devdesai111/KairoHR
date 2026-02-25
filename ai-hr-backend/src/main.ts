import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  const frontendUrl = configService.get<string>('frontendUrl') ?? 'http://localhost:5173';
  app.enableCors({
    origin: (origin, callback) => {
      // Allow configured frontend URL and localhost origins during development
      const allowed = [frontendUrl, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  // Global prefix
  const apiPrefix = configService.get<string>('apiPrefix') ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  // Note: TransformInterceptor is registered via APP_INTERCEPTOR in app.module.ts
  // to enable dependency injection. LoggingInterceptor and TimeoutInterceptor
  // are registered here since they don't need DI.
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
  );
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Swagger
  const nodeEnv = configService.get<string>('nodeEnv');
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AI HR API')
      .setDescription('Production-grade HRMS REST API')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .addTag('auth', 'Authentication endpoints')
      .addTag('organization', 'Organization management')
      .addTag('employees', 'Employee management')
      .addTag('attendance', 'Attendance management')
      .addTag('leave', 'Leave management')
      .addTag('payroll', 'Payroll processing')
      .addTag('recruitment', 'ATS recruitment')
      .addTag('meetings', 'Meeting management')
      .addTag('grievance', 'Grievance & compliance')
      .addTag('ai', 'AI HR Assistant')
      .addTag('reports', 'Reports & analytics')
      .addTag('settings', 'System settings')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap().catch(console.error);
