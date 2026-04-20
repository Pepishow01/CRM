export declare enum UserRole {
    ADMIN = "admin",
    SELLER = "seller"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    avatarUrl: string;
    createdAt: Date;
    updatedAt: Date;
}
