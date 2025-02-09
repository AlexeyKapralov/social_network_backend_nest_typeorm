import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { File } from '../domain/s3-storage.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class S3StorageRepository {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(File) private readonly fileRepo: Repository<File>,
    ) {}

    async getFile(key: string) {
        return await this.fileRepo.findOne({
            where: { fileKey: key, deletedDate: null },
        });
    }

    async createRecordAboutFile(
        key: string,
        fileSize: string,
        height: string,
        width: string,
        typeFile: string,
        blogId: string = null,
        postId: string = null,
    ): Promise<File> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            //создать игру
            const file = this.fileRepo.create({
                fileSize: fileSize,
                height: height,
                width: width,
                typeFile: typeFile,
                blogId: blogId,
                postId: postId,
                fileKey: key,
                createdAt: new Date(),
                deletedDate: null,
            });
            await file.save();
            await queryRunner.commitTransaction();
            //вернуть игру
            return file;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async getFilesInfo(blogId: string = null, postId: string = null) {
        return await this.fileRepo.find({
            where: {
                postId: postId,
                blogId: blogId,
                deletedDate: null,
            },
        });
    }
}
