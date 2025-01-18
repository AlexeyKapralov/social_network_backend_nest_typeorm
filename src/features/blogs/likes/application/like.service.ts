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
        parentType: 'post' | 'comment',
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const likePost = await this.likesRepository.findLikeByUserAndParent(
            userId,
            parentId,
            parentType,
        );

        if (!likePost) {
            notice.addError('like was not found');
            return notice;
        }

        const isLikeUpdated = await this.likesRepository.changeLikeStatus(
            userId,
            parentId,
            likeStatus,
            parentType,
        );
        if (!isLikeUpdated) {
            notice.addError('like did not updated or created');
            return notice;
        }

        return notice;
    }

    async recountLikes(): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();
        console.log('recountLikes started');

        /*
         * пересчет лайков для комментариев*/
        await this.dataSource.query(
            `
            UPDATE "comment" c
            SET "likesCount" = subquery.likes_count
            FROM (
                SELECT p."commentId", COALESCE(subquery.likes_count, 0) AS likes_count
                FROM (
                    SELECT DISTINCT "commentId"
                    FROM "like"
                ) p
                LEFT JOIN (
                    SELECT l."commentId", COUNT(*) AS likes_count
                    FROM "like" l
                    INNER JOIN "user" u ON l."userId" = u.id AND u."isBanned" = FALSE
                    left join blog_blacklist b on b."userId" = l."userId"
                    WHERE l."likeStatus" = 'Like' and b.id is null
                    GROUP BY l."commentId"
                ) subquery ON p."commentId" = subquery."commentId"
            ) subquery
            WHERE c.id = subquery."commentId";
            `,
        );

        /*
         * пересчет дизлайков для комментариев*/
        await this.dataSource.query(
            `
            UPDATE "comment" c
            SET "dislikesCount" = subquery.likes_count
            FROM (
                SELECT p."commentId", COALESCE(subquery.likes_count, 0) AS likes_count
                FROM (
                    SELECT DISTINCT "commentId"
                    FROM "like"
                ) p
                LEFT JOIN (
                    SELECT l."commentId", COUNT(*) AS likes_count
                    FROM "like" l
                    INNER JOIN "user" u ON l."userId" = u.id AND u."isBanned" = FALSE
                    left join blog_blacklist b on b."userId" = l."userId"
                    WHERE l."likeStatus" = 'Dislike' and b.id is null
                    GROUP BY l."commentId"
                ) subquery ON p."commentId" = subquery."commentId"
            ) subquery
            WHERE c.id = subquery."commentId";
            `,
        );

        /*
         * пересчет лайков для постов*/
        await this.dataSource.query(
            `            
            UPDATE "post" c
            SET "likesCount" = subquery.likes_count
            FROM (
                SELECT p."parentId", COALESCE(subquery.likes_count, 0) AS likes_count
                FROM (
                    SELECT DISTINCT "parentId"
                    FROM "like"
                ) p
                LEFT JOIN (
                    SELECT l."parentId", COUNT(*) AS likes_count
                    FROM "like" l
                    INNER JOIN "user" u ON l."userId" = u.id AND u."isBanned" = FALSE
                    left join blog_blacklist b on b."userId" = l."userId"
                    WHERE l."likeStatus" = 'Like' and b.id is null
                    GROUP BY l."parentId"
                ) subquery ON p."parentId" = subquery."parentId"
            ) subquery
            WHERE c.id = subquery."parentId";
            `,
        );

        /*
         * пересчет дизлайков для постов*/
        await this.dataSource.query(
            `
            UPDATE "post" c
            SET "dislikesCount" = subquery.likes_count
            FROM (
                SELECT p."parentId", COALESCE(subquery.likes_count, 0) AS likes_count
                FROM (
                    SELECT DISTINCT "parentId"
                    FROM "like"
                ) p
                LEFT JOIN (
                    SELECT l."parentId", COUNT(*) AS likes_count
                    FROM "like" l
                    INNER JOIN "user" u ON l."userId" = u.id AND u."isBanned" = FALSE
                    left join blog_blacklist b on b."userId" = l."userId"
                    WHERE l."likeStatus" = 'Dislike' and b.id is null
                    GROUP BY l."parentId"
                ) subquery ON p."parentId" = subquery."parentId"
            ) subquery
            WHERE c.id = subquery."parentId";
            `,
        );

        console.log('recountLikes finsihed');
        return notice;
    }
}
