import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';

@Entity()
export class Blog extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    websiteUrl: string;

    @Column()
    createdAt: Date;

    @Column({ default: true })
    isMembership: boolean;

    static async createBlog(blogInputDto: BlogInputDto): Promise<Blog> {
        const blog = new Blog();
        blog.name = blogInputDto.name;
        blog.description = blogInputDto.description;
        blog.websiteUrl = blogInputDto.websiteUrl;
        blog.createdAt = new Date();
        blog.isMembership = true;
        await blog.save();

        return blog;
    }
}
