import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InterlayerNotice } from '../../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../../common/dto/paginator-dto';
import { QueryDtoBase } from '../../../../../common/dto/query-dto';
import { Post } from '../../domain/posts.entity';
import { Like } from '../../../likes/domain/likes.entity';
import { LikeStatus } from '../../../likes/api/dto/output/likes-view.dto';
import { PostsViewDto } from '../../api/dto/output/extended-likes-info-view.dto';
import { NotFoundException } from '@nestjs/common';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs-query-repository';

export class GetPostsPayload implements IQuery {
    constructor(
        public query: QueryDtoBase,
        public userId: string = '00000000-0000-0000-0000-000000000000',
    ) {}
}

@QueryHandler(GetPostsPayload)
export class GetPostsQuery
    implements IQueryHandler<GetPostsPayload, GetPostsResultType>
{
    constructor(
        @InjectRepository(Post) private postRepo: Repository<Post>,
        @InjectDataSource() private dataSource: DataSource,
        private blogQueryRepository: BlogsQueryRepository,
    ) {}

    async execute(queryPayload: GetPostsPayload): Promise<GetPostsResultType> {
        const limit = queryPayload.query.pageSize;
        const offset =
            (queryPayload.query.pageNumber - 1) * queryPayload.query.pageSize;

        let countPosts = 0;
        countPosts = await this.postRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.blog', 'blog')
            .getCount();

        const likesTop3 = this.dataSource
            .getRepository(Like)
            .createQueryBuilder('like')
            .leftJoinAndSelect('like.user', 'u')
            .where('"like"."likeStatus" = :likeStatus', {
                likeStatus: LikeStatus.Like,
            })
            .orderBy(`"like"."createdAt"`, 'DESC')
            .limit(3)
            .select([
                'like.createdAt AS "likesCreatedAt"',
                'like.parentId AS "likesParentId"',
                'u.id AS "likesUserId"',
                'u.login AS "likesUserLogin"',
            ]);

        const userLike = this.dataSource
            .getRepository(Like)
            .createQueryBuilder('userlike')
            .where('"userlike"."userId" = :userId', {
                userId: queryPayload.userId,
            })
            .select([
                'userlike."likeStatus" AS "likeStatus"',
                'userlike.parentId',
            ]);

        const postsUnique = this.postRepo
            .createQueryBuilder('p')
            .limit(limit)
            .leftJoinAndSelect('p.blog', 'blog')
            .select([
                'p.id AS id',
                'p.title AS title',
                'p."shortDescription" AS "shortDescription"',
                'p.content AS content',
                'p."likesCount" AS "likesCount"',
                'p."dislikesCount" AS "dislikesCount"',
                'p."createdAt" AS "createdAt"',
                'blog.id AS "blogId"',
                'blog."name" AS "blogName"',
                'blog."createdAt" AS "blogCreatedAt"',
            ])
            .orderBy(
                `"${queryPayload.query.sortBy === 'createdAt' ? `p"."createdAt` : queryPayload.query.sortBy}"`,
                queryPayload.query.sortDirection,
            )
            .offset(offset);

        const postsSourceWithNewestLikes = await this.dataSource
            .createQueryBuilder()
            .from('(' + postsUnique.getQuery() + ')', 'p')
            .leftJoinAndSelect(
                '(' + userLike.getQuery() + ')',
                'ul',
                '"ul"."parentId" = p.id',
            )
            .leftJoinAndSelect(
                '(' + likesTop3.getQuery() + ')',
                'l',
                '"l"."likesParentId" = p.id',
            )
            .select([
                'p.id AS id',
                'p.title AS title',
                'p."shortDescription" AS "shortDescription"',
                'p.content AS content',
                'p."createdAt" AS "createdAt"',
                'p."blogId" AS "blogId"',
                'p."blogName" AS "blogName"',
                'p."blogCreatedAt" AS "blogCreatedAt"',
                'p."likesCount" AS "likesCount"',
                'p."dislikesCount" AS "dislikesCount"',
                'ul."likeStatus" AS "myStatus"',
                'l.*',
            ])
            .orderBy(
                `"${queryPayload.query.sortBy === 'createdAt' ? `p"."createdAt` : queryPayload.query.sortBy}"`,
                queryPayload.query.sortDirection,
            )
            .setParameters(likesTop3.getParameters())
            .setParameters(userLike.getParameters())
            .setParameters(postsUnique.getParameters())
            .getRawMany();

        const uniquePostsSet = new Set();
        postsSourceWithNewestLikes.forEach((el) => {
            uniquePostsSet.add(el.id);
        });
        const uniquePosts = Array.from(uniquePostsSet);

        const posts: PostsViewDto[] = [];
        uniquePosts.forEach((postId) => {
            let likes = [];
            const postSource = postsSourceWithNewestLikes.filter(
                (p) => p.id === postId,
            );

            postSource.map((p) => {
                if (
                    !!p.likesUserId &&
                    !!p.likesUserLogin &&
                    !!p.likesCreatedAt
                ) {
                    likes.push({
                        addedAt: p.likesCreatedAt,
                        userId: p.likesUserId,
                        login: p.likesUserLogin,
                    });
                }
            });

            const fullPost: PostsViewDto = {
                id: postSource[0].id,
                blogId: postSource[0].blogId,
                blogName: postSource[0].blogName,
                content: postSource[0].content,
                createdAt: postSource[0].createdAt,
                title: postSource[0].title,
                shortDescription: postSource[0].shortDescription,
                extendedLikesInfo: {
                    myStatus:
                        postSource[0].myStatus === null
                            ? LikeStatus.None
                            : (postSource[0].myStatus as LikeStatus),
                    likesCount: postSource[0].likesCount,
                    dislikesCount: postSource[0].dislikesCount,
                    newestLikes: likes,
                },
            };
            posts.push(fullPost);
        });

        const postsWithPaginate: PaginatorDto<PostsViewDto> = {
            pagesCount: Math.ceil(countPosts / queryPayload.query.pageSize),
            page: queryPayload.query.pageNumber,
            pageSize: queryPayload.query.pageSize,
            totalCount: countPosts,
            items: posts,
        };

        return postsWithPaginate;
    }
}

export type GetPostsResultType = PaginatorDto<PostsViewDto>;
