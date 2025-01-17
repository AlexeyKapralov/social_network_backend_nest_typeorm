import { Injectable } from '@nestjs/common';
import { CommentInputDto } from '../api/dto/input/comment-input.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from '../domain/comment.entity';
import { Repository } from 'typeorm';
import { User } from '../../../users/domain/user-entity';
import { Post } from '../../posts/domain/posts.entity';

@Injectable()
export class CommentsRepository {
    constructor(
        @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    ) {}
    async createComment(
        commentInputDto: CommentInputDto,
        user: User,
        post: Post,
    ) {
        return await Comment.createComment(commentInputDto, user, post);
    }
    async findComment(commentId: string): Promise<Comment | null> {
        return this.commentRepo.findOne({
            where: {
                id: commentId,
                user: {
                    isBanned: false,
                },
            },
            relations: {
                user: true,
            },
        });
    }

    async updateComment(
        commentId: string,
        commentInputDto: CommentInputDto,
    ): Promise<boolean> {
        const isUpdatedComment = await this.commentRepo.update(
            {
                id: commentId,
                user: {
                    isBanned: false,
                },
            },
            { content: commentInputDto.content },
        );

        return isUpdatedComment.affected === 1;
    }

    async deleteComment(commentId: string): Promise<boolean> {
        const isDeletedComment = await this.commentRepo.softDelete({
            id: commentId,
        });
        return isDeletedComment.affected === 1;
    }

    async changeLikesAndDislikesCount(
        commentId: string,
        likesCount: number,
        dislikesCount: number,
    ): Promise<boolean> {
        const comment = await this.findComment(commentId);

        try {
            comment.addCountLikes(likesCount);
            comment.addCountDislikes(dislikesCount);
            await this.commentRepo.save(comment);
        } catch (e) {
            console.log('comment dislikes and likes were not updated: ' + e);
            return false;
        }
        return true;
    }
}
