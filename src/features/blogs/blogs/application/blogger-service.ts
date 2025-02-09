import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BlogInputDto } from '../api/dto/input/blog-input-dto';
import { BlogViewDto } from '../api/dto/output/blog-view-dto';
import { BlogsRepository } from '../infrastructure/blogs-repository';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';
import { BlogPostInputDto } from '../api/dto/input/blog-post-input.dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { PostsViewDto } from '../../posts/api/dto/output/extended-likes-info-view.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { blogViewDtoMapper } from '../../../../base/mappers/blog-view-mapper';
import { S3StorageService } from '../../../files/application/s3-storage.service';
import sharp from 'sharp';
import { BlogImagesViewDto } from '../api/dto/output/blog-images-view.dto';
import { FileTypeEnum } from '../../../files/api/enum/file-type.enum';
import { PostImagesViewDto } from '../api/dto/output/post-images-view.dto';
import { File } from '../../../files/domain/s3-storage.entity';

@Injectable()
export class BloggerService {
    constructor(
        private readonly blogsRepository: BlogsRepository,
        private readonly postsRepository: PostsRepository,
        private readonly s3StorageService: S3StorageService,
    ) {}

    async createBlog(
        blogInputDto: BlogInputDto,
        userId: string,
    ): Promise<InterlayerNotice<BlogViewDto>> {
        const notice = new InterlayerNotice<BlogViewDto>();
        const blog = await this.blogsRepository.createBlog(
            blogInputDto,
            userId,
        );
        if (!blog) {
            notice.addError('blog is not created');
            return notice;
        }

        const files: Pick<
            File,
            'fileKey' | 'fileSize' | 'height' | 'width' | 'typeFile'
        >[] = [];
        notice.addData(blogViewDtoMapper(blog, files));
        return notice;
    }

    async updateBlog(
        blogId: string,
        blogInputDto: BlogInputDto,
        userId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog is not exist',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user?.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isUpdatedBlog = await this.blogsRepository.updateBlog(
            blogId,
            blogInputDto,
        );
        if (!isUpdatedBlog) {
            notice.addError('blog was not updated');
            return notice;
        }
        return notice;
    }

    async deleteBlog(
        blogId: string,
        userId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog is not exist',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isDeletedBlog = await this.blogsRepository.deleteBlog(blogId);
        if (!isDeletedBlog) {
            notice.addError('blog was not deleted');
            return notice;
        }
        return notice;
    }

    async createPostForBlog(
        blogId: string,
        blogPostInputDto: BlogPostInputDto,
        userId: string,
    ): Promise<InterlayerNotice<PostsViewDto | null>> {
        const notice = new InterlayerNotice<PostsViewDto | null>();

        const foundBlog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!foundBlog) {
            notice.addError(
                '',
                'blog was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        console.log('foundBlog', foundBlog);
        if (foundBlog.user?.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const createdPost = await this.postsRepository.createPost(
            blogPostInputDto,
            foundBlog,
        );

        const mappedCreatedPost: PostsViewDto = {
            id: createdPost.id,
            title: createdPost.title,
            content: createdPost.content,
            shortDescription: createdPost.shortDescription,
            blogId: createdPost.blog.id,
            blogName: createdPost.blog.name,
            createdAt: createdPost.createdAt,
            extendedLikesInfo: {
                likesCount: createdPost.likesCount,
                dislikesCount: createdPost.dislikesCount,
                myStatus: LikeStatus.None,
                newestLikes: [],
            },
            images: {
                main: [],
            },
        };

        notice.addData(mappedCreatedPost);
        return notice;
    }

    async updatePostForBlog(
        blogId: string,
        blogPostInputDto: BlogPostInputDto,
        postId: string,
        userId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const post = await this.postsRepository.findPost(postId);

        if (!post) {
            notice.addError(
                '',
                'post was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isPostBelongBlog =
            await this.postsRepository.checkIsPostBelongBlog(blogId, postId);
        if (!isPostBelongBlog) {
            notice.addError(
                'post is not belong blog',
                'post',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isUpdatedPost = await this.postsRepository.updatePost(
            postId,
            blogPostInputDto,
        );
        if (!isUpdatedPost) {
            notice.addError(
                '',
                'post was not updated',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }
        return notice;
    }

    async deletePostForBlog(
        blogId: string,
        postId: string,
        userId: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const post = await this.postsRepository.findPost(postId);
        if (!post) {
            notice.addError(
                '',
                'post was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const isPostBelongBlog =
            await this.postsRepository.checkIsPostBelongBlog(blogId, postId);
        if (!isPostBelongBlog) {
            notice.addError(
                'post is not belong blog',
                'post',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isDeletedPost = await this.postsRepository.deletePost(postId);
        if (!isDeletedPost) {
            notice.addError('post was not deleted');
            return notice;
        }
        return notice;
    }

    async uploadWallpaperForBlog(
        blogId: string,
        userId: string,
        file: Express.Multer.File,
    ): Promise<InterlayerNotice<BlogImagesViewDto>> {
        const notice = new InterlayerNotice<BlogImagesViewDto>();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const key = this.s3StorageService.getKey(
            userId,
            file.originalname,
            file.mimetype,
            FileTypeEnum.wallpaper,
        );

        const isFileExist = await this.s3StorageService.getFile(key);
        if (isFileExist) {
            console.log('file is already exists');
            notice.addError(
                'file is already exists',
                '',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isUploadPhotoForBlog = await this.s3StorageService.uploadObject(
            userId,
            file.originalname,
            file.mimetype,
            file.buffer,
            FileTypeEnum.wallpaper,
        );
        if (!isUploadPhotoForBlog) {
            notice.addError(
                'wallpaper was not uploaded',
                '',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }

        const metadata = await sharp(file.buffer).metadata();
        const createFileRecord =
            await this.s3StorageService.createRecordAboutFile(
                key,
                String(metadata.size),
                String(metadata.height),
                String(metadata.width),
                FileTypeEnum.wallpaper,
                blogId,
                null,
            );
        if (!createFileRecord) {
            notice.addError(
                'file record in db not created',
                '',
                InterlayerStatuses.BAD_REQUEST,
            );
            try {
                await this.s3StorageService.deleteFile(key);
            } catch (e) {
                throw new InternalServerErrorException(
                    'error with delete file when in db not created record',
                );
            }
            return notice;
        }

        const blogImagesViewDto =
            await this.s3StorageService.getFilesForBlog(blogId);
        notice.addData(blogImagesViewDto);
        return notice;
    }

    async uploadMainForBlog(
        blogId: string,
        userId: string,
        file: Express.Multer.File,
    ): Promise<InterlayerNotice<BlogImagesViewDto>> {
        const notice = new InterlayerNotice<BlogImagesViewDto>();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const key = this.s3StorageService.getKey(
            userId,
            file.originalname,
            file.mimetype,
            FileTypeEnum.wallpaper,
        );

        const isUploadPhotoForBlog = await this.s3StorageService.uploadObject(
            userId,
            file.originalname,
            file.mimetype,
            file.buffer,
            FileTypeEnum.main,
        );
        if (!isUploadPhotoForBlog) {
            notice.addError(
                'wallpaper was not uploaded',
                '',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }

        const metadata = await sharp(file.buffer).metadata();
        const createFileRecord =
            await this.s3StorageService.createRecordAboutFile(
                key,
                String(metadata.size),
                String(metadata.height),
                String(metadata.width),
                FileTypeEnum.main,
                blogId,
                null,
            );
        if (!createFileRecord) {
            notice.addError(
                'file record in db not created',
                '',
                InterlayerStatuses.BAD_REQUEST,
            );
            try {
                await this.s3StorageService.deleteFile(key);
            } catch (e) {
                throw new InternalServerErrorException(
                    'error with delete file when in db not created record',
                );
            }
            return notice;
        }

        const blogImagesViewDto =
            await this.s3StorageService.getFilesForBlog(blogId);
        notice.addData(blogImagesViewDto);
        return notice;
    }

    async uploadMainForPost(
        blogId: string,
        postId: string,
        userId: string,
        file: Express.Multer.File,
    ): Promise<InterlayerNotice<PostImagesViewDto>> {
        const notice = new InterlayerNotice<PostImagesViewDto>();

        const blog = await this.blogsRepository.findBlogWithUser(blogId);

        if (!blog) {
            notice.addError(
                '',
                'blog was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        if (blog.user.id !== userId) {
            notice.addError(
                '',
                'user is not owner for blog',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const post = await this.postsRepository.findPost(postId);
        if (!post) {
            notice.addError(
                '',
                'post was not found',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const isPostBelongBlog =
            await this.postsRepository.checkIsPostBelongBlog(blogId, postId);
        if (!isPostBelongBlog) {
            notice.addError(
                '',
                'post is not belong blog',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const fileBufferMiddle = await sharp(file.buffer)
            .resize({
                width: 300,
                height: 180,
                fit: 'inside',
            })
            .toBuffer();

        const fileBufferSmall = await sharp(file.buffer)
            .resize({
                width: 149,
                height: 96,
                fit: 'inside',
            })
            .toBuffer();

        const keyOriginal = this.s3StorageService.getKey(
            userId,
            `${file.originalname}_original`,
            file.mimetype,
            FileTypeEnum.wallpaper,
        );

        const keyMiddle = this.s3StorageService.getKey(
            userId,
            `${file.originalname}_middle`,
            file.mimetype,
            FileTypeEnum.wallpaper,
        );

        const keySmall = this.s3StorageService.getKey(
            userId,
            `${file.originalname}_small`,
            file.mimetype,
            FileTypeEnum.wallpaper,
        );

        const isUploadOriginalPhotoForBlog =
            await this.s3StorageService.uploadObject(
                userId,
                `${file.originalname}_original`,
                file.mimetype,
                file.buffer,
                FileTypeEnum.main,
            );

        const isUploadMiddlePhotoForBlog =
            await this.s3StorageService.uploadObject(
                userId,
                `${file.originalname}_middle`,
                file.mimetype,
                fileBufferMiddle,
                FileTypeEnum.main,
            );
        const isUploadSmallPhotoForBlog =
            await this.s3StorageService.uploadObject(
                userId,
                `${file.originalname}_small`,
                file.mimetype,
                fileBufferSmall,
                FileTypeEnum.main,
            );
        if (
            !isUploadOriginalPhotoForBlog ||
            !isUploadMiddlePhotoForBlog ||
            !isUploadSmallPhotoForBlog
        ) {
            notice.addError(
                'photos were not uploaded',
                '',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }

        const metadataOriginal = await sharp(file.buffer).metadata();
        const createFileRecordOriginal =
            await this.s3StorageService.createRecordAboutFile(
                keyOriginal,
                String(metadataOriginal.size),
                String(metadataOriginal.height),
                String(metadataOriginal.width),
                FileTypeEnum.main,
                null,
                postId,
            );
        const metadataMiddle = await sharp(fileBufferMiddle).metadata();
        const createFileRecordMiddle =
            await this.s3StorageService.createRecordAboutFile(
                keyMiddle,
                String(metadataMiddle.size),
                String(metadataMiddle.height),
                String(metadataMiddle.width),
                FileTypeEnum.main,
                null,
                postId,
            );
        const metadataSmall = await sharp(fileBufferSmall).metadata();
        const createFileRecordSmall =
            await this.s3StorageService.createRecordAboutFile(
                keySmall,
                String(metadataSmall.size),
                String(metadataSmall.height),
                String(metadataSmall.width),
                FileTypeEnum.main,
                null,
                postId,
            );
        if (
            !createFileRecordOriginal ||
            !createFileRecordMiddle ||
            !createFileRecordSmall
        ) {
            notice.addError(
                'file records in db not created',
                '',
                InterlayerStatuses.BAD_REQUEST,
            );
            try {
                await this.s3StorageService.deleteFile(keyOriginal);
                await this.s3StorageService.deleteFile(keyMiddle);
                await this.s3StorageService.deleteFile(keySmall);
            } catch (e) {
                throw new InternalServerErrorException(
                    'error with delete file when in db not created record',
                );
            }
            return notice;
        }

        const postImagesViewDto =
            await this.s3StorageService.getFilesForPost(postId);
        notice.addData(postImagesViewDto);
        return notice;
    }

    async validateImageSize(
        buffer: Buffer,
        maxWidth: number,
        maxHeight: number,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const metadata = await sharp(buffer).metadata();

        // Проверяем, существует ли ширина и высота
        if (!metadata.width || !metadata.height) {
            console.error('Image metadata does not contain width or height');

            notice.addError(
                'Image metadata does not contain width or height',
                '',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        if (metadata.width > maxWidth || metadata.height > maxHeight) {
            console.log(
                `Image size validation failed: ${metadata.width}x${metadata.height}`,
            );
            notice.addError(
                `Image size validation failed: ${metadata.width}x${metadata.height}`,
                '',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        return notice;
    }
}
