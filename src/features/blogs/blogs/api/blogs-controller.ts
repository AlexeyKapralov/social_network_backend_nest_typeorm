import {
    Controller,
    Get,
    NotFoundException,
    Param,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { QueryDto, QueryDtoForBlogs } from '../../../../common/dto/query-dto';
import { QueryBus } from '@nestjs/cqrs';
import { GetBlogsPayload } from '../infrastructure/queries/get-blogs-query';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../common/dto/paginator-dto';
import { BlogViewDto } from './dto/output/blog-view-dto';
import { BlogsQueryRepository } from '../infrastructure/blogs-query-repository';
import {
    GetPostsForBlogPayload,
    GetPostsResultType,
} from '../../posts/infrastructure/queries/get-posts-for-blog.query';
import { ValidateOptionalJwtGuard } from '../../../auth/auth/guards/validate-optional-jwt-guard.service';

@Controller('blogs')
export class BlogsController {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly blogQueryRepository: BlogsQueryRepository,
    ) {}

    @Get()
    async getBlogs(@Query() query: QueryDtoForBlogs) {
        const queryPayload = new GetBlogsPayload(query);
        const getBlogsInterlayer = await this.queryBus.execute<
            GetBlogsPayload,
            InterlayerNotice<PaginatorDto<BlogViewDto>>
        >(queryPayload);

        return getBlogsInterlayer.data;
    }

    @UseGuards(ValidateOptionalJwtGuard)
    @Get(':blogId/posts')
    async getPostsForBlog(
        @Req() req: any,
        @Param('blogId') blogId: string,
        @Query() query: QueryDto,
    ) {
        let userId: string;
        if (req.user) {
            if (req.user.userId) {
                userId = req.user.userId;
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
