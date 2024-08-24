import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostsQueryRepository {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    // async findPosts(
    //     query: QueryDtoBase,
    //     userId: string = '00000000-0000-0000-0000-000000000000',
    // ) {
    //     if (!userId) {
    //         userId = '00000000-0000-0000-0000-000000000000';
    //     }
    //     let countPosts = 0;
    //     try {
    //         countPosts = await this.dataSource.query(
    //             `
    //             SELECT COUNT(*)
    //             FROM public.posts
    //             WHERE "isDeleted" = False
    //         `,
    //             [],
    //         );
    //         countPosts = Number(countPosts[0].count);
    //     } catch {
    //         console.log('postsQueryRepo.findPosts error: ', e);
    //         return null;
    //     }
    //
    //     const allowedSortFields = [
    //         'id',
    //         'title',
    //         'shortDescription',
    //         'content',
    //         'createdAt',
    //         'likesCount',
    //         'dislikesCount',
    //         'blogId',
    //         'blogName',
    //     ];
    //     let sortBy = `"${query.sortBy}"`;
    //     if (sortBy !== '"createdAt"') {
    //         sortBy = allowedSortFields.includes(query.sortBy)
    //             ? `"${query.sortBy}" COLLATE "C" `
    //             : `"createdAt"`;
    //     }
    //     if (query.sortBy === 'blogName') {
    //         sortBy = `b."name" COLLATE "C" `;
    //     }
    //
    //     let sortDirection = SortDirection.DESC;
    //     switch (query.sortDirection) {
    //         case 1:
    //             sortDirection = SortDirection.ASC;
    //             break;
    //         case -1:
    //             sortDirection = SortDirection.DESC;
    //             break;
    //     }
    //
    //     //запрос для постов с лайками
    //     let postsSourceWithNewestLikes: PostWithLikesType[] = [];
    //     try {
    //         postsSourceWithNewestLikes = await this.dataSource.query(
    //             `
    //             SELECT
    //                 p.id,
    //                 p.title,
    //                 p."shortDescription",
    //                 p.content,
    //                 p."blogId",
    //                 b."name" AS "blogName",
    //                 p."createdAt",
    //                 p."likesCount",
    //                 p."dislikesCount",
    //                 CASE
    //                     WHEN l."likeStatus" IS NULL THEN $1
    //                     ElSE l."likeStatus"
    //                 END AS "myStatus",
    //                 nl."addedAt",
    //                 nl."userId",
    //                 nl.login
    //             FROM posts p
    //             LEFT JOIN public.blogs b ON p."blogId" = b.id
    //             LEFT JOIN (
    //                 SELECT *
    //                 FROM public.likes
    //                 WHERE likes."userId"= $2
    //             ) l ON l."parentId" = p."id"
    //             LEFT JOIN (
    //                 SELECT
    //                     l."createdAt" AS "addedAt",
    //                     l."likeStatus" AS "description",
    //                     l."userId",
    //                     u.login,
    //                     l."parentId"
    //                 FROM public.likes l
    //                 LEFT JOIN public.users u ON u.id = l."userId"
    //                 WHERE l."likeStatus" = $3
    //                 ORDER BY l."createdAt" DESC
    //             ) AS nl ON nl."parentId" = p.id
    //             ORDER BY ${sortBy} ${sortDirection}, nl."addedAt" DESC
    //             `,
    //             [LikeStatus.None, userId, LikeStatus.Like],
    //         );
    //     } catch (e) {
    //         console.log('postsQueryRepo.findPosts error:', e);
    //         return null;
    //     }
    //     //маппинг
    //     const limit = query.pageSize;
    //     const offset = (query.pageNumber - 1) * query.pageSize;
    //     const uniquePostsSet = new Set();
    //     postsSourceWithNewestLikes.forEach((el) => {
    //         uniquePostsSet.add(el.id);
    //     });
    //     const uniquePosts = Array.from(uniquePostsSet).slice(
    //         offset,
    //         offset + limit,
    //     );
    //
    //     const posts: PostsViewDto[] = [];
    //     uniquePosts.forEach((postId) => {
    //         let likes = [];
    //
    //         const postSource: PostWithLikesType[] =
    //             postsSourceWithNewestLikes.filter((p) => p.id === postId);
    //
    //         postSource.map((p: PostWithLikesType) => {
    //             if (
    //                 p.login !== null &&
    //                 p.userId !== null &&
    //                 p.addedAt !== null
    //             ) {
    //                 if (likes.length < 3) {
    //                     likes.push({
    //                         addedAt: p.addedAt,
    //                         userId: p.userId,
    //                         login: p.login,
    //                     });
    //                 }
    //             }
    //         });
    //
    //         const fullPost: PostsViewDto = {
    //             id: postSource[0].id,
    //             blogId: postSource[0].blogId,
    //             blogName: postSource[0].blogName,
    //             content: postSource[0].content,
    //             createdAt: postSource[0].createdAt,
    //             title: postSource[0].title,
    //             shortDescription: postSource[0].shortDescription,
    //             extendedLikesInfo: {
    //                 myStatus: postSource[0].myStatus as LikeStatus,
    //                 likesCount: postSource[0].likesCount,
    //                 dislikesCount: postSource[0].dislikesCount,
    //                 newestLikes: likes,
    //             },
    //         };
    //         posts.push(fullPost);
    //     });
    //
    //     const postsWithPaginate: Paginator<PostsViewDto> = {
    //         pagesCount: Math.ceil(countPosts / query.pageSize),
    //         page: query.pageNumber,
    //         pageSize: query.pageSize,
    //         totalCount: countPosts,
    //         items: posts,
    //     };
    //
    //     return postsWithPaginate;
    // }

    // async findPostsForBlog(
    //     query: QueryDtoBase,
    //     blogId: string,
    //     userId: string = '00000000-0000-0000-0000-000000000000',
    // ) {
    //     if (!userId) {
    //         userId = '00000000-0000-0000-0000-000000000000';
    //     }
    //     let countPosts = 0;
    //     try {
    //         countPosts = await this.dataSource.query(
    //             `
    //             SELECT COUNT(*)
    //             FROM public.posts
    //             WHERE "isDeleted" = False AND "blogId" = $1
    //         `,
    //             [blogId],
    //         );
    //         countPosts = Number(countPosts[0].count);
    //     } catch {
    //         console.log('postsQueryRepo.findPostsForBlog error: ', e);
    //         return null;
    //     }
    //
    //     const allowedSortFields = [
    //         'title',
    //         'shortDescription',
    //         'content',
    //         'createdAt',
    //         'likesCount',
    //         'dislikesCount',
    //         'blogName',
    //     ];
    //     let sortBy = `"${query.sortBy}"`;
    //     if (sortBy !== '"createdAt"') {
    //         sortBy = allowedSortFields.includes(query.sortBy)
    //             ? `"${query.sortBy}" COLLATE "C" `
    //             : `"createdAt"`;
    //     }
    //     if (query.sortBy === 'blogName') {
    //         sortBy = `b."name" COLLATE "C" `;
    //     }
    //
    //     let sortDirection = SortDirection.DESC;
    //     switch (query.sortDirection) {
    //         case 1:
    //             sortDirection = SortDirection.ASC;
    //             break;
    //         case -1:
    //             sortDirection = SortDirection.DESC;
    //             break;
    //     }
    //
    //     //запрос для постов с лайками
    //     let postsSourceWithNewestLikes: PostWithLikesType[] = [];
    //     try {
    //         postsSourceWithNewestLikes = await this.dataSource.query(
    //             `
    //             SELECT
    //                 p.id,
    //                 p.title,
    //                 p."shortDescription",
    //                 p.content,
    //                 p."blogId",
    //                 b."name" AS "blogName",
    //                 p."createdAt",
    //                 p."likesCount",
    //                 p."dislikesCount",
    //                 CASE
    //                     WHEN l."likeStatus" IS NULL THEN $1
    //                     ElSE l."likeStatus"
    //                 END AS "myStatus",
    //                 nl."addedAt",
    //                 nl."userId",
    //                 nl.login
    //             FROM posts p
    //             LEFT JOIN public.blogs b ON p."blogId" = b.id
    //             LEFT JOIN (
    //                 SELECT *
    //                 FROM public.likes
    //                 WHERE likes."userId"= $2
    //             ) l ON l."parentId" = p."id"
    //             LEFT JOIN (
    //                 SELECT
    //                     l."createdAt" AS "addedAt",
    //                     l."likeStatus" AS "description",
    //                     l."userId",
    //                     u.login,
    //                     l."parentId"
    //                 FROM public.likes l
    //                 LEFT JOIN public.users u ON u.id = l."userId"
    //                 WHERE l."likeStatus" = $3
    //                 ORDER BY l."createdAt" DESC
    //             ) AS nl ON nl."parentId" = p.id
    //             WHERE p."blogId" = $4 AND p."isDeleted" = False
    //             ORDER BY ${sortBy} ${sortDirection}, nl."addedAt" DESC
    //             `,
    //             [LikeStatus.None, userId, LikeStatus.Like, blogId],
    //         );
    //     } catch (e) {
    //         console.log('postsQueryRepo.findPostsForBlog error:', e);
    //         return null;
    //     }
    //     //маппинг
    //     const limit = query.pageSize;
    //     const offset = (query.pageNumber - 1) * query.pageSize;
    //     const uniquePostsSet = new Set();
    //     postsSourceWithNewestLikes.forEach((el) => {
    //         uniquePostsSet.add(el.id);
    //     });
    //     const uniquePosts = Array.from(uniquePostsSet).slice(
    //         offset,
    //         offset + limit,
    //     );
    //
    //     const posts: PostsViewDto[] = [];
    //     uniquePosts.forEach((postId) => {
    //         let likes = [];
    //         const postSource: PostWithLikesType[] =
    //             postsSourceWithNewestLikes.filter((p) => p.id === postId);
    //
    //         postSource.map((p: PostWithLikesType) => {
    //             if (
    //                 p.login !== null &&
    //                 p.userId !== null &&
    //                 p.addedAt !== null
    //             ) {
    //                 if (likes.length < 3) {
    //                     likes.push({
    //                         addedAt: p.addedAt,
    //                         userId: p.userId,
    //                         login: p.login,
    //                     });
    //                 }
    //             }
    //         });
    //
    //         const fullPost: PostsViewDto = {
    //             id: postSource[0].id,
    //             blogId: postSource[0].blogId,
    //             blogName: postSource[0].blogName,
    //             content: postSource[0].content,
    //             createdAt: postSource[0].createdAt,
    //             title: postSource[0].title,
    //             shortDescription: postSource[0].shortDescription,
    //             extendedLikesInfo: {
    //                 myStatus: postSource[0].myStatus as LikeStatus,
    //                 likesCount: postSource[0].likesCount,
    //                 dislikesCount: postSource[0].dislikesCount,
    //                 newestLikes: likes,
    //             },
    //         };
    //         posts.push(fullPost);
    //     });
    //
    //     const postsWithPaginate: Paginator<PostsViewDto> = {
    //         pagesCount: Math.ceil(countPosts / query.pageSize),
    //         page: query.pageNumber,
    //         pageSize: query.pageSize,
    //         totalCount: countPosts,
    //         items: posts,
    //     };
    //
    //     return postsWithPaginate;
    // }

    // async findPost(
    //     postId: string,
    //     userId: string = '00000000-0000-0000-0000-000000000000',
    // ): Promise<PostsViewDto> {
    //     if (!userId) {
    //         userId = '00000000-0000-0000-0000-000000000000';
    //     }
    //
    //     const allowedSortFields = [
    //         'title',
    //         'shortDescription',
    //         'content',
    //         'createdAt',
    //         'likesCount',
    //         'dislikesCount',
    //         'blogName',
    //     ];
    //
    //     //запрос для постов с лайками
    //     let postsSourceWithNewestLikes: PostWithLikesType[] = [];
    //     try {
    //         postsSourceWithNewestLikes = await this.dataSource.query(
    //             `
    //             SELECT
    //                 p.id,
    //                 p.title,
    //                 p."shortDescription",
    //                 p.content,
    //                 p."blogId",
    //                 b."name" AS "blogName",
    //                 p."createdAt",
    //                 p."likesCount",
    //                 p."dislikesCount",
    //                 CASE
    //                     WHEN l."likeStatus" IS NULL THEN $1
    //                     ElSE l."likeStatus"
    //                 END AS "myStatus",
    //                 nl."addedAt",
    //                 nl."userId",
    //                 nl.login
    //             FROM posts p
    //             LEFT JOIN public.blogs b ON p."blogId" = b.id
    //             LEFT JOIN (
    //                 SELECT *
    //                 FROM public.likes
    //                 WHERE likes."userId"= $2
    //             ) l ON l."parentId" = p."id"
    //             LEFT JOIN (
    //                 SELECT
    //                     l."createdAt" AS "addedAt",
    //                     l."likeStatus" AS "description",
    //                     l."userId",
    //                     u.login,
    //                     l."parentId"
    //                 FROM public.likes l
    //                 LEFT JOIN public.users u ON u.id = l."userId"
    //                 WHERE l."likeStatus" = $3
    //                 ORDER BY l."createdAt" DESC
    //             ) AS nl ON nl."parentId" = p.id
    //             WHERE p."id" = $4 AND p."isDeleted" = False
    //             `,
    //             [LikeStatus.None, userId, LikeStatus.Like, postId],
    //         );
    //     } catch {
    //         console.log('postsQueryRepo.findPost error:', e);
    //         return null;
    //     }
    //     //маппинг
    //     const uniquePosts = new Set();
    //     postsSourceWithNewestLikes.forEach((el) => {
    //         uniquePosts.add(el.id);
    //     });
    //
    //     const posts: PostsViewDto[] = [];
    //     uniquePosts.forEach((postId) => {
    //         let likes = [];
    //         const postSource: PostWithLikesType[] =
    //             postsSourceWithNewestLikes.filter((p) => p.id === postId);
    //
    //         postSource.map((p: PostWithLikesType) => {
    //             if (
    //                 p.login !== null &&
    //                 p.userId !== null &&
    //                 p.addedAt !== null
    //             ) {
    //                 if (likes.length < 3) {
    //                     likes.push({
    //                         addedAt: p.addedAt,
    //                         userId: p.userId,
    //                         login: p.login,
    //                     });
    //                 }
    //             }
    //         });
    //
    //         const fullPost: PostsViewDto = {
    //             id: postSource[0].id,
    //             blogId: postSource[0].blogId,
    //             blogName: postSource[0].blogName,
    //             content: postSource[0].content,
    //             createdAt: postSource[0].createdAt,
    //             title: postSource[0].title,
    //             shortDescription: postSource[0].shortDescription,
    //             extendedLikesInfo: {
    //                 myStatus: postSource[0].myStatus as LikeStatus,
    //                 likesCount: postSource[0].likesCount,
    //                 dislikesCount: postSource[0].dislikesCount,
    //                 newestLikes: likes,
    //             },
    //         };
    //         posts.push(fullPost);
    //     });
    //     return posts[0];
    // }
}
