import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Blog } from './blogs/domain/blog-entity';
import { BlogsService } from './blogs/application/blogs-service';
import { BlogsRepository } from './blogs/infrastructure/blogs-repository';
import { BlogsQueryRepository } from './blogs/infrastructure/blogs-query-repository';
import { GetBlogsQuery } from './blogs/infrastructure/queries/get-blogs-query';
import { BlogsSaController } from './blogs/api/blogs-sa-controller';
import { BlogsController } from './blogs/api/blogs-controller';
import { PostsService } from './posts/application/posts.service';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsQueryRepository } from './posts/infrastructure/posts-query.repository';
import { Post } from './posts/domain/posts.entity';
import { Like } from './likes/domain/likes.entity';
import { GetPostsForBlogQuery } from './posts/infrastructure/queries/get-posts-for-blog.query';
import { PostsController } from './posts/api/posts.controller';
import { GetPostsQuery } from './posts/infrastructure/queries/get-posts.query';
import { GetOnePostQuery } from './posts/infrastructure/queries/get-one-post.query';
import { CommentsController } from './comments/api/comments.controller';
import { CommentsService } from './comments/application/comments.service';
import { CommentsRepository } from './comments/infrastructure/comments.repository';
import { Comment } from './comments/domain/comment.entity';
import { GetOneCommentQuery } from './comments/infrastructure/queries/get-one-comment.query';
import { UsersQueryRepository } from '../users/infrastructure/users-query-repository';
import { GetCommentsForPostQuery } from './comments/infrastructure/queries/get-comments-for-post.query';
import { LikeService } from './likes/application/like.service';
import { LikeRepository } from './likes/repository/like.repository';
import { BloggerController } from './blogs/api/blogger-controller';
import { BloggerService } from './blogs/application/blogger-service';
import { GetBlogsForUserQuery } from './blogs/infrastructure/queries/get-blogs-for-user-query';
import { BlogBlacklist } from './blogs/domain/blog-blacklist-entity';
import { GetBlogsForAdminQuery } from './blogs/infrastructure/queries/get-blogs-for-admin-query';
import { S3StorageModule } from '../files/s3-storage.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Blog, Post, Like, Comment, BlogBlacklist]),
        CqrsModule,
        S3StorageModule,
    ],
    controllers: [
        BlogsSaController,
        BlogsController,
        PostsController,
        CommentsController,
        BloggerController,
    ],
    providers: [
        BlogsService,
        PostsService,
        CommentsService,
        LikeService,
        BloggerService,
        BlogsRepository,
        PostsRepository,
        CommentsRepository,
        LikeRepository,
        BlogsQueryRepository,
        PostsQueryRepository,
        UsersQueryRepository,
        GetBlogsQuery,
        GetPostsForBlogQuery,
        GetPostsQuery,
        GetOnePostQuery,
        GetOneCommentQuery,
        GetCommentsForPostQuery,
        GetBlogsForUserQuery,
        GetBlogsForAdminQuery,
    ],
    exports: [
        BlogsService,
        PostsService,
        LikeService,
        BlogsQueryRepository,
        PostsQueryRepository,
    ],
})
export default class BlogsModule {}
