import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initializeFirebaseAdmin } from './config/firebase.config';

async function bootstrap() {
  initializeFirebaseAdmin();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
