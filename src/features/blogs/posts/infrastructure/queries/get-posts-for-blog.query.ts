import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginatorDto } from '../../../../../common/dto/paginator-dto';
import { QueryDto } from '../../../../../common/dto/query-dto';
import { Post } from '../../domain/posts.entity';
import { Like } from '../../../likes/domain/likes.entity';
import { LikeStatus } from '../../../likes/api/dto/output/likes-view.dto';
import { PostsViewDto } from '../../api/dto/output/extended-likes-info-view.dto';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs-query-repository';

export class GetPostsForBlogPayload implements IQuery {
    constructor(
        public query: QueryDto,
        public blogId: string,
        public userId: string = '00000000-0000-0000-0000-000000000000',
    ) {}
}

@QueryHandler(GetPostsForBlogPayload)
export class GetPostsForBlogQuery
    implements IQueryHandler<GetPostsForBlogPayload, GetPostsResultType>
{
    constructor(
        @InjectRepository(Post) private readonly postRepo: Repository<Post>,
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly blogQueryRepository: BlogsQueryRepository,
    ) {}

    async execute(
        queryPayload: GetPostsForBlogPayload,
    ): Promise<GetPostsResultType> {
        let foundBlog;
        try {
            foundBlog = await this.blogQueryRepository.findBlog(
                queryPayload.blogId,
            );
        } catch {}
        if (!foundBlog) {
            return null;
        }

        const limit = queryPayload.query.pageSize;
        const offset =
            (queryPayload.query.pageNumber - 1) * queryPayload.query.pageSize;

        let countPosts = 0;
        countPosts = await this.postRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.blog', 'blog')
            .innerJoin('blog.user', 'u2', 'u2.isBanned = :isBanned', {
                isBanned: false,
            })
            .where('blog.id = :blogId', { blogId: queryPayload.blogId })
            .getCount();

        const likes = this.dataSource
            .getRepository(Like)
            .createQueryBuilder('like')
            .leftJoinAndSelect('like.user', 'u')
            .innerJoin('like.user', 'u2', 'u2.isBanned = :isBanned', {
                isBanned: false,
            })
            .where('"like"."likeStatus" = :likeStatus', {
                likeStatus: LikeStatus.Like,
            })
            .select([
                'like.createdAt AS "addedAt"',
                'like.parentId AS "likesParentId"',
                'u.id AS "userId"',
                'u.login AS "login"',
            ])
            .addSelect(
                'ROW_NUMBER() OVER (PARTITION BY "like"."parentId" ORDER BY "like"."createdAt" DESC) AS "rowNum"',
            );

        const likesTop3 = this.dataSource
            .createQueryBuilder()
            .from(`(${likes.getQuery()})`, 'l')
            .select([
                '"l"."likesParentId" AS "likesParentId"',
                `JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'addedAt', l."addedAt",
                        'userId', l."userId",
                        'login', l."login"
                    )
                ) AS "newestLikes"`,
            ])
            .groupBy('"l"."likesParentId"')
            .where('l."rowNum"<= 3');

        const userLike = this.dataSource
            .getRepository(Like)
            .createQueryBuilder('userlike')
            .where('"userlike"."userId" = :userId', {
                userId: queryPayload.userId,
            })
            .innerJoin('userlike.user', 'u2', 'u2.isBanned = :isBanned', {
                isBanned: false,
            })
            .select([
                'userlike."likeStatus" AS "likeStatus"',
                'userlike.parentId',
            ]);

        const postsUnique = this.postRepo
            .createQueryBuilder('p')
            .limit(limit)
            .leftJoinAndSelect('p.blog', 'blog')
            .innerJoin('blog.user', 'u2', 'u2.isBanned = :isBanned', {
                isBanned: false,
            })
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
            .from(`(${postsUnique.getQuery()})`, 'p')
            .leftJoinAndSelect(
                `(${userLike.getQuery()})`,
                'ul',
                '"ul"."parentId" = p.id',
            )
            .leftJoinAndSelect(
                `(${likesTop3.getQuery()})`,
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
                'p."likesCount" AS "likesCount"',
                'p."dislikesCount" AS "dislikesCount"',
                'ul."likeStatus" AS "myStatus"',
                `l."newestLikes"`,
            ])
            .orderBy(
                `"${queryPayload.query.sortBy === 'createdAt' ? `p"."createdAt` : queryPayload.query.sortBy}"`,
                queryPayload.query.sortDirection,
            )
            .where('p."blogId" = :blogId', { blogId: queryPayload.blogId })
            .setParameters(userLike.getParameters())
            .setParameters(likes.getParameters())
            .setParameters(postsUnique.getParameters())
            .getRawMany();

        const posts: PostsViewDto[] = [];
        postsSourceWithNewestLikes.forEach((post) => {
            let likes = [];

            if (post.newestLikes) {
                post.newestLikes.map((p) => {
                    if (!!p.addedAt && !!p.userId && !!p.login) {
                        likes.push({
                            addedAt: p.addedAt,
                            userId: p.userId,
                            login: p.login,
                        });
                    }
                });
            }

            const fullPost: PostsViewDto = {
                id: post.id,
                blogId: post.blogId,
                blogName: post.blogName,
                content: post.content,
                createdAt: post.createdAt,
                title: post.title,
                shortDescription: post.shortDescription,
                extendedLikesInfo: {
                    myStatus:
                        post.myStatus === null
                            ? LikeStatus.None
                            : (post.myStatus as LikeStatus),
                    likesCount: post.likesCount,
                    dislikesCount: post.dislikesCount,
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
