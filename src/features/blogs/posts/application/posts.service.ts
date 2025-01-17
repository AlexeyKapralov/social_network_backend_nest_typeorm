import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/posts.repository';
import { PostsQueryRepository } from '../infrastructure/posts-query.repository';
import { PostsViewDto } from '../api/dto/output/extended-likes-info-view.dto';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogs-query-repository';
import { QueryBus } from '@nestjs/cqrs';
import {
    GetOnePostPayload,
    GetOnePostResultType,
} from '../infrastructure/queries/get-one-post.query';
import { LikeInputDto } from '../../likes/api/dto/input/like-input.dto';
import { LikeService } from '../../likes/application/like.service';
import { UsersQueryRepository } from '../../../users/infrastructure/users-query-repository';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';

@Injectable()
export class PostsService {
    constructor(
        private readonly likesService: LikeService,
        private readonly postsRepository: PostsRepository,
        private readonly blogsQueryRepository: BlogsQueryRepository,
        private readonly postQueryRepository: PostsQueryRepository,
        private readonly usersQueryRepository: UsersQueryRepository,
        private readonly queryBus: QueryBus,
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

    async findOnePost(postId: string, userId?: string): Promise<PostsViewDto> {
        const queryPayload = new GetOnePostPayload(postId, userId);
        const post = await this.queryBus.execute<
            GetOnePostPayload,
            GetOnePostResultType
        >(queryPayload);
        if (!post) {
            throw new NotFoundException();
        }
        return post;
    }
    async updateLikeStatus(
        postId: string,
        userId: string,
        likeInputDto: LikeInputDto,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const post = await this.postsRepository.findPost(postId);
        if (!post) {
            notice.addError('post was not found');
            return notice;
        }
        const user = await this.usersQueryRepository.findUserById(userId);
        if (!user) {
            notice.addError('user was not found');
            return notice;
        }

        const oldLikeStatusInterlayer = await this.likesService.findLikeStatus(
            userId,
            postId,
            'post',
        );
        if (oldLikeStatusInterlayer.hasError()) {
            notice.addError('like was not found');
            return notice;
        }
        const isLikeStatusUpdate = await this.likesService.changeLikeStatus(
            userId,
            postId,
            likeInputDto.likeStatus,
            'post',
        );
        if (isLikeStatusUpdate.hasError()) {
            notice.addError('like status was not updated');
            return notice;
        }

        const oldLikeStatus = oldLikeStatusInterlayer.data;
        const newLikeStatus = likeInputDto.likeStatus;

        let likesCount = 0;
        let dislikesCount = 0;
        switch (true) {
            case likeInputDto.likeStatus === LikeStatus.Like &&
                oldLikeStatus === LikeStatus.Dislike:
                likesCount = 1;
                dislikesCount = -1;
                break;
            case newLikeStatus === LikeStatus.Like &&
                oldLikeStatus === LikeStatus.None:
                likesCount = 1;
                // post.addCountDislikes(0)
                break;
            case newLikeStatus === LikeStatus.Dislike &&
                oldLikeStatus === LikeStatus.Like:
                likesCount = -1;
                dislikesCount = 1;
                break;
            case newLikeStatus === LikeStatus.Dislike &&
                oldLikeStatus === LikeStatus.None:
                dislikesCount = 1;
                break;
            case newLikeStatus === LikeStatus.None &&
                oldLikeStatus === LikeStatus.Like:
                likesCount = -1;
                break;
            case newLikeStatus === LikeStatus.None &&
                oldLikeStatus === LikeStatus.Dislike:
                dislikesCount = -1;
                break;
            default:
                break;
        }

        const isLikesCountChanged =
            await this.postsRepository.changeLikesAndDislikesCount(
                postId,
                likesCount,
                dislikesCount,
            );
        if (!isLikesCountChanged) {
            notice.addError('likes and dislikes count were not changed');
            return notice;
        }
        return notice;
    }
}
