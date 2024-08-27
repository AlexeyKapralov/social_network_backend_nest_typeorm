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
import { Blog } from '../../blogs/domain/blog-entity';
import { BlogPostInputDto } from '../../blogs/api/dto/input/blog-post-input.dto';
import { Like } from '../../likes/domain/likes.entity';

@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ collation: 'C' })
    title: string;

    @Column({ collation: 'C' })
    shortDescription: string;

    @Column({ collation: 'C' })
    content: string;

    @Column()
    createdAt: string;

    @Column({ default: 0 })
    likesCount: number;

    @Column({ default: 0 })
    dislikesCount: number;

    @DeleteDateColumn()
    deletedDate: Date;

    @ManyToOne(() => Blog)
    @JoinColumn({ name: 'blogId' })
    blog: Blog;

    @OneToMany(() => Like, (like) => like.post)
    like: Like[];

    static async createPost(postInputDto: BlogPostInputDto, blog: Blog) {
        const post = new Post();
        post.title = postInputDto.title;
        post.shortDescription = postInputDto.shortDescription;
        post.content = postInputDto.content;
        post.createdAt = new Date().toISOString();
        post.likesCount = 0;
        post.dislikesCount = 0;
        post.blog = blog;
        post.like = [];

        await post.save();

        return post;
    }
}
