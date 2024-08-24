import { Injectable } from '@nestjs/common';
import { PostInputDto } from '../api/dto/input/post-input.dto';
import { PostsRepository } from '../infrastructure/posts.repository';
import { PostsQueryRepository } from '../infrastructure/posts-query.repository';
import { PostsViewDto } from '../api/dto/output/extended-likes-info-view.dto';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogs-query-repository';

@Injectable()
export class PostsService {
    constructor(
        private readonly postsRepository: PostsRepository,
        private readonly blogsQueryRepository: BlogsQueryRepository,
        private readonly postQueryRepository: PostsQueryRepository,
    ) {}

    // async createPost(
    //     postInputData: PostInputDto,
    // ): Promise<InterlayerNotice<PostsViewDto>> {
    //     const notice = new InterlayerNotice<PostsViewDto>();
    //
    //     const foundBlog = await this.blogsQueryRepository.findBlog(
    //         postInputData.blogId,
    //     );
    //     if (!foundBlog) {
    //         notice.addError('blog is not found');
    //         return notice;
    //     }
    //     const createdPost = await this.postsRepository.createPost(
    //         postInputData.title,
    //         postInputData.shortDescription,
    //         postInputData.content,
    //         postInputData.blogId,
    //         foundBlog.name,
    //     );
    //
    //     const mappedPost = await this.postQueryRepository.findPost(
    //         createdPost.id,
    //     );
    //     notice.addData(mappedPost);
    //     return notice;
    // }

    // async updatePost(postId: string, updateData: PostInputDto) {
    //     return await this.postsRepository.updatePost(postId, updateData);
    // }
    // async deletePost(postId: string) {
    //     return await this.postsRepository.deletePost(postId);
    // }
}
