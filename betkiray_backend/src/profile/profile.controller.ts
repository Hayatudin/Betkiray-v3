import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('profile')
export class ProfileController {
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req) {
    return req.user; // Extracted from JWT
  }
}