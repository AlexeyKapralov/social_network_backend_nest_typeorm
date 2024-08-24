import { LikeStatus } from '../api/dto/output/likes-view.dto';
import {
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../../posts/domain/posts.entity';
import { User } from '../../../users/domain/user-entity';

@Entity()
export class Like {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    createdAt: string;

    @Column()
    likeStatus: LikeStatus;

    @DeleteDateColumn()
    deletedDate: Date;

    @ManyToOne(() => Post)
    @JoinColumn({ name: 'parentId', referencedColumnName: 'id' })
    post: Post;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user: User;
}
