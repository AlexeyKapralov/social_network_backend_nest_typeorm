import { Injectable } from '@nestjs/common';
import { LikeStatus } from '../api/dto/output/likes-view.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Like } from '../domain/likes.entity';

@Injectable()
export class LikeRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        @InjectRepository(Like) private likeRepo: Repository<Like>,
    ) {}
    async createLikeForPost(
        userId: string,
        postId: string,
        likeStatus: LikeStatus = LikeStatus.None,
    ): Promise<Like> {
        const createLikeResult = await this.dataSource
            .createQueryBuilder()
            .insert()
            .into(Like)
            .values({
                likeStatus: likeStatus,
                createdAt: new Date(),
                user: {
                    id: userId,
                },
                post: {
                    id: postId,
                },
            })
            .returning('id')
            .execute();

        const likeId = createLikeResult.raw[0].id;

        return await this.dataSource
            .getRepository(Like)
            .findOne({ where: { id: likeId } });
    }

    async createLikeForComment(
        userId: string,
        commentId: string,
        likeStatus: LikeStatus = LikeStatus.None,
    ): Promise<Like> {
        const createLikeResult = await this.dataSource
            .createQueryBuilder()
            .insert()
            .into(Like)
            .values({
                likeStatus: likeStatus,
                createdAt: new Date(),
                user: {
                    id: userId,
                },
                comment: {
                    id: commentId,
                },
            })
            .returning('id')
            .execute();

        const likeId = createLikeResult.raw[0].id;

        return await this.dataSource
            .getRepository(Like)
            .findOne({ where: { id: likeId } });
    }

    /*
     * если лайка нет, создаст
     * меняет и для комментария и для поста
     * */
    async changeLikeStatus(
        userId: string,
        parentId: string,
        likeStatus: LikeStatus,
    ): Promise<boolean> {
        let likeComment = await this.findLikeByUserAndParent(
            userId,
            parentId,
            'comment',
        );
        let likePost = await this.findLikeByUserAndParent(
            userId,
            parentId,
            'post',
        );

        if (!likeComment && !likePost) {
            return false;
        }
        const like = likeComment || likePost;
        like.likeStatus = likeStatus;

        try {
            await this.likeRepo.save(like);
            return true;
        } catch (e) {
            console.log('like was not updated: ', e);
            throw new Error('like was not updated');
        }
    }

    /*
     * найти лайк для комментария или для поста
     * */
    async findLikeByUserAndParent(
        userId: string,
        parentId: string,
        type: 'post' | 'comment',
    ): Promise<Like> {
        let likeComment;
        likeComment = await this.dataSource
            .getRepository(Like)
            .createQueryBuilder('l')
            .where('l."commentId" = :commentId', { commentId: parentId })
            .andWhere('l."userId" = :userId', { userId: userId })
            .getOne();

        let likePost;
        likePost = await this.dataSource
            .getRepository(Like)
            .createQueryBuilder('l')
            .where('l."parentId" = :parentId', { parentId: parentId })
            .andWhere('l."userId" = :userId', { userId: userId })
            .getOne();

        if (!likePost && !likeComment) {
            type === 'post'
                ? (likePost = await this.createLikeForPost(userId, parentId))
                : (likeComment = await this.createLikeForComment(
                      userId,
                      parentId,
                  ));
        }
        return likePost || likeComment;
    }
}
