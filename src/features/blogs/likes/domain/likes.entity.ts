import { LikeStatus } from '../api/dto/output/likes-view.dto';
import {
    BaseEntity,
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../../posts/domain/posts.entity';
import { User } from '../../../users/domain/user-entity';
import { Comment } from '../../comments/domain/comment.entity';

@Entity()
export class Like extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    createdAt: Date;

    @Column()
    likeStatus: LikeStatus;

    @DeleteDateColumn()
    deletedDate: Date;

    @ManyToOne(() => Post, { nullable: true })
    @JoinColumn({ name: 'parentId', referencedColumnName: 'id' })
    post: Post;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user: User;

    @ManyToOne(() => Comment, { nullable: true })
    @JoinColumn({ name: 'commentId', referencedColumnName: 'id' })
    comment: Comment;
}
