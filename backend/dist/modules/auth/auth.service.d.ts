import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';
export declare class AuthService {
    private usersService;
    private jwtService;
    private config;
    private refreshTokenRepo;
    constructor(usersService: UsersService, jwtService: JwtService, config: ConfigService, refreshTokenRepo: Repository<RefreshToken>);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("../users/entities/user.entity").UserRole;
        };
    }>;
}
