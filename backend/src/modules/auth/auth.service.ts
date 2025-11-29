import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SafeUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateCredentials(dto: LoginDto): Promise<SafeUser> {
    const user = await this.usersService.findByEmployeeNumber(dto.employeeNumber);
    if (!user || user.status !== UserStatus.active) {
      throw new UnauthorizedException('社員番号またはパスワードが正しくありません。');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('社員番号またはパスワードが正しくありません。');
    }

    return this.usersService.sanitize(user);
  }

  async login(user: SafeUser) {
    const payload = {
      sub: user.id,
      role: user.role,
      employeeNumber: user.employeeNumber,
      name: user.name,
    };

    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }
}

