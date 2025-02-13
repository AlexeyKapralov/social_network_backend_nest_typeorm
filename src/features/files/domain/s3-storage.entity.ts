import {
    BaseEntity,
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../blogs/blogs/domain/blog-entity';
import { Post } from '../../blogs/posts/domain/posts.entity';

@Entity()
export class File extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    fileSize: string;

    @Column()
    height: string;

    @Column()
    width: string;

    @Column()
    typeFile: string;

    @Column({ nullable: true })
    blogId: string;

    @Column({ nullable: true })
    postId: string;

    @Column()
    fileKey: string;

    @Column()
    url: string;

    @ManyToOne(() => Blog, (blog) => blog.files)
    @JoinColumn({
        name: 'blogId',
    })
    blog: Blog;

    @ManyToOne(() => Post, (post) => post.files)
    @JoinColumn({
        name: 'postId',
    })
    post: Post;

    @Column()
    createdAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedDate: Date;
}
