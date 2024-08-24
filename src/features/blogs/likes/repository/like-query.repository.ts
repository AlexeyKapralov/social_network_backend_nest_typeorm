// import { Injectable } from '@nestjs/common';
// import { LikeDetailsViewDto } from '../api/dto/output/likes-view.dto';
// import { InjectDataSource } from '@nestjs/typeorm';
// import { DataSource } from 'typeorm';
//
// @Injectable()
// export class LikeQueryRepository {
//     constructor(
//         @InjectDataSource() private dataSource: DataSource
//     ) {}
//
//     async getNewestLikes(parentId: string, limit: number): Promise<LikeDetailsViewDto[]> {
//         try {
//             return await this.dataSource.query(
//                 `
//                 SELECT
//                     "createdAt" AS "addedAt",
//                     "userId",
//                     u.login
//                 FROM public.likes l
//                 LEFT JOIN public.users u ON u.id = l."userId"
//                 WHERE l."parentId" = $1
//                 ORDER BY l."createdAt" DESC
//                 LIMIT $2
//             `,
//                 [parentId, limit],
//             )
//         } catch (e) {
//             console.log(' like query repository - get newest likes error: ',e)
//             return null
//         }
//     }
// }
