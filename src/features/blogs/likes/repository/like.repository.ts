// import { Injectable } from '@nestjs/common';
// import { LikeDocument, LikeDocumentSql } from '../domain/likes.entity';
// import { LikeStatus } from '../api/dto/output/likes-view.dto';
// import { InjectDataSource } from '@nestjs/typeorm';
// import { DataSource } from 'typeorm';
//
// @Injectable()
// export class LikeRepository {
//     constructor(
//         @InjectDataSource() private dataSource: DataSource
//     ) {}
//     async createLike(userId: string, parentId: string, likeStatus: LikeStatus = LikeStatus.None): Promise<LikeDocumentSql> {
//
//         try {
//             const user = await this.dataSource.query(`
//             INSERT INTO public.likes(
//                 "userId", "parentId", "likeStatus"
//             )
//             VALUES ($1, $2, $3)
//             RETURNING id, "userId", "parentId", "createdAt", "likeStatus"
//         `,
//                 [userId, parentId, likeStatus],
//             );
//             return user[0];
//         } catch {
//             return null;
//         }
//     }
//
//     async changeLikeStatus(userId: string, parentId: string, likeStatus: LikeStatus): Promise<LikeDocument> {
//         let like = await this.findLikeByUserAndParent(userId, parentId)
//
//         if (!like) {
//             return null
//         }
//
//         try {
//             const like = await this.dataSource.query(`
//                 UPDATE public.likes
//                 SET "likeStatus" = $1
//                 WHERE "userId" = $2 AND "parentId" = $3
//             `, [likeStatus, userId, parentId],
//             );
//             //ответ будет в форме [ [data], [updated count ] ]
//             return like[0]
//         } catch (e) {
//             console.log('comment repo/delete comment error: ', e);
//             return null
//         }
//     }
//
//     /*
//     * найти комментарий по userId и по ParentId ( PostId или CommentId)
//     * */
//     async findLikeByUserAndParent(userId: string, parentId: string): Promise<LikeDocumentSql> {
//         try {
//             const like = await this.dataSource.query(`
//                 SELECT
//                     id, "userId", "parentId", "createdAt", "likeStatus"
//                 FROM public.likes
//                 WHERE "userId" = $1 AND "parentId" = $2
//             `,
//                 [userId, parentId],
//             );
//             return like[0]
//         } catch (e) {
//             console.log('like repo - findLikeByUserAndParent error: ', e);
//             return null
//         }
//     }
// }
