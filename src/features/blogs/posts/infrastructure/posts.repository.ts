import { Injectable } from '@nestjs/common';
import { Post } from '../domain/posts.entity';
import { PostInputDto } from '../api/dto/input/post-input.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BlogPostInputDto } from '../../blogs/api/dto/input/blog-post-input.dto';
import { Blog } from '../../blogs/domain/blog-entity';

@Injectable()
export class PostsRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        @InjectRepository(Post) private postRepo: Repository<Post>,
    ) {}

    // async checkIsPostBelongBlog(
    //     blogId: string,
    //     postId: string,
    // ): Promise<boolean> {
    //     const post = await this.findPost(postId);
    //     if (!post) {
    //         return false;
    //     }
    //     return post.blogId === blogId;
    // }
    //
    // async findPost(postId: string): Promise<PostDocumentSql> {
    //     try {
    //         const post = await this.dataSource.query(
    //             `
    //             SELECT
    //                 p.title,
    //                 p."shortDescription",
    //                 p.content,
    //                 p."blogId",
    //                 b."name" AS "blogName",
    //                 p."createdAt",
    //                 p."likesCount",
    //                 p."dislikesCount",
    //                 p."isDeleted"
    //             FROM public.posts p
    //             LEFT JOIN public.blogs b ON b.id = p."blogId"
    //             WHERE
    //                 p."isDeleted" = False AND p.id = $1
    //         `,
    //             [postId],
    //         );
    //         return post[0];
    //     } catch (e) {
    //         console.log('post repo.find post error: ', e);
    //         return null;
    //     }
    // }

    async createPost(
        blogPostInputDto: BlogPostInputDto,
        blog: Blog,
    ): Promise<Post> {
        return await Post.createPost(blogPostInputDto, blog);
    }

    // async updatePost(postId: string, postUpdateData: PostInputDto) {
    //     try {
    //         const isUpdate = await this.dataSource.query(
    //             `
    //             UPDATE public.posts
    //             SET
    //                 "title" = $2,
    //                 "shortDescription" = $3,
    //                 "content" = $4,
    //                 "blogId" = $5
    //             WHERE "id" = $1 AND "isDeleted" = False;
    //         `,
    //             [
    //                 postId,
    //                 postUpdateData.title,
    //                 postUpdateData.shortDescription,
    //                 postUpdateData.content,
    //                 postUpdateData.blogId,
    //             ],
    //         );
    //         return isUpdate[1] === 1;
    //     } catch (e) {
    //         console.log('post repo.updatePost error: ', e);
    //         return null;
    //     }
    // }

    // async updatePostForBlog(postId: string, postUpdateData: BlogPostInputDto) {
    //     try {
    //         const isUpdatePostForBlog = await this.dataSource.query(
    //             `
    //             UPDATE public.posts
    //             SET
    //                 "title" = $2,
    //                 "shortDescription" = $3,
    //                 "content" = $4
    //             WHERE "id" = $1 AND "isDeleted" = False;
    //         `,
    //             [
    //                 postId,
    //                 postUpdateData.title,
    //                 postUpdateData.shortDescription,
    //                 postUpdateData.content,
    //             ],
    //         );
    //         return isUpdatePostForBlog[1] === 1;
    //     } catch (e) {
    //         console.log('post repo.updatePostForBlog error: ', e);
    //         return null;
    //     }
    // }
    //
    // async deletePost(postId: string) {
    //     try {
    //         const isDeletePost = await this.dataSource.query(
    //             `
    //             UPDATE public.posts
    //             SET "isDeleted" = True
    //             WHERE "id" = $1 AND "isDeleted" = False;
    //         `,
    //             [postId],
    //         );
    //         return isDeletePost[1] === 1;
    //     } catch (e) {
    //         console.log('post repo.deletePost error: ', e);
    //         return null;
    //     }
    // }
    //
    // async changeLikesAndDislikesCount(
    //     postId: string,
    //     oldLikeStatus: LikeStatus,
    //     newLikeStatus: LikeStatus,
    // ) {
    //     const post = await this.findPost(postId);
    //
    //     let likesAction = 0;
    //     let dislikesAction = 0;
    //     switch (true) {
    //         case newLikeStatus === LikeStatus.Like &&
    //             oldLikeStatus === LikeStatus.Dislike:
    //             likesAction = 1;
    //             dislikesAction = -1;
    //             break;
    //         case newLikeStatus === LikeStatus.Like &&
    //             oldLikeStatus === LikeStatus.None:
    //             likesAction = 1;
    //             // post.addCountDislikes(0)
    //             break;
    //         case newLikeStatus === LikeStatus.Dislike &&
    //             oldLikeStatus === LikeStatus.Like:
    //             likesAction = -1;
    //             dislikesAction = 1;
    //             break;
    //         case newLikeStatus === LikeStatus.Dislike &&
    //             oldLikeStatus === LikeStatus.None:
    //             dislikesAction = 1;
    //             break;
    //         case newLikeStatus === LikeStatus.None &&
    //             oldLikeStatus === LikeStatus.Like:
    //             likesAction = -1;
    //             break;
    //         case newLikeStatus === LikeStatus.None &&
    //             oldLikeStatus === LikeStatus.Dislike:
    //             dislikesAction = -1;
    //             break;
    //         default:
    //             break;
    //     }
    //
    //     try {
    //         const isChangeCountLikesAndDislikesForPost =
    //             await this.dataSource.query(
    //                 `
    //             UPDATE public.posts
    //             SET "likesCount" = CAST("likesCount" AS INT) + $2, "dislikesCount" = CAST("dislikesCount" AS INT) + $3
    //             WHERE "id" = $1 AND "isDeleted" = False;
    //         `,
    //                 [postId, likesAction, dislikesAction],
    //             );
    //         return isChangeCountLikesAndDislikesForPost[1] === 1;
    //     } catch (e) {
    //         console.log(
    //             'post repo.ChangeCountLikesAndDislikesCount error: ',
    //             e,
    //         );
    //         return null;
    //     }
    // }
}
