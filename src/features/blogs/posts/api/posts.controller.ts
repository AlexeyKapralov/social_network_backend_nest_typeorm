// import {
//     Body,
//     Controller,
//     Delete,
//     Get,
//     Headers,
//     HttpCode,
//     HttpStatus,
//     NotFoundException,
//     Param,
//     Post,
//     Put,
//     Query,
//     Res,
//     UseGuards,
// } from '@nestjs/common';
// import { PostInputDto } from './dto/input/post-input.dto';
// import { PostsService } from '../application/posts.service';
// import { PostsQueryRepository } from '../infrastructure/posts-query.repository';
// import { Response } from 'express';
// import { AuthGuard } from '@nestjs/passport';
// import { CommentInputDto } from '../../comments/api/dto/input/comment-input.dto';
// import { CommandBus, QueryBus } from '@nestjs/cqrs';
// import {
//     CreateCommentCommand,
//     CreateCommentResultType,
// } from '../../comments/application/usecases/create-comment.usecase';
// import { CommentsQueryRepository } from '../../comments/infrastructure/commentsQuery.repository';
// import { JwtService } from '@nestjs/jwt';
// import {
//     GetCommentsPayload,
//     GetCommentsResultType,
// } from '../../comments/infrastructure/queries/get-comments.query';
// import { LikeInputDto } from '../../likes/api/dto/input/like-input.dto';
// import { LikeService } from '../../likes/application/like.service';
// import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
// import { JwtLocalService } from '../../../../base/services/jwt-local.service';
// import { JwtAuthGuard } from '../../../auth/auth/guards/jwt-auth.guard';
// import { CurrentUserId } from '../../../auth/auth/api/decorators/current-user.param.decorator';
// import { InterlayerNotice, InterLayerStatuses } from '../../../../base/models/interlayer';
// import { QueryDtoBase } from '../../../../common/dto/query.dto';
//
// @Controller('posts')
// export class PostsController {
//     constructor(
//        private readonly postService: PostsService,
//        private readonly jwtService: JwtService,
//        private readonly likeService: LikeService,
//        private readonly postQueryRepository: PostsQueryRepository,
//        private readonly blogsRepository: BlogsRepository,
//        private readonly commandBus: CommandBus,
//        private readonly queryBus: QueryBus,
//        private readonly commentsQueryRepository: CommentsQueryRepository,
//        private readonly jwtLocalService: JwtLocalService,
//     ) {}
//
//     @UseGuards(JwtAuthGuard)
//     @Put(':postId/like-status')
//     @HttpCode(HttpStatus.NO_CONTENT)
//     async makeLikeOrDislike(
//         @Param('postId') postId: string,
//         @Body() likeBody: LikeInputDto,
//         @CurrentUserId() userId: string
//     ) {
//         const likeInterLayer =
//             await this.likeService.changeLikeStatus(userId, postId, likeBody.likeStatus)
//
//         if ( likeInterLayer.hasError() ) {
//             console.log(likeInterLayer.extensions);
//             throw new NotFoundException()
//         }
//     }
//
//     @UseGuards(JwtAuthGuard)
//     @Post(':postId/comments')
//     async createComment(
//         @Param('postId') postId: string,
//         @Body() commentBody: CommentInputDto,
//         @CurrentUserId() userId: string
//     ) {
//         const command = new CreateCommentCommand(postId, commentBody.content, userId)
//         const commentInterlayer = await this.commandBus.execute<
//             CreateCommentCommand,
//             InterlayerNotice<CreateCommentResultType>
//         >(command)
//
//         if (commentInterlayer.hasError()) {
//             console.log(commentInterlayer.extensions);
//             throw new NotFoundException()
//         }
//
//
//         const foundedCommentInterLayer = await this.commentsQueryRepository.getComment(commentInterlayer.data.commentId, userId)
//         if (foundedCommentInterLayer.hasError()) {
//             console.log(commentInterlayer.extensions);
//             throw new NotFoundException()
//         }
//
//         return foundedCommentInterLayer.data
//
//     }
//
//     @Get(':postId/comments')
//     async getComments(
//         @Param('postId') postId: string,
//         @Query() query: QueryDtoBase,
//         @Headers('authorization') authorization: string,
//     ) {
//
//         const userId = await this.jwtLocalService.parseJwtToken(authorization)
//
//         const queryPayload = new GetCommentsPayload(
//             query.sortBy,
//             query.sortDirection,
//             query.pageNumber,
//             query.pageSize,
//             postId,
//             userId
//         )
//         const foundCommentsInterLayer = await this.queryBus.execute<
//             GetCommentsPayload,
//             InterlayerNotice<GetCommentsResultType>
//         >(queryPayload)
//
//         if (foundCommentsInterLayer.hasError()) {
//             if (foundCommentsInterLayer.code === InterLayerStatuses.NOT_FOUND) {
//                 throw new NotFoundException()
//             }
//             throw new Error('something went wrong with query find comments')
//         }
//
//         return foundCommentsInterLayer.data
//     }
//
//     @UseGuards(JwtAuthGuard)
//     @Post()
//     async createPost(
//         @Body() postInputData: PostInputDto
//     ) {
//         const createdPostInterLayer = await this.postService.createPost(postInputData)
//         if (createdPostInterLayer.hasError()) {
//             throw new NotFoundException()
//         }
//         return createdPostInterLayer.data
//     }
//
//     @Get(':postId')
//     async findPost(
//         @Param('postId') postId: string,
//         @Res({passthrough: true}) res: Response,
//         @Headers('authorization') authorization: string,
//     ) {
//
//         let userId = ''
//         if (authorization) {
//             userId = await this.jwtLocalService.parseJwtToken(authorization)
//         }
//
//         const foundPost = await this.postQueryRepository.findPost(postId, userId)
//         foundPost ? res.status(HttpStatus.OK).send(foundPost) : res.status(HttpStatus.NOT_FOUND)
//     }
//
//     @Get()
//     async findPosts(
//         @Query() query: QueryDtoBase,
//         @Headers('authorization') authorization: string,
//     ) {
//         const userId = await this.jwtLocalService.parseJwtToken(authorization)
//
//         return await this.postQueryRepository.findPosts(query, userId);
//     }
//
//     @UseGuards(AuthGuard('basic'))
//     @Put(':postId')
//     async updatePost(
//         @Param('postId') postId: string,
//         @Body() postUpdateData: PostInputDto,
//         @Res({passthrough: true}) res: Response
//     ) {
//         const isUpdatedPost = await this.postService.updatePost(postId, postUpdateData)
//         isUpdatedPost ? res.status(HttpStatus.NO_CONTENT) : res.status(HttpStatus.NOT_FOUND)
//     }
//
//     @UseGuards(AuthGuard('basic'))
//     @Delete(':postId')
//     async deletePost(
//         @Param('postId') postId: string,
//         @Res({passthrough: true}) res: Response
//     ) {
//         const isDeletedPost = await this.postService.deletePost(postId)
//         isDeletedPost ? res.status(HttpStatus.NO_CONTENT) : res.status(HttpStatus.NOT_FOUND)
//     }
// }
