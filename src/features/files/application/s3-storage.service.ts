import { Injectable } from '@nestjs/common';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    GetObjectCommandInput,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { ConfigurationType } from '../../../settings/env/configuration';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3StorageRepository } from '../repository/s3-storage.repository';
import { BlogImagesViewDto } from '../../blogs/blogs/api/dto/output/blog-images-view.dto';
import { FileTypeEnum } from '../api/enum/file-type.enum';
import { PostImagesViewDto } from '../../blogs/blogs/api/dto/output/post-images-view.dto';

@Injectable()
export class S3StorageService {
    s3Client: S3Client;

    constructor(
        private readonly configService: ConfigService<ConfigurationType>,
        private readonly s3StorageRepository: S3StorageRepository,
    ) {
        const apiSettings = this.configService.get('apiSettings', {
            infer: true,
        });
        const REGION = 'ru-central1';
        this.s3Client = new S3Client({
            region: REGION,
            endpoint: apiSettings.YANDEX_S3_ENDPOINT,
            credentials: {
                secretAccessKey: apiSettings.YANDEX_S3_SECRET_KEY,
                accessKeyId: apiSettings.YANDEX_S3_KEY_ID,
            },
        });
    }

    getKey(
        userId: string,
        originalName: string,
        mimetype: string,
        type: FileTypeEnum,
    ) {
        const extension = mimetype.split('/')[1];

        if (type === FileTypeEnum.wallpaper) {
            return `social_network/users/${userId}/${type}/${originalName}_image.${extension}`;
        } else if (type === FileTypeEnum.main) {
            return `social_network/users/${userId}/${type}/${Date.now()}_${originalName}_image.${extension}`;
        }
    }

    async getFile(key: string) {
        return await this.s3StorageRepository.getFile(key);
    }

    async uploadObject(
        userId: string,
        originalName: string,
        mimetype: string,
        buffer: Buffer,
        type: FileTypeEnum,
    ) {
        if (!['image/png', 'image/jpeg'].includes(mimetype)) {
            throw new Error(
                'Unsupported file type. Only PNG and JPEG are allowed.',
            );
        }
        const apiSettings = this.configService.get('apiSettings', {
            infer: true,
        });

        const key = this.getKey(userId, originalName, mimetype, type);

        const bucketParams = {
            Bucket: apiSettings.YANDEX_S3_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimetype,
        };

        const command = new PutObjectCommand(bucketParams);
        try {
            await this.s3Client.send(command);

            const preSignedKey = await this.getPreSignedUrl(key);
            if (!preSignedKey) {
                return null;
            }

            return {
                url: preSignedKey,
                key: key,
            };
        } catch (err) {
            console.error('Error uploading file:', err);
            return null;
        }
    }

    async createRecordAboutFile(
        key: string,
        fileSize: string,
        height: string,
        width: string,
        typeFile: string,
        blogId: string,
        postId: string,
    ) {
        return await this.s3StorageRepository.createRecordAboutFile(
            key,
            fileSize,
            height,
            width,
            typeFile,
            blogId,
            postId,
        );
    }

    async getPreSignedUrl(key: string) {
        const apiSettings = this.configService.get('apiSettings', {
            infer: true,
        });

        const bucketParams: GetObjectCommandInput = {
            Bucket: apiSettings.YANDEX_S3_BUCKET_NAME,
            Key: key,
        };

        const command = new GetObjectCommand(bucketParams);
        try {
            const url = await getSignedUrl(this.s3Client, command, {
                expiresIn: 20, //20 секунд жить будет
            });

            console.log('url is receiving', url);
            return url;
        } catch (err) {
            console.error('Error getting pre-signed url:', err);
            return null;
        }
    }

    // async deleteImages(imagePath: string) {
    //     console.log('imagePath = ', imagePath);
    //     const bucketParams = {
    //         Bucket: Configuration.getConfiguration().YANDEX_S3_BUCKET_NAME,
    //         Key: imagePath,
    //     };
    //
    //     const command = new DeleteObjectCommand(bucketParams);
    //
    //     try {
    //         const data = await this.s3Client.send(command);
    //         return data;
    //     } catch (exeption) {
    //         console.error('Exeption', exeption);
    //         throw exeption;
    //     }
    // }

    async deleteFile(key: string) {
        const apiSettings = this.configService.get('apiSettings', {
            infer: true,
        });

        const bucketParams = {
            Bucket: apiSettings.YANDEX_S3_BUCKET_NAME,
            Key: key,
        };

        const command = new DeleteObjectCommand(bucketParams);

        try {
            const data = await this.s3Client.send(command);
            console.log(data);
            return data;
        } catch (exeption) {
            console.error('Exeption', exeption);
            throw exeption;
        }
    }

    async getFilesForBlog(blogId: string): Promise<BlogImagesViewDto | null> {
        const files = await this.s3StorageRepository.getFilesInfo(blogId, null);
        if (!files.length) {
            return null;
        }

        const filesMapped: BlogImagesViewDto = {} as BlogImagesViewDto;
        filesMapped.main = [];
        for (const i of files) {
            const url = await this.getPreSignedUrl(i.fileKey);

            if (i.typeFile === FileTypeEnum.wallpaper) {
                filesMapped[`${FileTypeEnum.wallpaper}`] = {
                    fileSize: Number(i.fileSize),
                    url: url,
                    height: Number(i.height),
                    width: Number(i.width),
                };
            } else if (i.typeFile === FileTypeEnum.main) {
                const arrItem = {
                    fileSize: Number(i.fileSize),
                    url: url,
                    height: Number(i.height),
                    width: Number(i.width),
                };
                filesMapped.main.push(arrItem);
            }
        }

        return filesMapped;
    }

    async getFilesForPost(postId: string): Promise<PostImagesViewDto | null> {
        const files = await this.s3StorageRepository.getFilesInfo(null, postId);
        if (!files.length) {
            return null;
        }

        const filesMapped: PostImagesViewDto = {} as PostImagesViewDto;
        filesMapped.main = [];
        for (const i of files) {
            const url = await this.getPreSignedUrl(i.fileKey);

            if (i.typeFile === FileTypeEnum.main) {
                const arrItem = {
                    fileSize: Number(i.fileSize),
                    url: url,
                    height: Number(i.height),
                    width: Number(i.width),
                };
                filesMapped.main.push(arrItem);
            }
        }

        return filesMapped;
    }
}
