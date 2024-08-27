import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandBus, CqrsModule } from '@nestjs/cqrs';
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

@Module({
    imports: [TypeOrmModule.forFeature([Blog, Post, Like]), CqrsModule],
    controllers: [BlogsSaController, BlogsController, PostsController],
    providers: [
        BlogsService,
        PostsService,
        BlogsRepository,
        PostsRepository,
        BlogsQueryRepository,
        PostsQueryRepository,
        GetBlogsQuery,
        GetPostsForBlogQuery,
        GetPostsQuery,
        GetOnePostQuery,
    ],
    exports: [BlogsService, BlogsQueryRepository],
})
export default class BlogsModule {}
