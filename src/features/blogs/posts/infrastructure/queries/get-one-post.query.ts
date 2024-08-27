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
        @InjectRepository(Post) private postRepo: Repository<Post>,
        @InjectDataSource() private dataSource: DataSource,
    ) {}

    async execute(
        queryPayload: GetOnePostPayload,
    ): Promise<GetOnePostResultType | null> {
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

        const postWithNewestLikes = await this.postRepo
            .createQueryBuilder('p')
            .where('p.id = :postId', { postId: queryPayload.postId })
            .leftJoinAndSelect('p.blog', 'blog')
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
                'blog."id" AS "blogId"',
                'blog."name" AS "blogName"',
                'blog."createdAt" AS "blogCreatedAt"',
                'p."likesCount" AS "likesCount"',
                'p."dislikesCount" AS "dislikesCount"',
                'ul."likeStatus" AS "myStatus"',
                'l.*',
            ])
            .setParameters(likesTop3.getParameters())
            .setParameters(userLike.getParameters())
            .getRawMany();

        if (postWithNewestLikes.length === 0) {
            return null;
        }

        let post: PostsViewDto;
        let likes = [];

        postWithNewestLikes.map((p) => {
            if (!!p.likesUserId && !!p.likesUserLogin && !!p.likesCreatedAt) {
                likes.push({
                    addedAt: p.likesCreatedAt,
                    userId: p.likesUserId,
                    login: p.likesUserLogin,
                });
            }
        });

        post = {
            id: postWithNewestLikes[0].id,
            blogId: postWithNewestLikes[0].blogId,
            blogName: postWithNewestLikes[0].blogName,
            content: postWithNewestLikes[0].content,
            createdAt: postWithNewestLikes[0].createdAt,
            title: postWithNewestLikes[0].title,
            shortDescription: postWithNewestLikes[0].shortDescription,
            extendedLikesInfo: {
                myStatus:
                    postWithNewestLikes[0].myStatus === null
                        ? LikeStatus.None
                        : (postWithNewestLikes[0].myStatus as LikeStatus),
                likesCount: postWithNewestLikes[0].likesCount,
                dislikesCount: postWithNewestLikes[0].dislikesCount,
                newestLikes: likes,
            },
        };

        return post;
    }
}

export type GetOnePostResultType = PostsViewDto | null;
