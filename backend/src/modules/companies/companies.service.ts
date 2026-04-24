import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companiesRepo: Repository<Company>,
  ) {}

  findAll(search?: string): Promise<Company[]> {
    if (search) {
      return this.companiesRepo.find({
        where: [{ name: ILike(`%${search}%`) }, { domain: ILike(`%${search}%`) }],
        order: { name: 'ASC' },
      });
    }
    return this.companiesRepo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Company> {
    const c = await this.companiesRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Empresa no encontrada');
    return c;
  }

  create(data: Partial<Company>): Promise<Company> {
    return this.companiesRepo.save(this.companiesRepo.create(data));
  }

  async update(id: string, data: Partial<Company>): Promise<Company> {
    const c = await this.findById(id);
    Object.assign(c, data);
    return this.companiesRepo.save(c);
  }

  async remove(id: string): Promise<void> {
    const c = await this.findById(id);
    await this.companiesRepo.remove(c);
  }
}
