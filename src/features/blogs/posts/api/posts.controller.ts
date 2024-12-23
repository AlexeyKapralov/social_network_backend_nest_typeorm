import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { QueryDto } from '../../../../common/dto/query-dto';
import { ValidateJwtGuard } from '../../../auth/auth/guards/validate-jwt-guard';
import {
    GetPostsPayload,
    GetPostsResultType,
} from '../infrastructure/queries/get-posts.query';
import { QueryBus } from '@nestjs/cqrs';
import {
    GetOnePostPayload,
    GetOnePostResultType,
} from '../infrastructure/queries/get-one-post.query';
import { JwtAuthGuard } from '../../../auth/auth/guards/jwt-auth-guard';
import { CommentInputDto } from '../../comments/api/dto/input/comment-input.dto';
import { CommentsService } from '../../comments/application/comments.service';
import { AccessTokenPayloadDto } from '../../../../common/dto/access-token-payload-dto';
import { LikeInputDto } from '../../likes/api/dto/input/like-input.dto';
import { PostsService } from '../application/posts.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('posts')
export class PostsController {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly commentsService: CommentsService,
        private readonly postsService: PostsService,

        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

    @UseGuards(ValidateJwtGuard)
    @Get(':postId')
    async findPost(
        @Req() req: any,
        @Param('postId', ParseUUIDPipe) postId: string,
    ) {
        let userId: string;
        if (req.user) {
            if (req.user.userId) {
                userId = req.user.userId;
            }
        }

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

    @UseGuards(ValidateJwtGuard)
    @Get()
    async findPosts(@Req() req: any, @Query() query: QueryDto) {
        let userId: string;
        if (req.user) {
            if (req.user.userId) {
                userId = req.user.userId;
            }
        }

        const queryPayload = new GetPostsPayload(query, userId);
        return await this.queryBus.execute<GetPostsPayload, GetPostsResultType>(
            queryPayload,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post(':postId/comments')
    async createCommentForPost(
        @Req() req: any,
        @Param('postId', ParseUUIDPipe) postId: string,
        @Body() commentInputDto: CommentInputDto,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const createCommentInterlayer =
            await this.commentsService.createComment(
                commentInputDto,
                accessTokenPayload.userId,
                postId,
            );

        if (createCommentInterlayer.hasError()) {
            throw new NotFoundException();
        }
        return createCommentInterlayer.data;
    }

    @UseGuards(ValidateJwtGuard)
    @Get(':postId/comments')
    async getCommentsForPost(
        @Req() req: any,
        @Param('postId', ParseUUIDPipe) postId: string,
        @Query() query: QueryDto,
    ) {
        let userId: string;
        if (req.user) {
            if (req.user.userId) {
                userId = req.user.userId;
            }
        }

        const getCommentsInterlayer = await this.commentsService.findComments(
            query,
            postId,
            userId,
        );
        if (getCommentsInterlayer.hasError()) {
            throw new NotFoundException();
        }
        return getCommentsInterlayer.data;
    }

    @UseGuards(JwtAuthGuard)
    @Put(':postId/like-status')
    @HttpCode(HttpStatus.NO_CONTENT)
    async changeLikeStatus(
        @Req() req: any,
        @Body() likeInputDto: LikeInputDto,
        @Param('postId', ParseUUIDPipe) postId: string,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const isLikeStatusUpdatedInterlayer =
            await this.postsService.updateLikeStatus(
                postId,
                accessTokenPayload.userId,
                likeInputDto,
            );
        if (isLikeStatusUpdatedInterlayer.hasError()) {
            throw new NotFoundException();
        }
    }
}
