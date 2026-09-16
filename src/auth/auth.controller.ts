import { Controller, Get, Post, Body, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('google')
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) response: any,
  ) {
    const user = await this.authService.authenticateGoogle(dto.credential);

    const token = await this.jwt.signAsync({ sub: user.id });

    const production = this.config.get<string>('NODE_ENV') === 'production';
    response.cookie('session', token, {
      httpOnly: true,
      secure: production,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
      path: '/',
    });

    return user;
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) response: any) {
    response.clearCookie('session', { httpOnly: true, path: '/' });
    return { success: true };
  }

  @Get('me')
  me(@Req() request: any) {
    return request.user;
  }
}
