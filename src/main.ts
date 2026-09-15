import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(new ValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CoDev OSRS API')
    .setDescription('API documentation for the CoDev OSRS backend')
    .setVersion('1.0')
    .addTag('CoDev OSRS')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerUiCdn = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.14';
  SwaggerModule.setup('/', app, documentFactory, {
    customCssUrl: `${swaggerUiCdn}/swagger-ui.css`,
    customJs: [
      `${swaggerUiCdn}/swagger-ui-bundle.js`,
      `${swaggerUiCdn}/swagger-ui-standalone-preset.js`,
    ],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
