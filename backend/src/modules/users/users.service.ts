import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepo.create({ ...dto, password: passwordHash });
    return this.usersRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }
    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findById(id);
    user.isActive = false;
    return this.usersRepo.save(user);
  }
}