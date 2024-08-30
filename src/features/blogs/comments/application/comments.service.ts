import { Injectable } from '@nestjs/common';
import { CommentInputDto } from '../api/dto/input/comment-input.dto';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';
import { CommentsViewDto } from '../api/dto/output/comment-view.dto';
import { UsersQueryRepository } from '../../../users/infrastructure/users-query-repository';
import { PostsService } from '../../posts/application/posts.service';
import { CommentsRepository } from '../infrastructure/comments.repository';
import {
    GetOneCommentPayload,
    GetOneCommentResultType,
} from '../infrastructure/queries/get-one-comment.query';
import { QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { User } from '../../../users/domain/user-entity';
import { Post } from '../../posts/domain/posts.entity';
import { QueryDtoBase } from '../../../../common/dto/query-dto';
import {
    GetCommentsForPostPayload,
    GetCommentsForPostResultType,
} from '../infrastructure/queries/get-comments-for-post.query';
import { PaginatorDto } from '../../../../common/dto/paginator-dto';
import { LikeInputDto } from '../../likes/api/dto/input/like-input.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { LikeService } from '../../likes/application/like.service';

@Injectable()
export class CommentsService {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private usersQueryRepository: UsersQueryRepository,
        private postsService: PostsService,
        private commentsRepository: CommentsRepository,
        private likesService: LikeService,
        private queryBus: QueryBus,
    ) {}
    async createComment(
        commentInputDto: CommentInputDto,
        userId: string,
        postId: string,
    ) {
        const notice = new InterlayerNotice<CommentsViewDto>();

        const user = await this.dataSource
            .getRepository(User)
            .findOne({ where: { id: userId } });
        if (!user) {
            notice.addError(
                'user does not exist',
                'user',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const post = await this.dataSource
            .getRepository(Post)
            .findOne({ where: { id: postId } });
        if (!post) {
            notice.addError(
                'post does not exist',
                'post',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const comment = await this.commentsRepository.createComment(
            commentInputDto,
            user,
            post,
        );

        const mappedCommentInterlayer = await this.findOneComment(comment.id);
        if (!mappedCommentInterlayer) {
            notice.addError('comment was not created');
            return notice;
        }
        notice.addData(mappedCommentInterlayer.data);
        return notice;
    }

    async findOneComment(
        commentId: string,
        userId?: string,
    ): Promise<InterlayerNotice<CommentsViewDto | null>> {
        const notice = new InterlayerNotice<CommentsViewDto>();
        const queryPayload = new GetOneCommentPayload(commentId, userId);
        const comment = await this.queryBus.execute<
            GetOneCommentPayload,
            GetOneCommentResultType
        >(queryPayload);
        if (!comment) {
            notice.addError('comment was not found');
            return notice;
        }
        notice.addData(comment);
        return notice;
    }

    async findComments(
        query: QueryDtoBase,
        postId: string,
        userId?: string,
    ): Promise<InterlayerNotice<PaginatorDto<CommentsViewDto> | null>> {
        const notice = new InterlayerNotice<PaginatorDto<CommentsViewDto>>();
        const post = await this.postsService.findOnePost(postId);
        if (!post) {
            notice.addError('post was not found');
            return notice;
        }
        const queryPayload = new GetCommentsForPostPayload(
            query,
            postId,
            userId,
        );
        const comment = await this.queryBus.execute<
            GetCommentsForPostPayload,
            GetCommentsForPostResultType
        >(queryPayload);
        if (!comment) {
            notice.addError('comment was not found');
            return notice;
        }
        notice.addData(comment);
        return notice;
    }

    async updateComment(
        commentInputDto: CommentInputDto,
        commentId: string,
        userId: string,
    ): Promise<InterlayerNotice<PaginatorDto<CommentsViewDto> | null>> {
        const notice = new InterlayerNotice();
        const comment = await this.commentsRepository.findComment(commentId);
        if (!comment) {
            notice.addError(
                'comment not found',
                'comment',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }
        const user = await this.usersQueryRepository.findUserById(userId);
        if (!user) {
            notice.addError(
                'user was not found',
                'user',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (comment.user.id !== userId) {
            notice.addError(
                'user was not owner for comment',
                'user',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isCommentUpdated = await this.commentsRepository.updateComment(
            commentId,
            commentInputDto,
        );
        if (!isCommentUpdated) {
            notice.addError(
                'comment was not updated',
                'comment',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }

        return notice;
    }

    async deleteComment(
        commentId: string,
        userId: string,
    ): Promise<InterlayerNotice<PaginatorDto<CommentsViewDto> | null>> {
        const notice = new InterlayerNotice();
        const comment = await this.commentsRepository.findComment(commentId);
        if (!comment) {
            notice.addError(
                'comment not found',
                'comment',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }
        const user = await this.usersQueryRepository.findUserById(userId);
        if (!user) {
            notice.addError(
                'user was not found',
                'user',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (comment.user.id !== userId) {
            notice.addError(
                'user was not owner for comment',
                'user',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isCommentDeleted =
            await this.commentsRepository.deleteComment(commentId);
        if (!isCommentDeleted) {
            notice.addError(
                'comment was not deleted',
                'comment',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }

        return notice;
    }

    async updateLikeStatus(
        commentId: string,
        userId: string,
        likeInputDto: LikeInputDto,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const comment = await this.commentsRepository.findComment(commentId);
        if (!comment) {
            notice.addError('comment was not found');
            return notice;
        }
        const user = await this.usersQueryRepository.findUserById(userId);
        if (!user) {
            notice.addError('user was not found');
            return notice;
        }

        const oldLikeStatusInterlayer = await this.likesService.findLikeStatus(
            userId,
            commentId,
            'comment',
        );
        if (oldLikeStatusInterlayer.hasError()) {
            notice.addError('like was not found');
            return notice;
        }
        const isLikeStatusUpdate = await this.likesService.changeLikeStatus(
            userId,
            commentId,
            likeInputDto.likeStatus,
        );
        if (isLikeStatusUpdate.hasError()) {
            notice.addError('like status was not updated');
            return notice;
        }

        const oldLikeStatus = oldLikeStatusInterlayer.data;
        const newLikeStatus = likeInputDto.likeStatus;

        let likesCount = 0;
        let dislikesCount = 0;
        switch (true) {
            case likeInputDto.likeStatus === LikeStatus.Like &&
                oldLikeStatus === LikeStatus.Dislike:
                likesCount = 1;
                dislikesCount = -1;
                break;
            case newLikeStatus === LikeStatus.Like &&
                oldLikeStatus === LikeStatus.None:
                likesCount = 1;
                // comment.addCountDislikes(0)
                break;
            case newLikeStatus === LikeStatus.Dislike &&
                oldLikeStatus === LikeStatus.Like:
                likesCount = -1;
                dislikesCount = 1;
                break;
            case newLikeStatus === LikeStatus.Dislike &&
                oldLikeStatus === LikeStatus.None:
                dislikesCount = 1;
                break;
            case newLikeStatus === LikeStatus.None &&
                oldLikeStatus === LikeStatus.Like:
                likesCount = -1;
                break;
            case newLikeStatus === LikeStatus.None &&
                oldLikeStatus === LikeStatus.Dislike:
                dislikesCount = -1;
                break;
            default:
                break;
        }

        const isLikesCountChanged =
            await this.commentsRepository.changeLikesAndDislikesCount(
                commentId,
                likesCount,
                dislikesCount,
            );
        if (!isLikesCountChanged) {
            notice.addError('likes and dislikes count were not changed');
            return notice;
        }
        return notice;
    }
}
