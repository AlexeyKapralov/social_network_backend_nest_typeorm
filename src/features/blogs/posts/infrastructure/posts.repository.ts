import { Injectable } from '@nestjs/common';
import { Post } from '../domain/posts.entity';
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

    async checkIsPostBelongBlog(
        blogId: string,
        postId: string,
    ): Promise<boolean> {
        const post = await this.findPost(postId);
        if (!post) {
            return false;
        }
        return post.blog.id === blogId;
    }

    async findPost(postId: string): Promise<Post> {
        return await this.postRepo.findOne({
            where: {
                id: postId,
            },
            relations: {
                blog: true,
            },
        });
    }

    async createPost(
        blogPostInputDto: BlogPostInputDto,
        blog: Blog,
    ): Promise<Post> {
        return await Post.createPost(blogPostInputDto, blog);
    }

    async updatePost(
        postId: string,
        blogPostInputDto: BlogPostInputDto,
    ): Promise<boolean> {
        const isUpdatePost = await this.postRepo.update(
            {
                id: postId,
            },
            {
                title: blogPostInputDto.title,
                content: blogPostInputDto.content,
                shortDescription: blogPostInputDto.shortDescription,
            },
        );
        return isUpdatePost.affected === 1;
    }

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
    async deletePost(postId: string) {
        const post = await this.findPost(postId);
        if (!post) {
            return false;
        }
        await post.softRemove();
        return true;
    }

    async changeLikesAndDislikesCount(
        postId: string,
        likesCount: number,
        dislikesCount: number,
    ): Promise<boolean> {
        const post = await this.findPost(postId);

        try {
            post.addCountLikes(likesCount);
            post.addCountDislikes(dislikesCount);
            await this.postRepo.save(post);
        } catch (e) {
            console.log('post dislikes and likes were not updated: ' + e);
            return false;
        }
        return true;
    }
}
