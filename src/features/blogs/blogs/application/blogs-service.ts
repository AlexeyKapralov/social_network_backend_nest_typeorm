import { Injectable } from '@nestjs/common';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';
import { BlogViewDto } from '../api/dto/output/blog-view-dto';
import { BlogsRepository } from '../infrastructure/blogs-repository';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';
import { blogViewDtoMapper } from '../../../../base/mappers/blog-view-mapper';
import { BlogPostInputDto } from '../api/dto/input/blog-post-input.dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { PostsViewDto } from '../../posts/api/dto/output/extended-likes-info-view.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { UsersQueryRepository } from '../../../users/infrastructure/users-query-repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BlogBlacklist } from '../domain/blog-blacklist-entity';

@Injectable()
export class BlogsService {
    constructor(
        private readonly blogsRepository: BlogsRepository,
        private readonly postsRepository: PostsRepository,
        private readonly usersQueryRepository: UsersQueryRepository,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

    async createBlog(
        blogInputDto: BlogInputDto,
    ): Promise<InterlayerNotice<BlogViewDto>> {
        const notice = new InterlayerNotice<BlogViewDto>();
        const blog = await this.blogsRepository.createBlog(blogInputDto);
        if (!blog) {
            notice.addError('blog is bot created');
            return notice;
        }
        notice.addData(blogViewDtoMapper(blog));
        return notice;
    }

    async updateBlog(
        blogId: string,
        blogInputDto: BlogInputDto,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const isUpdatedBlog = await this.blogsRepository.updateBlog(
            blogId,
            blogInputDto,
        );
        if (!isUpdatedBlog) {
            notice.addError('blog was not updated');
            return notice;
        }
        return notice;
    }

    async deleteBlog(blogId: string): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const isDeletedBlog = await this.blogsRepository.deleteBlog(blogId);
        if (!isDeletedBlog) {
            notice.addError('blog was not deleted');
            return notice;
        }
        return notice;
    }

    async createPostForBlog(
        blogId: string,
        blogPostInputDto: BlogPostInputDto,
    ): Promise<InterlayerNotice<PostsViewDto | null>> {
        const notice = new InterlayerNotice<PostsViewDto | null>();

        const foundBlog = await this.blogsRepository.findBlog(blogId);
        if (!foundBlog) {
            notice.addError('blog was not found');
            return notice;
        }

        const createdPost = await this.postsRepository.createPost(
            blogPostInputDto,
            foundBlog,
        );

        const mappedCreatedPost: PostsViewDto = {
            id: createdPost.id,
            title: createdPost.title,
            content: createdPost.content,
            shortDescription: createdPost.shortDescription,
            blogId: createdPost.blog.id,
            blogName: createdPost.blog.name,
            createdAt: createdPost.createdAt,
            extendedLikesInfo: {
                likesCount: createdPost.likesCount,
                dislikesCount: createdPost.dislikesCount,
                myStatus: LikeStatus.None,
                newestLikes: [],
            },
        };

        notice.addData(mappedCreatedPost);
        return notice;
    }

    async updatePostForBlog(
        blogId: string,
        blogPostInputDto: BlogPostInputDto,
        postId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const isPostBelongBlog =
            await this.postsRepository.checkIsPostBelongBlog(blogId, postId);
        if (!isPostBelongBlog) {
            notice.addError(
                'post is not belong blog',
                'post',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isUpdatedPost = await this.postsRepository.updatePost(
            postId,
            blogPostInputDto,
        );
        if (!isUpdatedPost) {
            notice.addError('post was not updated');
            return notice;
        }
        return notice;
    }

    async deletePostForBlog(
        blogId: string,
        postId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const isPostBelongBlog =
            await this.postsRepository.checkIsPostBelongBlog(blogId, postId);
        if (!isPostBelongBlog) {
            notice.addError(
                'post is not belong blog',
                'post',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isDeletedPost = await this.postsRepository.deletePost(postId);
        if (!isDeletedPost) {
            notice.addError('post was not deleted');
            return notice;
        }
        return notice;
    }

    async bindBlogWithUser(
        blogId: string,
        userId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();
        const blog = await this.blogsRepository.findBlogWithUser(blogId);
        if (!blog) {
            notice.addError('blog was not found');
        }
        if (blog.user?.id) {
            notice.addError('blog already bind with user');
        }
        const user = await this.usersQueryRepository.findUserById(userId);
        if (!user) {
            notice.addError('user was not found');
        }
        if (notice.hasError()) {
            return notice;
        }
        const result = await this.blogsRepository.bindBlogWithUser(
            blogId,
            userId,
        );
        if (!result) {
            notice.addError('blog was not bind with user');
        }

        return notice;
    }

    async banBlog(
        blogId: string,
        isBanned: boolean,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();
        const blogBlacklistRepository =
            this.dataSource.getRepository(BlogBlacklist);

        let bannedBlog: BlogBlacklist;
        if (isBanned) {
            const blog = await this.blogsRepository.findBlog(blogId);
            if (!blog) {
                notice.addError(
                    'blog is not found',
                    'blogId',
                    InterlayerStatuses.NOT_FOUND,
                );
                return notice;
            }
            bannedBlog = await blogBlacklistRepository.findOne({
                where: {
                    blogId: blogId,
                    userId: null,
                },
            });
            if (bannedBlog) {
                return notice;
            }

            const newBlogBlacklist = new BlogBlacklist();
            newBlogBlacklist.banReason = 'admin decision';
            newBlogBlacklist.banDate = new Date();
            newBlogBlacklist.blogId = blogId;

            try {
                await blogBlacklistRepository.insert(newBlogBlacklist);
                return notice;
            } catch (error) {
                notice.addError('block was not added in blacklist');
                return notice;
            }
        } else {
            const blog = await this.blogsRepository.findBlog(blogId);
            if (!blog) {
                notice.addError(
                    'blog is not found',
                    '',
                    InterlayerStatuses.NOT_FOUND,
                );
                return notice;
            }
            bannedBlog = await blogBlacklistRepository.findOne({
                where: {
                    blogId: blogId,
                    userId: null,
                },
            });
            if (!bannedBlog) {
                return notice;
            }

            try {
                await blogBlacklistRepository.delete({
                    id: bannedBlog.id,
                });
                return notice;
            } catch (error) {
                notice.addError('block was not delete from blacklist');
                return notice;
            }
        }
    }
}
