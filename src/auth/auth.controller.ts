import { Controller, UseGuards, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('getUserRole')
  @UseGuards(FirebaseAuthGuard)
  async getUserRole(@Query('uid') uid: string) {
    return this.authService.getUserRole(uid);
  }

  @Get('setUserRole')
  @UseGuards(FirebaseAuthGuard)
  async setUserRole(@Query('uid') uid: string, @Query('role') role: string) {
    console.log(uid, role);
    await this.authService.setUserRole(uid, role);
    return { status: 200, message: 'User role set successfully' };
  }

  @Get('createCustomToken')
  async createCustomToken(@Query('uid') uid: string): Promise<string> {
    return this.authService.createCustomToken(uid);
  }

  @Get('verifyToken')
  async verifyToken(@Query('token') token: string) {
    return this.authService.verifyToken(token);
  }
}
