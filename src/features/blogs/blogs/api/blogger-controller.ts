import {
    BadGatewayException,
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseFilePipeBuilder,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { BlogPostInputDto } from './dto/input/blog-post-input.dto';
import { QueryDto, QueryDtoWithName } from '../../../../common/dto/query-dto';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../common/dto/paginator-dto';
import { BlogViewDto } from './dto/output/blog-view-dto';
import { QueryBus } from '@nestjs/cqrs';
import { BlogInputDto } from './dto/input/blog-input-dto';
import {
    GetPostsForBlogPayload,
    GetPostsResultType,
} from '../../posts/infrastructure/queries/get-posts-for-blog.query';
import { AccessTokenPayloadDto } from '../../../../common/dto/access-token-payload-dto';
import { BloggerService } from '../application/blogger-service';
import { GetBlogsForUserPayload } from '../infrastructure/queries/get-blogs-for-user-query';
import { ValidateJwtGuard } from '../../../auth/auth/guards/validate-jwt-guard';
import { JwtAuthGuard } from '../../../auth/auth/guards/jwt-auth-guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('blogger/blogs')
export class BloggerController {
    constructor(
        private readonly bloggerService: BloggerService,
        private readonly queryBus: QueryBus,
    ) {}

    @UseGuards(ValidateJwtGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getBlogs(@Req() req: any, @Query() query: QueryDtoWithName) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }
        const queryPayload = new GetBlogsForUserPayload(
            query,
            accessTokenPayload.userId,
        );
        const getBlogsResult = await this.queryBus.execute<
            GetBlogsForUserPayload,
            InterlayerNotice<PaginatorDto<BlogViewDto>>
        >(queryPayload);
        return getBlogsResult.data;
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createBlog(@Req() req: any, @Body() blogInputDto: BlogInputDto) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user['payload'];
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }
        const createBlogInterlayer = await this.bloggerService.createBlog(
            blogInputDto,
            accessTokenPayload.userId,
        );
        if (createBlogInterlayer.hasError()) {
            throw new BadGatewayException();
        }
        return createBlogInterlayer.data;
    }

    @UseGuards(ValidateJwtGuard)
    @Put(':blogId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateBlog(
        @Req() req: any,
        @Body() blogInputDto: BlogInputDto,
        @Param('blogId', ParseUUIDPipe) blogId: string,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }
        const updateBlogInterlayer = await this.bloggerService.updateBlog(
            blogId,
            blogInputDto,
            accessTokenPayload.userId,
        );
        if (updateBlogInterlayer.hasError()) {
            switch (updateBlogInterlayer.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN: {
                    throw new ForbiddenException(
                        updateBlogInterlayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.NOT_FOUND: {
                    throw new NotFoundException(
                        updateBlogInterlayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.BAD_REQUEST: {
                    throw new BadRequestException(
                        updateBlogInterlayer.extensions[0].message,
                    );
                }
            }
        }
        return updateBlogInterlayer.data;
    }

    @UseGuards(ValidateJwtGuard)
    @Delete(':blogId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBlog(
        @Req() req: any,
        @Param('blogId', ParseUUIDPipe) blogId: string,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }
        const deleteBlogInterlayer = await this.bloggerService.deleteBlog(
            blogId,
            accessTokenPayload.userId,
        );
        if (deleteBlogInterlayer.hasError()) {
            switch (deleteBlogInterlayer.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN: {
                    throw new ForbiddenException(
                        deleteBlogInterlayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.NOT_FOUND: {
                    throw new NotFoundException(
                        deleteBlogInterlayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.BAD_REQUEST: {
                    throw new BadRequestException(
                        deleteBlogInterlayer.extensions[0].message,
                    );
                }
            }
        }
        return deleteBlogInterlayer.data;
    }

    @UseGuards(ValidateJwtGuard)
    @Post(':blogId/posts')
    @HttpCode(HttpStatus.CREATED)
    async createPostForBlog(
        @Req() req: any,
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Body() blogPostBody: BlogPostInputDto,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }
        const createdPostForBlog = await this.bloggerService.createPostForBlog(
            blogId,
            blogPostBody,
            accessTokenPayload.userId,
        );
        if (createdPostForBlog.hasError()) {
            switch (createdPostForBlog.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN: {
                    throw new ForbiddenException(
                        createdPostForBlog.extensions[0].message,
                    );
                }
                case InterlayerStatuses.NOT_FOUND: {
                    throw new NotFoundException(
                        createdPostForBlog.extensions[0].message,
                    );
                }
                case InterlayerStatuses.BAD_REQUEST: {
                    throw new BadRequestException(
                        createdPostForBlog.extensions[0].message,
                    );
                }
            }
        }
        return createdPostForBlog.data;
    }

    @UseGuards(ValidateJwtGuard)
    @Get(':blogId/posts')
    @HttpCode(HttpStatus.OK)
    async getPostsForBlog(
        @Req() req: any,
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Query() query: QueryDto,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }
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

    @UseGuards(ValidateJwtGuard)
    @Put(':blogId/posts/:postId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updatePostForBlog(
        @Req() req: any,
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Param('postId', ParseUUIDPipe) postId: string,
        @Body() blogPostInputDto: BlogPostInputDto,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }
        const isUpdatedInterLayer = await this.bloggerService.updatePostForBlog(
            blogId,
            blogPostInputDto,
            postId,
            accessTokenPayload.userId,
        );
        if (isUpdatedInterLayer.hasError()) {
            switch (isUpdatedInterLayer.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN: {
                    throw new ForbiddenException(
                        isUpdatedInterLayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.NOT_FOUND: {
                    throw new NotFoundException(
                        isUpdatedInterLayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.BAD_REQUEST: {
                    throw new BadRequestException(
                        isUpdatedInterLayer.extensions[0].message,
                    );
                }
            }
        }
    }

    @UseGuards(ValidateJwtGuard)
    @Delete(':blogId/posts/:postId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deletePostForBlog(
        @Req() req: any,
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Param('postId', ParseUUIDPipe) postId: string,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }
        const isDeletedInterLayer = await this.bloggerService.deletePostForBlog(
            blogId,
            postId,
            accessTokenPayload.userId,
        );
        if (isDeletedInterLayer.hasError()) {
            switch (isDeletedInterLayer.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN: {
                    throw new ForbiddenException(
                        isDeletedInterLayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.NOT_FOUND: {
                    throw new NotFoundException(
                        isDeletedInterLayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.BAD_REQUEST: {
                    throw new BadRequestException(
                        isDeletedInterLayer.extensions[0].message,
                    );
                }
            }
        }
    }

    @UseGuards(ValidateJwtGuard)
    @Post(':blogId/images/wallpaper')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    async uploadWallpaperForBlog(
        @Req() req: any,
        @Res({ passthrough: true })
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: /jpeg|png/,
                })
                .addMaxSizeValidator({
                    maxSize: 100 * 1024, // 100 КБайт
                })
                .build({
                    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
                }),
        )
        photo: Express.Multer.File,
        @Param('blogId') blogId: string,
    ) {
        const validateInterlayer = await this.bloggerService.validateImageSize(
            photo.buffer,
            1028,
            312,
        );
        if (validateInterlayer.hasError()) {
            throw new BadRequestException();
        }

        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload?.userId) {
            throw new BadRequestException();
        }

        const uploadPhotoInterlayer =
            await this.bloggerService.uploadWallpaperForBlog(
                blogId,
                accessTokenPayload.userId,
                photo,
            );

        console.log('uploadPhotoInterlayer', uploadPhotoInterlayer);
        if (uploadPhotoInterlayer.hasError()) {
            switch (uploadPhotoInterlayer.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN: {
                    throw new ForbiddenException(
                        uploadPhotoInterlayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.NOT_FOUND: {
                    throw new NotFoundException(
                        uploadPhotoInterlayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.BAD_REQUEST: {
                    throw new BadRequestException(
                        uploadPhotoInterlayer.extensions[0].message,
                    );
                }
            }
        }
        return uploadPhotoInterlayer.data;
    }

    @UseGuards(ValidateJwtGuard)
    @Post(':blogId/images/main')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    async uploadMainForBlog(
        @Req() req: any,
        @Res({ passthrough: true })
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: /jpeg|png/,
                })
                .addMaxSizeValidator({
                    maxSize: 100 * 1024, // 100 КБайт
                })
                .build({
                    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
                }),
        )
        photo: Express.Multer.File,
        @Param('blogId') blogId: string,
    ) {
        const validateInterlayer = await this.bloggerService.validateImageSize(
            photo.buffer,
            156,
            156,
        );
        if (validateInterlayer.hasError()) {
            throw new BadRequestException();
        }

        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload?.userId) {
            throw new BadRequestException();
        }

        const uploadPhotoInterlayer =
            await this.bloggerService.uploadMainForBlog(
                blogId,
                accessTokenPayload.userId,
                photo,
            );

        console.log('uploadPhotoInterlayer', uploadPhotoInterlayer);
        if (uploadPhotoInterlayer.hasError()) {
            switch (uploadPhotoInterlayer.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN: {
                    throw new ForbiddenException(
                        uploadPhotoInterlayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.NOT_FOUND: {
                    throw new NotFoundException(
                        uploadPhotoInterlayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.BAD_REQUEST: {
                    throw new BadRequestException(
                        uploadPhotoInterlayer.extensions[0].message,
                    );
                }
            }
        }
        return uploadPhotoInterlayer.data;
    }

    @UseGuards(ValidateJwtGuard)
    @Post(':blogId/posts/:postId/images/main')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    async uploadMainForPost(
        @Req() req: any,
        @Res({ passthrough: true })
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: /jpeg|png/,
                })
                .addMaxSizeValidator({
                    maxSize: 100 * 1024, // 100 КБайт
                })
                .build({
                    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
                }),
        )
        photo: Express.Multer.File,
        @Param('blogId') blogId: string,
        @Param('postId') postId: string,
    ) {
        const validateInterlayer = await this.bloggerService.validateImageSize(
            photo.buffer,
            940,
            432,
        );
        if (validateInterlayer.hasError()) {
            console.log(validateInterlayer.extensions[0].message);
            throw new BadRequestException();
        }

        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload?.userId) {
            throw new BadRequestException();
        }

        const uploadPhotoInterlayer =
            await this.bloggerService.uploadMainForPost(
                blogId,
                postId,
                accessTokenPayload.userId,
                photo,
            );

        console.log('uploadPhotoInterlayer', uploadPhotoInterlayer);
        if (uploadPhotoInterlayer.hasError()) {
            switch (uploadPhotoInterlayer.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN: {
                    throw new ForbiddenException(
                        uploadPhotoInterlayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.NOT_FOUND: {
                    throw new NotFoundException(
                        uploadPhotoInterlayer.extensions[0].message,
                    );
                }
                case InterlayerStatuses.BAD_REQUEST: {
                    throw new BadRequestException(
                        uploadPhotoInterlayer.extensions[0].message,
                    );
                }
            }
        }
        return uploadPhotoInterlayer.data;
    }
}
