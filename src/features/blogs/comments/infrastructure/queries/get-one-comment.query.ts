import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommentsViewDto } from '../../api/dto/output/comment-view.dto';
import { Comment } from '../../domain/comment.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Like } from '../../../likes/domain/likes.entity';
import { LikeStatus } from '../../../likes/api/dto/output/likes-view.dto';

export class GetOneCommentPayload implements IQuery {
    constructor(
        public commentId: string,
        public userId: string = null,
    ) {}
}

@QueryHandler(GetOneCommentPayload)
export class GetOneCommentQuery
    implements IQueryHandler<GetOneCommentPayload, GetOneCommentResultType>
{
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepo: Repository<Comment>,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

    async execute(
        queryPayload: GetOneCommentPayload,
    ): Promise<GetOneCommentResultType | null> {
        const userLike = await this.dataSource
            .getRepository(Like)
            .createQueryBuilder('userlike')
            .innerJoin('userlike.user', 'u2', 'u2.isBanned = :isBanned', {
                isBanned: false,
            })
            .where('"userlike"."commentId" = :commentId', {
                commentId: queryPayload.commentId,
            })
            .andWhere('"userlike"."userId" = :userId', {
                userId: queryPayload.userId,
            })
            .select(
                `CASE WHEN userlike."likeStatus" IS NULL THEN '${LikeStatus.None}' ELSE userlike."likeStatus" END AS "myStatus"`,
            )
            .getRawOne();

        const commentBaseQuery = await this.commentRepo
            .createQueryBuilder('c')
            .where('c.id = :commentId', { commentId: queryPayload.commentId })
            .leftJoinAndSelect('c.user', 'u')
            .select([
                'c.id AS id',
                'c.content AS content',
                'c."createdAt" AS "createdAt"',
                `JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'userId', u.id,
                        'userLogin', u.login
                    )
                )::json->0 AS "commentatorInfo"`,
                `JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'likesCount', c."likesCount",
                        'dislikesCount', c."dislikesCount",
                        'myStatus', '${userLike && userLike.myStatus ? userLike.myStatus : LikeStatus.None}'
                    )
                )::json->0 AS "likesInfo"`,
            ])
            .where('u.isBanned = :isBanned', {
                isBanned: false,
            })
            .groupBy('c.id')
            .addGroupBy('c.content')
            .addGroupBy('c."createdAt"')
            .getRawOne();

        return await commentBaseQuery;
    }
}

export type GetOneCommentResultType = CommentsViewDto | null;
