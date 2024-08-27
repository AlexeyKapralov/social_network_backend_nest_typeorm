import {
    Controller,
    Get,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { QueryDtoBase } from '../../../../common/dto/query-dto';
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

@Controller('posts')
export class PostsController {
    constructor(private readonly queryBus: QueryBus) {}

    @UseGuards(ValidateJwtGuard)
    @Get(':postId')
    async findPost(
        @Req() req: any,
        @Param('postId', ParseUUIDPipe) postId: string,
    ) {
        let userId: string;
        if (req.user.payload) {
            if (req.user.payload.userId) {
                userId = req.user.payload.userId;
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
    async findPosts(@Req() req: any, @Query() query: QueryDtoBase) {
        let userId: string;
        if (req.user.payload) {
            if (req.user.payload.userId) {
                userId = req.user.payload.userId;
            }
        }

        const queryPayload = new GetPostsPayload(query, userId);
        return await this.queryBus.execute<GetPostsPayload, GetPostsResultType>(
            queryPayload,
        );
    }
}
