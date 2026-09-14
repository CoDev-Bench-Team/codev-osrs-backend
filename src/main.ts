import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log('[bootstrap] Starting NestJS', {
    node: process.version,
    hasDatabaseUrl: Boolean(process.env.POSTGRESQL_HOST),
  });
  
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  console.log('[bootstrap] NestJS application created');

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);

  console.log('[bootstrap] NestJS listening');
}

bootstrap().catch((error) => {
  console.error('[bootstrap] FAILED');

  if (error instanceof Error) {
    console.error(error.stack);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
