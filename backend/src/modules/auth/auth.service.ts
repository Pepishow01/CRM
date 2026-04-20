import {
  Injectable, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('jwt.secret'),
      expiresIn: this.config.get('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('jwt.refreshSecret'),
      expiresIn: this.config.get('jwt.refreshExpiresIn'),
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepo.save({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}