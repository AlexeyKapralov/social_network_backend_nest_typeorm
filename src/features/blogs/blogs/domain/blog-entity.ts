import {
    BaseEntity,
    Column,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';

@Entity()
export class Blog extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ collation: 'C' })
    name: string;

    @Column({ collation: 'C' })
    description: string;

    @Column({ collation: 'C' })
    websiteUrl: string;

    @Column()
    createdAt: Date;

    @Column({ default: true })
    isMembership: boolean;

    @DeleteDateColumn({ nullable: true })
    deletedDate: Date;

    static async createBlog(blogInputDto: BlogInputDto): Promise<Blog> {
        const blog = new Blog();
        blog.name = blogInputDto.name;
        blog.description = blogInputDto.description;
        blog.websiteUrl = blogInputDto.websiteUrl;
        blog.createdAt = new Date();
        blog.isMembership = false;

        await blog.save();

        return blog;
    }
}
