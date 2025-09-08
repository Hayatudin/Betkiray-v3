import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ValidationPipe } from '@nestjs/common';
// --- IMPORT SWAGGER ---
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.enableCors({
  //   origin: '*',
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // });

  app.enableCors({
    origin: [
      'http://localhost:8082', // Your Expo web app
      'http://localhost:8081', // The other default Expo port
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // --- ADD SWAGGER SETUP ---
  const config = new DocumentBuilder()
    .setTitle('Betkiray API')
    .setDescription('The official API documentation for the Betkiray application.')
    .setVersion('1.0')
    .addBearerAuth() // Add support for Bearer token authorization
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // The docs will be available at /api-docs

  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(3000, '0.0.0.0');
}
bootstrap();