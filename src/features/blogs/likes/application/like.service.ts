// import { Injectable } from '@nestjs/common';
// import { LikeStatus } from '../api/dto/output/likes-view.dto';
// import { PostsRepository } from '../../posts/infrastructure/posts.repository';
// import { InterlayerNotice } from '../../../../base/models/interlayer';
//
// @Injectable()
// export class LikeService {
//     constructor(
//         private readonly likeRepository: LikeRepository,
//         private readonly postRepository: PostsRepository,
//     ) {}
//     async changeLikeStatus(
//         userId: string,
//         postId: string,
//         likeStatus: LikeStatus,
//     ): Promise<InterlayerNotice> {
//         const notice = new InterlayerNotice();
//
//         let post;
//         try {
//             post = await this.postRepository.findPost(postId);
//         } catch {}
//
//         if (!post) {
//             notice.addError('post did not found');
//             return notice;
//         }
//
//         const existedLike: LikeDocumentSql =
//             await this.likeRepository.findLikeByUserAndParent(userId, postId);
//         let like: LikeDocumentSql = existedLike;
//         if (!existedLike) {
//             like = await this.likeRepository.createLike(userId, postId);
//             if (!like) {
//                 notice.addError('like did not created');
//                 return notice;
//             }
//         }
//
//         const isChangedLikeStatus = await Promise.all([
//             await this.likeRepository.changeLikeStatus(
//                 userId,
//                 postId,
//                 likeStatus,
//             ),
//             await this.postRepository.changeLikesAndDislikesCount(
//                 postId,
//                 like.likeStatus,
//                 likeStatus,
//             ),
//         ]);
//
//         isChangedLikeStatus.forEach((i) => {
//             if (!i) {
//                 notice.addError('like did not changed');
//                 return notice;
//             }
//         });
//
//         return notice;
//     }
// }
