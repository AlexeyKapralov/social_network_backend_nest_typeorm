import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogViewDto } from '../../api/dto/output/blog-view-dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../../domain/blog-entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { InterlayerNotice } from '../../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../../common/dto/paginator-dto';
import { QueryDtoWithName } from '../../../../../common/dto/query-dto';
import { blogViewDtoMapper } from '../../../../../base/mappers/blog-view-mapper';
import { File } from '../../../../files/domain/s3-storage.entity';
import { S3StorageService } from '../../../../files/application/s3-storage.service';

export class GetBlogsForUserPayload implements IQuery {
    constructor(
        public query: QueryDtoWithName,
        public userId: string,
    ) {}
}

@QueryHandler(GetBlogsForUserPayload)
export class GetBlogsForUserQuery
    implements
        IQueryHandler<
            GetBlogsForUserPayload,
            InterlayerNotice<PaginatorDto<BlogViewDto>>
        >
{
    constructor(
        @InjectRepository(Blog) private readonly blogRepo: Repository<Blog>,
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly s3StorageService: S3StorageService,
    ) {}

    async execute(
        queryPayload: GetBlogsForUserPayload,
    ): Promise<InterlayerNotice<PaginatorDto<BlogViewDto>>> {
        const notice = new InterlayerNotice<PaginatorDto<BlogViewDto>>();

        if (queryPayload.query.searchNameTerm === null) {
            queryPayload.query.searchNameTerm = '%%';
        } else {
            queryPayload.query.searchNameTerm = `%${queryPayload.query.searchNameTerm}%`;
        }

        let countBlogs = await this.blogRepo.count({
            where: {
                name: ILike(queryPayload.query.searchNameTerm),
                user: {
                    id: queryPayload.userId,
                    isBanned: false,
                },
            },
        });

        const blogs = await this.blogRepo.find({
            where: {
                name: ILike(queryPayload.query.searchNameTerm),
                user: {
                    id: queryPayload.userId,
                    isBanned: false,
                },
            },
            relations: {
                user: true,
            },
            order: {
                [queryPayload.query.sortBy]: queryPayload.query.sortDirection,
            },
            take: queryPayload.query.pageSize,
            skip:
                (queryPayload.query.pageNumber - 1) *
                queryPayload.query.pageSize,
        });

        const blogsForFilter = blogs.map((blog) => `'${blog.id}'`).join(',');

        let files: Pick<
            File,
            'fileKey' | 'fileSize' | 'height' | 'width' | 'typeFile' | 'blogId'
        >[] = [];
        if (blogs.length) {
            files = await this.dataSource.query(`
                SELECT f."fileKey", f."fileSize", f.height, f.width, f."typeFile", f."blogId" 
                FROM public.file f
                WHERE f."blogId" IN (${blogsForFilter}) AND f."deletedDate" IS NULL
            `);

            for (const key of files) {
                key.fileKey = await this.s3StorageService.getPreSignedUrl(
                    key.fileKey,
                );
            }
        }

        const blogsPaginator: PaginatorDto<BlogViewDto> = {
            pagesCount: Math.ceil(countBlogs / queryPayload.query.pageSize),
            page: queryPayload.query.pageNumber,
            pageSize: queryPayload.query.pageSize,
            totalCount: countBlogs,
            items: blogs.map((c) => blogViewDtoMapper(c, files)),
        };

        notice.addData(blogsPaginator);

        return notice;
    }
}
