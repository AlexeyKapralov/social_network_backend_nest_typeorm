import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../domain/blog-entity';
import { Repository } from 'typeorm';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';

@Injectable()
export class BlogsRepository {
    constructor(@InjectRepository(Blog) private blogRepo: Repository<Blog>) {}
    async createBlog(blogInputDto: BlogInputDto): Promise<Blog> {
        return await Blog.createBlog(blogInputDto);
    }
}
