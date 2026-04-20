import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    constructor(config: ConfigService, usersService: UsersService);
    validate(payload: JwtPayload): Promise<import("../../users/entities/user.entity").User>;
}
export {};
