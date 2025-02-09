import {
    BaseEntity,
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';
import { User } from '../../../users/domain/user-entity';
import { BlogBlacklist } from './blog-blacklist-entity';
import { File } from '../../../files/domain/s3-storage.entity';

@Entity()
export class Blog extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ collation: 'C' })
    name: string;

    @Column({ nullable: true })
    ownerId: string;

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

    @ManyToOne(() => User)
    @JoinColumn({ name: 'ownerId' })
    user: User;

    @OneToMany(() => BlogBlacklist, (blogBlacklist) => blogBlacklist.blog)
    @JoinColumn({ name: 'blogBlacklistId' })
    blogBlacklist: BlogBlacklist[];

    @OneToMany(() => File, (file) => file.blog)
    files: File[];

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

    static async createBlogWithUser(
        blogInputDto: BlogInputDto,
        userId: string,
    ): Promise<Blog> {
        const blog = new Blog();
        blog.name = blogInputDto.name;
        blog.description = blogInputDto.description;
        blog.websiteUrl = blogInputDto.websiteUrl;
        blog.createdAt = new Date();
        blog.isMembership = false;
        blog.ownerId = userId;

        await blog.save();

        return blog;
    }
}
