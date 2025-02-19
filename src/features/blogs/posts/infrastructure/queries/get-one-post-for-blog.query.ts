import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Post } from '../../domain/posts.entity';
import { Like } from '../../../likes/domain/likes.entity';
import { LikeStatus } from '../../../likes/api/dto/output/likes-view.dto';
import { PostsViewDto } from '../../api/dto/output/extended-likes-info-view.dto';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs-query-repository';
import { File } from '../../../../files/domain/s3-storage.entity';
import { S3StorageService } from '../../../../files/application/s3-storage.service';
import { PhotoSizeViewDto } from '../../../blogs/api/dto/output/post-images-view.dto';

export class GetOnePostForBlogPayload implements IQuery {
    constructor(
        public postId: string,
        public blogId: string,
        public userId: string = '00000000-0000-0000-0000-000000000000',
    ) {}
}

@QueryHandler(GetOnePostForBlogPayload)
export class GetOnePostForBlogQuery
    implements IQueryHandler<GetOnePostForBlogPayload, GetOnePostResultType>
{
    constructor(
        @InjectRepository(Post) private readonly postRepo: Repository<Post>,
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly blogQueryRepository: BlogsQueryRepository,
        private readonly s3StorageService: S3StorageService,
    ) {}

    async execute(
        queryPayload: GetOnePostForBlogPayload,
    ): Promise<GetOnePostResultType> {
        const bannedBlogByPost = await this.dataSource.query(
            `
            select p.*, b.id from post p 
            left join blog b on b.id = p."blogId"
            left join blog_blacklist bb on bb."blogId" = b.id 
            where bb.id is not null 
            and p.id = $1
            and b.id = $2
        `,
            [queryPayload.postId, queryPayload.blogId],
        );
        if (bannedBlogByPost.length) {
            return null;
        }
        let foundBlog;
        try {
            foundBlog = await this.blogQueryRepository.findBlog(
                queryPayload.blogId,
            );
        } catch {}
        if (!foundBlog) {
            return null;
        }

        const likesSource = this.dataSource
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
            .from(`(${likesSource.getQuery()})`, 'l')
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
            .innerJoin('blog.user', 'u2', 'u2.isBanned = :isBanned', {
                isBanned: false,
            })
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
                'p."blogCreatedAt" AS "blogCreatedAt"',
                'p."likesCount" AS "likesCount"',
                'p."dislikesCount" AS "dislikesCount"',
                'ul."likeStatus" AS "myStatus"',
                `l."newestLikes"`,
            ])
            .where('"blogId" = :blogId', { blogId: queryPayload.blogId })
            .setParameters(likesTop3.getParameters())
            .setParameters(likesSource.getParameters())
            .setParameters(userLike.getParameters())
            .getRawOne();

        let post: Omit<PostsViewDto, 'images'>;
        let likes = [];

        if (postWithNewestLikes.newestLikes) {
            postWithNewestLikes.newestLikes.map((p) => {
                if (!!p.addedAt && !!p.userId && !!p.login) {
                    likes.push({
                        addedAt: p.addedAt,
                        userId: p.userId,
                        login: p.login,
                    });
                }
            });
        }

        post = {
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
                newestLikes: likes,
            },
        };

        const files: Pick<File, 'fileKey' | 'fileSize' | 'height' | 'width'>[] =
            await this.dataSource.query(
                `
                SELECT f."fileKey", f."fileSize", f.height, f.width
                FROM public.file f
                WHERE f."postId" = $1 AND f."deletedDate" IS NULL
            `,
                [post.id],
            );

        for (const key of files) {
            key.fileKey = await this.s3StorageService.getPreSignedUrl(
                key.fileKey,
            );
        }

        const imgs: PhotoSizeViewDto[] = [];
        files.forEach((file: File) => {
            const imgNew: PhotoSizeViewDto = {
                fileSize: Number(file.fileSize),
                height: Number(file.height),
                width: Number(file.width),
                url: file.fileKey,
            };
            imgs.push(imgNew);
        });

        return {
            ...post,
            images: {
                main: imgs,
            },
        };
    }
}

export type GetOnePostResultType = PostsViewDto;
