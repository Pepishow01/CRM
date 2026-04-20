import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("./entities/user.entity").User[]>;
    create(dto: CreateUserDto): Promise<import("./entities/user.entity").User>;
    deactivate(id: string): Promise<import("./entities/user.entity").User>;
}
