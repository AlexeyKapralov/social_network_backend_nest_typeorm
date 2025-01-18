import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../domain/blog-entity';
import { Repository } from 'typeorm';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';

@Injectable()
export class BlogsRepository {
    constructor(
        @InjectRepository(Blog) private readonly blogRepo: Repository<Blog>,
    ) {}

    async findBlog(blogId: string): Promise<Blog | null> {
        return this.blogRepo.findOne({
            where: {
                id: blogId,
                user: {
                    isBanned: false,
                },
            },
        });
    }

    async findBlogWithUser(blogId: string): Promise<Blog | null> {
        return this.blogRepo.findOne({
            where: { id: blogId, user: { isBanned: false } },
            relations: { user: true },
        });
    }

    async createBlog(
        blogInputDto: BlogInputDto,
        userId: string = null,
    ): Promise<Blog> {
        return userId
            ? await Blog.createBlogWithUser(blogInputDto, userId)
            : await Blog.createBlog(blogInputDto);
    }

    async updateBlog(
        blogId: string,
        blogInputDto: BlogInputDto,
    ): Promise<boolean> {
        const blog = await this.blogRepo.findOne({
            where: {
                id: blogId,
                user: {
                    isBanned: false,
                },
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
                user: {
                    isBanned: false,
                },
            },
        });
        if (!blog) {
            return false;
        }
        await blog.softRemove();
        return true;
    }

    async bindBlogWithUser(blogId: string, userId: string): Promise<boolean> {
        try {
            await this.blogRepo.update(
                {
                    id: blogId,
                    user: {
                        isBanned: false,
                    },
                },
                {
                    user: {
                        id: userId,
                    },
                },
            );
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}
