import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CannedResponse } from './entities/canned-response.entity';
import { CreateCannedResponseDto } from './dto/create-canned-response.dto';

@Injectable()
export class CannedResponsesService {
  constructor(
    @InjectRepository(CannedResponse)
    private repo: Repository<CannedResponse>,
  ) {}

  async findAll(search?: string): Promise<CannedResponse[]> {
    if (search) {
      return this.repo.find({
        where: [
          { title: ILike(`%${search}%`) },
          { content: ILike(`%${search}%`) },
          { shortCode: ILike(`%${search}%`) },
        ],
        order: { title: 'ASC' },
      });
    }
    return this.repo.find({ order: { title: 'ASC' } });
  }

  async create(dto: CreateCannedResponseDto, userId: string): Promise<CannedResponse> {
    const cr = this.repo.create({ ...dto, createdBy: { id: userId } as any });
    return this.repo.save(cr);
  }

  async update(id: string, dto: Partial<CreateCannedResponseDto>): Promise<CannedResponse> {
    const cr = await this.repo.findOne({ where: { id } });
    if (!cr) throw new NotFoundException('Respuesta rápida no encontrada');
    Object.assign(cr, dto);
    return this.repo.save(cr);
  }

  async remove(id: string): Promise<void> {
    const cr = await this.repo.findOne({ where: { id } });
    if (!cr) throw new NotFoundException('Respuesta rápida no encontrada');
    await this.repo.remove(cr);
  }
}
