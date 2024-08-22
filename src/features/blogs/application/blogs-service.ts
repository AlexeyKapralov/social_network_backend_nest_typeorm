import { Injectable } from '@nestjs/common';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';
import { BlogViewDto } from '../api/dto/output/blog-view-dto';
import { BlogsRepository } from '../infrastructure/blogs-repository';
import { blogViewDtoMapper } from '../../../base/mappers/blog-view-mapper';
import { InterlayerNotice } from '../../../base/models/interlayer';

@Injectable()
export class BlogsService {
    constructor(private blogsRepository: BlogsRepository) {}

    async createBlog(
        blogInputDto: BlogInputDto,
    ): Promise<InterlayerNotice<BlogViewDto>> {
        const notice = new InterlayerNotice<BlogViewDto>();
        const blog = await this.blogsRepository.createBlog(blogInputDto);
        if (!blog) {
            notice.addError('blog is bot created');
            return notice;
        }
        notice.addData(blogViewDtoMapper(blog));
        return notice;
    }
}
