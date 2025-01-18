import {
    BadGatewayException,
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { BlogPostInputDto } from './dto/input/blog-post-input.dto';
import { BlogsService } from '../application/blogs-service';
import { QueryDto, QueryDtoForBlogs } from '../../../../common/dto/query-dto';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../common/dto/paginator-dto';
import { QueryBus } from '@nestjs/cqrs';
import { BasicAuthGuard } from '../../../auth/auth/guards/basic-auth-guard';
import { BlogInputDto } from './dto/input/blog-input-dto';
import {
    GetPostsForBlogPayload,
    GetPostsResultType,
} from '../../posts/infrastructure/queries/get-posts-for-blog.query';
import { BanUserSaInfoViewDto } from '../../../users/api/dto/input/ban-user-input-dto';
import { GetBlogsForAdminPayload } from '../infrastructure/queries/get-blogs-for-admin-query';
import { BlogWithBanInfoViewDto } from './dto/output/blog-with-ban-info-view-dto';

@Controller('sa/blogs')
export class BlogsSaController {
    constructor(
        private readonly blogsService: BlogsService,
        private readonly queryBus: QueryBus,
    ) {}

    @UseGuards(BasicAuthGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getBlogs(@Query() query: QueryDtoForBlogs) {
        const queryPayload = new GetBlogsForAdminPayload(query);
        const getBlogsResult = await this.queryBus.execute<
            GetBlogsForAdminPayload,
            InterlayerNotice<PaginatorDto<BlogWithBanInfoViewDto>>
        >(queryPayload);
        return getBlogsResult.data;
    }

    @UseGuards(BasicAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createBlog(@Body() blogInputDto: BlogInputDto) {
        const createBlogInterlayer =
            await this.blogsService.createBlog(blogInputDto);
        if (createBlogInterlayer.hasError()) {
            throw new BadGatewayException();
        }
        return createBlogInterlayer.data;
    }

    @UseGuards(BasicAuthGuard)
    @Put(':blogId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateBlog(
        @Body() blogInputDto: BlogInputDto,
        @Param('blogId', ParseUUIDPipe) blogId: string,
    ) {
        const updateBlogInterlayer = await this.blogsService.updateBlog(
            blogId,
            blogInputDto,
        );
        if (updateBlogInterlayer.hasError()) {
            throw new NotFoundException();
        }
        return updateBlogInterlayer.data;
    }

    @UseGuards(BasicAuthGuard)
    @Delete(':blogId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBlog(@Param('blogId', ParseUUIDPipe) blogId: string) {
        const deleteBlogInterlayer = await this.blogsService.deleteBlog(blogId);
        if (deleteBlogInterlayer.hasError()) {
            throw new NotFoundException();
        }
        return deleteBlogInterlayer.data;
    }

    @UseGuards(BasicAuthGuard)
    @Post(':blogId/posts')
    @HttpCode(HttpStatus.CREATED)
    async createPostForBlog(
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Body() blogPostBody: BlogPostInputDto,
    ) {
        const createdPostForBlog = await this.blogsService.createPostForBlog(
            blogId,
            blogPostBody,
        );
        if (createdPostForBlog.hasError()) {
            throw new NotFoundException();
        }
        return createdPostForBlog.data;
    }

    @UseGuards(BasicAuthGuard)
    @Get(':blogId/posts')
    @HttpCode(HttpStatus.OK)
    async getPostsForBlog(
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Query() query: QueryDto,
    ) {
        const queryPayload = new GetPostsForBlogPayload(query, blogId);
        const posts = await this.queryBus.execute<
            GetPostsForBlogPayload,
            GetPostsResultType
        >(queryPayload);
        if (!posts) {
            throw new NotFoundException();
        }
        return posts;
    }

    @UseGuards(BasicAuthGuard)
    @Put(':blogId/posts/:postId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updatePostForBlog(
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Param('postId', ParseUUIDPipe) postId: string,
        @Body() blogPostInputDto: BlogPostInputDto,
    ) {
        const isUpdatedInterLayer = await this.blogsService.updatePostForBlog(
            blogId,
            blogPostInputDto,
            postId,
        );
        if (isUpdatedInterLayer.hasError()) {
            throw new NotFoundException();
        }
    }

    @UseGuards(BasicAuthGuard)
    @Delete(':blogId/posts/:postId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deletePostForBlog(
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Param('postId', ParseUUIDPipe) postId: string,
    ) {
        const isDeletedInterLayer = await this.blogsService.deletePostForBlog(
            blogId,
            postId,
        );
        if (isDeletedInterLayer.hasError()) {
            throw new NotFoundException();
        }
    }
    @UseGuards(BasicAuthGuard)
    @Put(':blogId/ban')
    @HttpCode(HttpStatus.NO_CONTENT)
    async banBlog(
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Body() query: BanUserSaInfoViewDto,
    ) {
        const banBlogInterlayer = await this.blogsService.banBlog(
            blogId,
            query.isBanned,
        );
        if (banBlogInterlayer.hasError()) {
            throw new BadRequestException(
                banBlogInterlayer.extensions.map((e) => {
                    return {
                        message: e.message,
                        field: e.key,
                    };
                }),
            );
        }
    }

    @UseGuards(BasicAuthGuard)
    @Put(':blogId/bind-with-user/:userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async bindBlogWithUser(
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Param('userId', ParseUUIDPipe) userId: string,
    ) {
        const bindBlogWithUserInterlayer =
            await this.blogsService.bindBlogWithUser(blogId, userId);
        if (bindBlogWithUserInterlayer.hasError()) {
            throw new BadRequestException(
                bindBlogWithUserInterlayer.extensions.map((e) => {
                    return {
                        message: e.message,
                        field: e.key,
                    };
                }),
            );
        }
    }
}
