import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? false,
    credentials: true,
  });
  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Traffic Service running on http://localhost:${port}/graphql`);
}
bootstrap();
