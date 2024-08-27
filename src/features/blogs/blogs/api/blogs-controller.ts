import {
    Controller,
    Get,
    NotFoundException,
    Param,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import {
    QueryDtoBase,
    QueryDtoWithName,
} from '../../../../common/dto/query-dto';
import { QueryBus } from '@nestjs/cqrs';
import { GetBlogsPayload } from '../infrastructure/queries/get-blogs-query';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../common/dto/paginator-dto';
import { BlogViewDto } from './dto/output/blog-view-dto';
import { JwtAuthGuard } from '../../../auth/auth/guards/jwt-auth-guard';
import { AccessTokenPayloadDto } from '../../../../common/dto/access-token-payload-dto';
import { BlogsQueryRepository } from '../infrastructure/blogs-query-repository';
import {
    GetPostsForBlogPayload,
    GetPostsResultType,
} from '../../posts/infrastructure/queries/get-posts-for-blog.query';
import { ValidateJwtGuard } from '../../../auth/auth/guards/validate-jwt-guard';

@Controller('blogs')
export class BlogsController {
    constructor(
        private queryBus: QueryBus,
        private blogQueryRepository: BlogsQueryRepository,
    ) {}

    @Get()
    async getBlogs(@Query() query: QueryDtoWithName) {
        const queryPayload = new GetBlogsPayload(query);
        const getBlogsInterlayer = await this.queryBus.execute<
            GetBlogsPayload,
            InterlayerNotice<PaginatorDto<BlogViewDto>>
        >(queryPayload);

        return getBlogsInterlayer.data;
    }

    @UseGuards(ValidateJwtGuard)
    @Get(':blogId/posts')
    async getPostsForBlog(
        @Req() req: any,
        @Param('blogId') blogId: string,
        @Query() query: QueryDtoBase,
    ) {
        let userId: string;
        if (req.user.payload) {
            if (req.user.payload.userId) {
                userId = req.user.payload.userId;
            }
        }

        let foundBlog: BlogViewDto;
        try {
            foundBlog = await this.blogQueryRepository.findBlog(blogId);
        } catch {}

        if (!foundBlog) {
            throw new NotFoundException();
        }

        const queryPayload = new GetPostsForBlogPayload(query, blogId, userId);

        return await this.queryBus.execute<
            GetPostsForBlogPayload,
            GetPostsResultType
        >(queryPayload);
    }

    @Get(':blogId')
    async getBlog(@Param('blogId') blogId: string) {
        const foundedBlog = await this.blogQueryRepository.findBlog(blogId);
        if (!foundedBlog) {
            throw new NotFoundException();
        }
        return foundedBlog;
    }
}
