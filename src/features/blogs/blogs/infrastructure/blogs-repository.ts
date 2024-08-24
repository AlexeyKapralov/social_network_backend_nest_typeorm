import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../domain/blog-entity';
import { Repository } from 'typeorm';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';
import { IsString, Length, Matches } from 'class-validator';
import { BlogPostInputDto } from '../api/dto/input/blog-post-input.dto';
import { PostsViewDto } from '../../posts/api/dto/output/extended-likes-info-view.dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { Post } from '../../posts/domain/posts.entity';

@Injectable()
export class BlogsRepository {
    constructor(
        @InjectRepository(Blog) private blogRepo: Repository<Blog>,
        private postsRepository: PostsRepository,
    ) {}

    async findBlog(blogId: string): Promise<Blog | null> {
        return await this.blogRepo.findOne({ where: { id: blogId } });
    }

    async createBlog(blogInputDto: BlogInputDto): Promise<Blog> {
        return await Blog.createBlog(blogInputDto);
    }

    async updateBlog(
        blogId: string,
        blogInputDto: BlogInputDto,
    ): Promise<boolean> {
        const blog = await this.blogRepo.findOne({
            where: {
                id: blogId,
            },
        });
        if (!blog) {
            return false;
        }
        blog.name = blogInputDto.name;
        blog.websiteUrl = blogInputDto.websiteUrl;
        blog.description = blogInputDto.description;
        await this.blogRepo.save(blog);
        return true;
    }

    async deleteBlog(blogId: string): Promise<boolean> {
        const blog = await this.blogRepo.findOne({
            where: {
                id: blogId,
            },
        });
        if (!blog) {
            return false;
        }
        await blog.softRemove();
        return true;
    }
}
