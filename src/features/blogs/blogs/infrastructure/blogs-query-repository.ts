import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../domain/blog-entity';
import { Repository } from 'typeorm';
import { BlogViewDto } from '../api/dto/output/blog-view-dto';
import { blogViewDtoMapper } from '../../../../base/mappers/blog-view-mapper';
import { BlogBlacklist } from '../domain/blog-blacklist-entity';

@Injectable()
export class BlogsQueryRepository {
    constructor(
        @InjectRepository(Blog) private readonly blogRepo: Repository<Blog>,
    ) {}

    async findBlog(blogId: string): Promise<BlogViewDto | null> {
        const blog = await this.blogRepo
            .createQueryBuilder('b')
            .leftJoin(BlogBlacklist, 'bb', 'bb."blogId" = b.id')
            .leftJoinAndSelect('b.user', 'u')
            .where('bb.id is null')
            .andWhere('b.id = :id', {
                id: blogId,
            })
            .andWhere('u."isBanned" = :isBanned', { isBanned: false })
            .getOne();
        if (!blog) {
            return null;
        }

        return blogViewDtoMapper(blog);
    }
}
