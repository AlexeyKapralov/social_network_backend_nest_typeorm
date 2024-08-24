import { Injectable } from '@nestjs/common';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';
import { BlogViewDto } from '../api/dto/output/blog-view-dto';
import { BlogsRepository } from '../infrastructure/blogs-repository';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { blogViewDtoMapper } from '../../../../base/mappers/blog-view-mapper';
import { BlogPostInputDto } from '../api/dto/input/blog-post-input.dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { PostsQueryRepository } from '../../posts/infrastructure/posts-query.repository';
import { Post } from '../../posts/domain/posts.entity';
import { PostsViewDto } from '../../posts/api/dto/output/extended-likes-info-view.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';

@Injectable()
export class BlogsService {
    constructor(
        private blogsRepository: BlogsRepository,
        private postsRepository: PostsRepository,
        private postsQueryRepository: PostsQueryRepository,
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
        // const notice = new InterlayerNotice<PostsViewDto | null>();
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
}
