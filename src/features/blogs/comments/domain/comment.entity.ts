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
import { CommentInputDto } from '../api/dto/input/comment-input.dto';
import { User } from '../../../users/domain/user-entity';
import { Post } from '../../posts/domain/posts.entity';
import { Like } from '../../likes/domain/likes.entity';

@Entity()
export class Comment extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column({ collation: 'C' })
    content: string;
    @Column()
    createdAt: string;
    @Column()
    likesCount: number;
    @Column()
    dislikesCount: number;
    @Column()
    isDeleted: boolean;
    @DeleteDateColumn()
    deletedDate: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user: User;

    @ManyToOne(() => Post)
    @JoinColumn({ name: 'postId', referencedColumnName: 'id' })
    post: Post;

    @OneToMany(() => Like, (like) => like.comment)
    like: Like[];

    static async createComment(
        commentInputDto: CommentInputDto,
        userId: User,
        postId: Post,
    ) {
        const comment = new Comment();
        comment.content = commentInputDto.content;
        comment.createdAt = new Date().toISOString();
        comment.user = userId;
        comment.post = postId;
        comment.dislikesCount = 0;
        comment.likesCount = 0;
        comment.isDeleted = false;
        await comment.save();
        return comment;
    }

    addCountLikes(count: number) {
        this.likesCount += count;
    }

    addCountDislikes(count: number) {
        this.dislikesCount += count;
    }
}
