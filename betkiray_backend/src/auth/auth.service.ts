// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async signUp(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const user = await this.usersService.create({
        email,
        password: hashedPassword,
        name,
      });
      // Don't return password
      delete (user as any).password;
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signIn(authCredentialsDto: AuthCredentialsDto) {
    const { email, password } = authCredentialsDto;
    const user = await this.usersService.findByEmail(email);

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      const payload = { email: user.email, sub: user.id, role: user.role };
      const accessToken = this.jwtService.sign(payload);
      delete (user as any).password;
      return { accessToken, user };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
  }

  async googleLogin(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token or email missing.');
      }
      const { email, name, picture } = payload;

      let user = await this.usersService.findByEmail(email);

      if (!user) {
        // Create a new user if they don't exist
        user = await this.usersService.create({
          email,
          name,
          image: picture,
          // No password for Google users
        });
      }

      const jwtPayload = { email: user.email, sub: user.id, role: user.role };
      const accessToken = this.jwtService.sign(jwtPayload);
      delete (user as any).password;
      return { accessToken, user };

    } catch (error) {
      throw new UnauthorizedException('Google authentication failed');
    }
  }
}