import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article) private repo: Repository<Article>,
  ) {}

  findAll(search?: string, category?: string) {
    const where: any = {};
    if (category) where.category = category;
    if (search) {
      return this.repo.find({
        where: [
          { ...where, title: ILike(`%${search}%`) },
          { ...where, content: ILike(`%${search}%`) },
        ],
        order: { createdAt: 'DESC' },
      });
    }
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Article not found');
    return a;
  }

  create(data: Partial<Article>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Article>) {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  categories() {
    return this.repo
      .createQueryBuilder('a')
      .select('DISTINCT a.category', 'category')
      .where('a.category IS NOT NULL')
      .getRawMany()
      .then((rows) => rows.map((r) => r.category).filter(Boolean));
  }
}
