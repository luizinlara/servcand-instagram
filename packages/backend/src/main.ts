import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  const allowedOrigins = [
    'https://www.servcand.com.br',
    'https://servcand.com.br',
    'https://api.servcand.com.br',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, origin);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ServcCand API')
    .setDescription('Sistema Multi-Empresa de Gestão de Funcionários e Automação Instagram')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticação e autorização')
    .addTag('Companies', 'Gestão de empresas')
    .addTag('Users', 'Usuários do sistema')
    .addTag('Profiles', 'Perfis e permissões')
    .addTag('Persons', 'Cadastro de pessoas/funcionários')
    .addTag('Regions', 'Regiões e bairros')
    .addTag('Leadership', 'Lideranças regionais')
    .addTag('Missions', 'Missões semanais')
    .addTag('Instagram', 'Integração Instagram')
    .addTag('Salary', 'Salários e pagamentos')
    .addTag('Parameters', 'Parametrização do sistema')
    .addTag('Reports', 'Relatórios')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.init();
  return { app, logger };
}

// Dev/Docker standalone start
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  bootstrap().then(async ({ app, logger }) => {
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`🚀 Application running on port ${port}`);
    logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
  });
}

// Serverless export for Vercel
let cachedHandler: any;
export default async (req: any, res: any) => {
  if (!cachedHandler) {
    await bootstrap();
    cachedHandler = server;
  }
  return cachedHandler(req, res);
};
