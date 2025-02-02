import { Injectable } from '@nestjs/common';
import {
    PutObjectCommand,
    PutObjectCommandOutput,
    S3Client,
} from '@aws-sdk/client-s3';
import { ConfigurationType } from '../../settings/env/configuration';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3StorageAdapter {
    s3Client: S3Client;

    constructor(
        private readonly configService: ConfigService<ConfigurationType>,
    ) {
        const apiSettings = this.configService.get('apiSettings', {
            infer: true,
        });
        const REGION = 'eu-north-1';
        this.s3Client = new S3Client({
            region: REGION,
            endpoint: apiSettings.YANDEX_S3_ENDPOINT,
            credentials: {
                secretAccessKey: apiSettings.YANDEX_S3_SECRET_KEY,
                accessKeyId: apiSettings.YANDEX_S3_KEY_ID,
            },
        });
    }

    async saveImage(
        userId: string,
        originalName: string,
        mimetype: string,
        buffer: Buffer,
        type: string,
        postId?: number,
    ) {
        if (!['image/png', 'image/jpeg'].includes(mimetype)) {
            throw new Error(
                'Unsupported file type. Only PNG and JPEG are allowed.',
            );
        }
        const apiSettings = this.configService.get('apiSettings', {
            infer: true,
        });

        const extension = mimetype.split('/')[1];
        const key = postId
            ? `social_network/users/${userId}/${type}/${postId}/${Date.now()}${userId}_image.${extension}`
            : `social_network/users/${userId}/${type}/${Date.now()}${userId}_image.${extension}`;
        const bucketParams = {
            Bucket: apiSettings.YANDEX_S3_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimetype,
        };

        const command = new PutObjectCommand(bucketParams);
        try {
            const uploadResult: PutObjectCommandOutput =
                await this.s3Client.send(command);
            console.log('uploadResult = ', uploadResult);
            return {
                url: key,
                fileId: uploadResult.ETag,
            };
        } catch (err) {
            console.error('Error uploading avatar:', err);
            throw err;
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

    // async deleteAvatar(userId: number) {
    //     const currentUserInfo =
    //         await this.userRepository.foundProfileFromUserId(userId);
    //     if (!currentUserInfo) {
    //         return false;
    //     }
    //     console.log('currentUserInfo = ', currentUserInfo);
    //
    //     const bucketParams = {
    //         Bucket: Configuration.getConfiguration().YANDEX_S3_BUCKET_NAME,
    //         Key: currentUserInfo.avatarId,
    //     };
    //
    //     const command = new DeleteObjectCommand(bucketParams);
    //
    //     try {
    //         const data = await this.s3Client.send(command);
    //         console.log(data);
    //         return data;
    //     } catch (exeption) {
    //         console.error('Exeption', exeption);
    //         throw exeption;
    //     }
    // }
}
