import { Injectable } from '@nestjs/common';
import { LikeStatus } from '../api/dto/output/likes-view.dto';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { LikeRepository } from '../repository/like.repository';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { CommentsRepository } from '../../comments/infrastructure/comments.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsersQueryRepository } from '../../../users/infrastructure/users-query-repository';

@Injectable()
export class LikeService {
    constructor(
        private readonly likesRepository: LikeRepository,
        private readonly postsRepository: PostsRepository,
        private readonly commentsRepository: CommentsRepository,
        private readonly usersQueryRepository: UsersQueryRepository,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}
    async findLikeStatus(
        userId: string,
        parentId: string,
        type: 'post' | 'comment',
    ): Promise<InterlayerNotice<LikeStatus>> {
        const notice = new InterlayerNotice<LikeStatus>();

        const like = await this.likesRepository.findLikeByUserAndParent(
            userId,
            parentId,
            type,
        );

        if (!like) {
            notice.addError('like was not found');
            return notice;
        }
        notice.addData(like.likeStatus);
        return notice;
    }

    async changeLikeStatus(
        userId: string,
        parentId: string,
        likeStatus: LikeStatus,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const likePost = await this.likesRepository.findLikeByUserAndParent(
            userId,
            parentId,
            'post',
        );
        if (!likePost) {
            notice.addError('like was not found');
            return notice;
        }

        const isLikeUpdated = await this.likesRepository.changeLikeStatus(
            userId,
            parentId,
            likeStatus,
        );
        if (!isLikeUpdated) {
            notice.addError('like did not updated or created');
            return notice;
        }

        return notice;
    }
}
