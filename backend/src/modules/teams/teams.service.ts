import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private teamsRepo: Repository<Team>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async findAll(): Promise<Team[]> {
    return this.teamsRepo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Team> {
    const team = await this.teamsRepo.findOne({ where: { id } });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    return team;
  }

  async create(dto: CreateTeamDto): Promise<Team> {
    const existing = await this.teamsRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Ya existe un equipo con ese nombre');

    const team = new Team();
    team.name = dto.name;
    team.description = dto.description ?? '';

    if (dto.memberIds?.length) {
      team.members = await this.usersRepo.find({ where: { id: In(dto.memberIds) } });
    } else {
      team.members = [];
    }

    return this.teamsRepo.save(team);
  }

  async update(id: string, dto: Partial<CreateTeamDto>): Promise<Team> {
    const team = await this.teamsRepo.findOne({ where: { id } });
    if (!team) throw new NotFoundException('Equipo no encontrado');

    if (dto.name) team.name = dto.name;
    if (dto.description !== undefined) team.description = dto.description;
    if (dto.memberIds !== undefined) {
      team.members = dto.memberIds.length
        ? await this.usersRepo.find({ where: { id: In(dto.memberIds) } })
        : [];
    }

    return this.teamsRepo.save(team);
  }

  async remove(id: string): Promise<void> {
    const team = await this.teamsRepo.findOne({ where: { id } });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    await this.teamsRepo.remove(team);
  }

  async addMember(teamId: string, userId: string): Promise<Team> {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!team.members) team.members = [];
    if (!team.members.find((m) => m.id === userId)) {
      team.members.push(user);
      await this.teamsRepo.save(team);
    }
    return team;
  }

  async removeMember(teamId: string, userId: string): Promise<Team> {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    team.members = (team.members ?? []).filter((m) => m.id !== userId);
    await this.teamsRepo.save(team);
    return team;
  }
}
