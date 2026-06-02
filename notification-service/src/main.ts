import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? (process.env.ALLOWED_ORIGINS?.split(",") ?? false) : true,
    credentials: true,
  });
  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(
    `Notification Service running on http://localhost:${port}/graphql`,
  );
}
bootstrap();
