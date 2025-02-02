import { Injectable } from '@nestjs/common';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';
import { BlogViewDto } from '../api/dto/output/blog-view-dto';
import { BlogsRepository } from '../infrastructure/blogs-repository';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';
import { BlogPostInputDto } from '../api/dto/input/blog-post-input.dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { PostsViewDto } from '../../posts/api/dto/output/extended-likes-info-view.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { blogViewDtoMapper } from '../../../../base/mappers/blog-view-mapper';
import { S3StorageAdapter } from '../../../files/files-storage-adapter.service';

@Injectable()
export class BloggerService {
    constructor(
        private readonly blogsRepository: BlogsRepository,
        private readonly postsRepository: PostsRepository,
        private readonly s3StorageAdapter: S3StorageAdapter,
    ) {}

    async createBlog(
        blogInputDto: BlogInputDto,
        userId: string,
    ): Promise<InterlayerNotice<BlogViewDto>> {
        const notice = new InterlayerNotice<BlogViewDto>();
        const blog = await this.blogsRepository.createBlog(
            blogInputDto,
            userId,
        );
        if (!blog) {
            notice.addError('blog is not created');
            return notice;
        }
        notice.addData(blogViewDtoMapper(blog));
        return notice;
    }

    async updateBlog(
        blogId: string,
        blogInputDto: BlogInputDto,
        userId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog is not exist',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user?.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

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

    async deleteBlog(
        blogId: string,
        userId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog is not exist',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

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
        userId: string,
    ): Promise<InterlayerNotice<PostsViewDto | null>> {
        const notice = new InterlayerNotice<PostsViewDto | null>();

        const foundBlog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!foundBlog) {
            notice.addError(
                '',
                'blog was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        console.log('foundBlog', foundBlog);
        if (foundBlog.user?.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
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
        userId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const post = await this.postsRepository.findPost(postId);

        if (!post) {
            notice.addError(
                '',
                'post was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

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
            notice.addError(
                '',
                'post was not updated',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }
        return notice;
    }

    async deletePostForBlog(
        blogId: string,
        postId: string,
        userId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const post = await this.postsRepository.findPost(postId);
        if (!post) {
            notice.addError(
                '',
                'post was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

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

    async uploadWallpaperForBlog(
        blogId: string,
        userId: string,
        file: Express.Multer.File,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        console.log('blog', blog);
        if (!blog) {
            notice.addError(
                '',
                'blog was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isUploadPhotoForBlog = await this.s3StorageAdapter.saveImage(
            userId,
            file.originalname,
            file.mimetype,
            file.buffer,
            'wallpapers',
        );
        if (!isUploadPhotoForBlog) {
            notice.addError('wallpaper was not uploaded');
            return notice;
        }
        return notice;
    }
}
