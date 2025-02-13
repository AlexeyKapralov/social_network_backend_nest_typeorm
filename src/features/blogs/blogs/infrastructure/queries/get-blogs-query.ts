import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogViewDto } from '../../api/dto/output/blog-view-dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../../domain/blog-entity';
import { DataSource, Repository } from 'typeorm';
import { InterlayerNotice } from '../../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../../common/dto/paginator-dto';
import {
    QueryDtoForBlogs,
    SortFieldForBlogs,
} from '../../../../../common/dto/query-dto';
import { BlogBlacklist } from '../../domain/blog-blacklist-entity';
import { blogViewDtoMapper } from '../../../../../base/mappers/blog-view-mapper';
import { File } from '../../../../files/domain/s3-storage.entity';
import { S3StorageService } from '../../../../files/application/s3-storage.service';

export class GetBlogsPayload implements IQuery {
    constructor(public query: QueryDtoForBlogs) {}
}

@QueryHandler(GetBlogsPayload)
export class GetBlogsQuery
    implements
        IQueryHandler<
            GetBlogsPayload,
            InterlayerNotice<PaginatorDto<BlogViewDto>>
        >
{
    constructor(
        @InjectRepository(Blog) private readonly blogRepo: Repository<Blog>,
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly s3StorageService: S3StorageService,
    ) {}

    async execute(
        queryPayload: GetBlogsPayload,
    ): Promise<InterlayerNotice<PaginatorDto<BlogViewDto>>> {
        const notice = new InterlayerNotice<PaginatorDto<BlogViewDto>>();

        if (queryPayload.query.searchNameTerm === null) {
            queryPayload.query.searchNameTerm = '%%';
        } else {
            queryPayload.query.searchNameTerm = `%${queryPayload.query.searchNameTerm}%`;
        }

        //определение поля для сортировки
        let sort: string = `b.${SortFieldForBlogs.createdAt}`;
        switch (queryPayload.query.sortBy) {
            case SortFieldForBlogs.id: {
                sort = 'b.id';
                break;
            }
            case SortFieldForBlogs.name: {
                sort = 'b.name';
                break;
            }
            case SortFieldForBlogs.description: {
                sort = 'b.description';
                break;
            }
            case SortFieldForBlogs.isMembership: {
                sort = 'b."isMembership"';
                break;
            }
            case SortFieldForBlogs.websiteUrl: {
                sort = 'b."websiteUrl"';
                break;
            }
        }

        const countBlogs = await this.blogRepo
            .createQueryBuilder('b')
            .leftJoin(BlogBlacklist, 'bb', 'bb."blogId" = b.id')
            .leftJoin('b.user', 'u')
            .where('bb.id is null')
            .andWhere('lower(b.name) like lower(:name)', {
                name: queryPayload.query.searchNameTerm,
            })
            .andWhere('u."isBanned" = :isBanned', { isBanned: false })
            .select('b.*')
            .getCount();

        const blogs = await this.blogRepo
            .createQueryBuilder('b')
            .leftJoin(BlogBlacklist, 'bb', 'bb."blogId" = b.id')
            .leftJoinAndSelect('b.user', 'u')
            .where('bb.id is null')
            .andWhere('lower(b.name) like lower(:name)', {
                name: queryPayload.query.searchNameTerm,
            })
            .andWhere('u."isBanned" = :isBanned', { isBanned: false })
            .orderBy(sort, queryPayload.query.sortDirection)
            .limit(queryPayload.query.pageSize)
            .offset(
                (queryPayload.query.pageNumber - 1) *
                    queryPayload.query.pageSize,
            )
            .getMany();

        const blogsForFilter = blogs.map((blog) => `'${blog.id}'`).join(',');

        const files: Pick<
            File,
            'fileKey' | 'fileSize' | 'height' | 'width' | 'typeFile' | 'blogId'
        >[] = await this.dataSource.query(`
            SELECT f."fileKey", f."fileSize", f.height, f.width, f."typeFile", f."blogId" 
            FROM public.file f
            WHERE f."blogId" IN (${blogsForFilter}) AND f."deletedDate" IS NULL
        `);

        for (const key of files) {
            key.fileKey = await this.s3StorageService.getPreSignedUrl(
                key.fileKey,
            );
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
