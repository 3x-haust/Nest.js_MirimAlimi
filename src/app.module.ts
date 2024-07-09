import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import * as admin from 'firebase-admin';
import serviceAccount from '../path/to/serviceAccountKey.json';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService],
})
export class AppModule {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
      });
    }
  }
}
