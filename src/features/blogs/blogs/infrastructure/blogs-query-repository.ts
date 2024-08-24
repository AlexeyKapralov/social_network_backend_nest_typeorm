import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../domain/blog-entity';
import { Repository } from 'typeorm';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { BlogViewDto } from '../api/dto/output/blog-view-dto';
import { blogViewDtoMapper } from '../../../../base/mappers/blog-view-mapper';

@Injectable()
export class BlogsQueryRepository {
    constructor(@InjectRepository(Blog) private blogRepo: Repository<Blog>) {}

    async findBlog(blogId: string): Promise<BlogViewDto | null> {
        const blog = await this.blogRepo.findOne({
            where: {
                id: blogId,
            },
        });
        if (!blog) {
            return null;
        }

        return blogViewDtoMapper(blog);
    }
}
