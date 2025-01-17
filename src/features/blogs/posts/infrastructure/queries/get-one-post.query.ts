import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Post } from '../../domain/posts.entity';
import { Like } from '../../../likes/domain/likes.entity';
import { LikeStatus } from '../../../likes/api/dto/output/likes-view.dto';
import { PostsViewDto } from '../../api/dto/output/extended-likes-info-view.dto';

export class GetOnePostPayload implements IQuery {
    constructor(
        public postId: string,
        public userId: string = '00000000-0000-0000-0000-000000000000',
    ) {}
}

@QueryHandler(GetOnePostPayload)
export class GetOnePostQuery
    implements IQueryHandler<GetOnePostPayload, GetOnePostResultType>
{
    constructor(
        @InjectRepository(Post) private readonly postRepo: Repository<Post>,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

    async execute(
        queryPayload: GetOnePostPayload,
    ): Promise<GetOnePostResultType | null> {
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
                `
                JSON_AGG(
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
            .innerJoin('userlike.user', 'u2', 'u2.isBanned = :isBanned', {
                isBanned: false,
            })
            .where('"userlike"."userId" = :userId', {
                userId: queryPayload.userId,
            })
            .select([
                'userlike."likeStatus" AS "likeStatus"',
                'userlike.parentId',
            ]);

        const postWithNewestLikes = await this.postRepo
            .createQueryBuilder('p')
            .where('p.id = :postId', { postId: queryPayload.postId })
            .leftJoinAndSelect('p.blog', 'blog')
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
                'blog."id" AS "blogId"',
                'blog."name" AS "blogName"',
                'p."likesCount" AS "likesCount"',
                'p."dislikesCount" AS "dislikesCount"',
                'ul."likeStatus" AS "myStatus"',
                `l."newestLikes"`,
            ])
            .setParameters(likesTop3.getParameters())
            .setParameters(likes.getParameters())
            .setParameters(userLike.getParameters())
            .getRawOne();

        if (!postWithNewestLikes) {
            return null;
        }

        let likesNew = [];
        if (postWithNewestLikes.newestLikes) {
            postWithNewestLikes.newestLikes.map((p) => {
                if (!!p.addedAt && !!p.userId && !!p.login) {
                    likesNew.push({
                        addedAt: p.addedAt,
                        userId: p.userId,
                        login: p.login,
                    });
                }
            });
        }

        const fullPost: PostsViewDto = {
            id: postWithNewestLikes.id,
            blogId: postWithNewestLikes.blogId,
            blogName: postWithNewestLikes.blogName,
            content: postWithNewestLikes.content,
            createdAt: postWithNewestLikes.createdAt,
            title: postWithNewestLikes.title,
            shortDescription: postWithNewestLikes.shortDescription,
            extendedLikesInfo: {
                myStatus:
                    postWithNewestLikes.myStatus === null
                        ? LikeStatus.None
                        : (postWithNewestLikes.myStatus as LikeStatus),
                likesCount: postWithNewestLikes.likesCount,
                dislikesCount: postWithNewestLikes.dislikesCount,
                newestLikes: likesNew,
            },
        };

        return fullPost;
    }
}

export type GetOnePostResultType = PostsViewDto | null;
