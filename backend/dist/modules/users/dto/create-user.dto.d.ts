import { UserRole } from '../entities/user.entity';
export declare class CreateUserDto {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
}
