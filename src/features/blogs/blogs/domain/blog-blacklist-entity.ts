import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from './blog-entity';

@Entity()
export class BlogBlacklist extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    blogId: string;

    @Column({ type: 'uuid', nullable: true })
    userId: string;

    @Column({ nullable: false })
    banReason: string;

    @Column({ nullable: false })
    banDate: Date;

    @ManyToOne(() => Blog)
    @JoinColumn({ name: 'blogId' })
    blog: Blog;
}
