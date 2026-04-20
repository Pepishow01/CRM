import { User } from '../../users/entities/user.entity';
export declare class RefreshToken {
    id: string;
    userId: string;
    user: User;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
}
