import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommentsViewDto } from '../../api/dto/output/comment-view.dto';
import { Comment } from '../../domain/comment.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Like } from '../../../likes/domain/likes.entity';
import { LikeStatus } from '../../../likes/api/dto/output/likes-view.dto';
import { QueryDtoBase } from '../../../../../common/dto/query-dto';
import { PaginatorDto } from '../../../../../common/dto/paginator-dto';

export class GetCommentsForPostPayload implements IQuery {
    constructor(
        public query: QueryDtoBase,
        public postId: string,
        public userId: string = null,
    ) {}
}

@QueryHandler(GetCommentsForPostPayload)
export class GetCommentsForPostQuery
    implements
        IQueryHandler<GetCommentsForPostPayload, GetCommentsForPostResultType>
{
    constructor(
        @InjectRepository(Comment) private commentRepo: Repository<Comment>,
        @InjectDataSource() private dataSource: DataSource,
    ) {}

    async execute(
        queryPayload: GetCommentsForPostPayload,
    ): Promise<GetCommentsForPostResultType | null> {
        const userLike = this.dataSource
            .getRepository(Like)
            .createQueryBuilder('userlike')
            // .where('"userlike"."parentId" = :postId', {
            //     postId: queryPayload.postId,
            // })
            .where('"userlike"."userId" = :userId', {
                userId: queryPayload.userId,
            })
            .select(
                `CASE WHEN userlike."likeStatus" IS NULL THEN '${LikeStatus.None}' ELSE userlike."likeStatus" END AS "myStatus"`,
            );
        //     .getOne();
        //

        const commentBaseQuery = this.commentRepo
            .createQueryBuilder('c')
            .where('c."postId" = :postId', { postId: queryPayload.postId })
            .leftJoinAndSelect('c.user', 'u')
            .leftJoinAndSelect(
                'c.like',
                'l',
                '"c"."id" = l."commentId" AND l."userId" = :userId',
                { userId: queryPayload.userId },
            )
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
                        'myStatus', COALESCE(l."likeStatus", '${LikeStatus.None}')
                    )
                )::json->0 AS "likesInfo"`,
            ])
            .groupBy('c.id')
            .addGroupBy('c.content')
            .addGroupBy('c."createdAt"')
            .orderBy(
                `"${queryPayload.query.sortBy === 'createdAt' ? `c"."createdAt` : queryPayload.query.sortBy}"`,
                queryPayload.query.sortDirection,
            );

        const posts = await commentBaseQuery
            .limit(queryPayload.query.pageSize)
            .offset(
                (queryPayload.query.pageNumber - 1) *
                    queryPayload.query.pageSize,
            )
            .getRawMany();

        const countPosts = await commentBaseQuery.getCount();

        const commentsWithPaginate: PaginatorDto<CommentsViewDto> = {
            pagesCount: Math.ceil(countPosts / queryPayload.query.pageSize),
            page: queryPayload.query.pageNumber,
            pageSize: queryPayload.query.pageSize,
            totalCount: countPosts,
            items: posts,
        };

        return commentsWithPaginate;
    }
}

export type GetCommentsForPostResultType = PaginatorDto<CommentsViewDto> | null;
