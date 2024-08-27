import {
    BadGatewayException,
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
import { BlogsQueryRepository } from '../infrastructure/blogs-query-repository';
import {
    QueryDtoBase,
    QueryDtoWithName,
} from '../../../../common/dto/query-dto';
import { GetBlogsPayload } from '../infrastructure/queries/get-blogs-query';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../common/dto/paginator-dto';
import { BlogViewDto } from './dto/output/blog-view-dto';
import { QueryBus } from '@nestjs/cqrs';
import { BasicAuthGuard } from '../../../auth/auth/guards/basic-auth-guard';
import { BlogInputDto } from './dto/input/blog-input-dto';
import {
    GetPostsResultType,
    GetPostsForBlogPayload,
} from '../../posts/infrastructure/queries/get-posts-for-blog.query';

@Controller('sa/blogs')
export class BlogsSaController {
    constructor(
        private readonly blogsService: BlogsService,
        private readonly blogQueryRepository: BlogsQueryRepository,
        // private readonly postQueryRepository: PostsQueryRepository,
        private readonly queryBus: QueryBus,
    ) {}

    @UseGuards(BasicAuthGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getBlogs(@Query() query: QueryDtoWithName) {
        const queryPayload = new GetBlogsPayload(query);
        const getBlogsResult = await this.queryBus.execute<
            GetBlogsPayload,
            InterlayerNotice<PaginatorDto<BlogViewDto>>
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
        @Query() query: QueryDtoBase,
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
}
