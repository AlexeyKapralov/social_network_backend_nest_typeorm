import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../domain/blog-entity';
import { DataSource, Repository } from 'typeorm';
import { BlogViewDto } from '../api/dto/output/blog-view-dto';
import { blogViewDtoMapper } from '../../../../base/mappers/blog-view-mapper';
import { BlogBlacklist } from '../domain/blog-blacklist-entity';
import { File } from '../../../files/domain/s3-storage.entity';
import { S3StorageService } from '../../../files/application/s3-storage.service';

@Injectable()
export class BlogsQueryRepository {
    constructor(
        @InjectRepository(Blog) private readonly blogRepo: Repository<Blog>,
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly s3StorageService: S3StorageService,
    ) {}

    async findBlog(blogId: string): Promise<BlogViewDto | null> {
        const blog = await this.blogRepo
            .createQueryBuilder('b')
            .leftJoin(BlogBlacklist, 'bb', 'bb."blogId" = b.id')
            .leftJoinAndSelect('b.user', 'u')
            .where('bb.id is null')
            .andWhere('b.id = :id', {
                id: blogId,
            })
            .andWhere('u."isBanned" = :isBanned', { isBanned: false })
            .getOne();
        if (!blog) {
            return null;
        }

        const files: Pick<
            File,
            'fileKey' | 'fileSize' | 'height' | 'width' | 'typeFile'
        >[] = await this.dataSource.query(
            `
            SELECT f."fileKey", f."fileSize", f.height, f.width, f."typeFile" 
            FROM public.file f
            WHERE f."blogId" = $1
        `,
            [blog.id],
        );

        for (const key of files) {
            key.fileKey = await this.s3StorageService.getPreSignedUrl(
                key.fileKey,
            );
        }

        return blogViewDtoMapper(blog, files);
    }
}
