import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './domain/s3-storage.entity';
import { S3StorageRepository } from './repository/s3-storage.repository';
import { S3StorageService } from './application/s3-storage.service';

@Module({
    imports: [TypeOrmModule.forFeature([File])],
    controllers: [],
    providers: [S3StorageRepository, S3StorageService],
    exports: [S3StorageService],
})
export class S3StorageModule {}
