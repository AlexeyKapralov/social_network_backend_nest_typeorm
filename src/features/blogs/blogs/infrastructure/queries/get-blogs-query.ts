import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogViewDto } from '../../api/dto/output/blog-view-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../../domain/blog-entity';
import { Like, Repository } from 'typeorm';
import { InterlayerNotice } from '../../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../../common/dto/paginator-dto';
import { QueryDtoWithName } from '../../../../../common/dto/query-dto';
import { blogViewDtoMapper } from '../../../../../base/mappers/blog-view-mapper';

export class GetBlogsPayload implements IQuery {
    constructor(public query: QueryDtoWithName) {}
}

@QueryHandler(GetBlogsPayload)
export class GetBlogsQuery
    implements
        IQueryHandler<
            GetBlogsPayload,
            InterlayerNotice<PaginatorDto<BlogViewDto>>
        >
{
    constructor(@InjectRepository(Blog) private blogRepo: Repository<Blog>) {}

    async execute(
        queryPayload: GetBlogsPayload,
    ): Promise<InterlayerNotice<PaginatorDto<BlogViewDto>>> {
        const notice = new InterlayerNotice<PaginatorDto<BlogViewDto>>();

        queryPayload.query.searchNameTerm === null
            ? (queryPayload.query.searchNameTerm = '%%')
            : (queryPayload.query.searchNameTerm = `%${queryPayload.query.searchNameTerm}%`);

        let countBlogs = 0;
        countBlogs = await this.blogRepo.count({
            where: {
                name: Like(queryPayload.query.searchNameTerm),
            },
        });

        const blogs = await this.blogRepo.find({
            where: {
                name: Like(queryPayload.query.searchNameTerm),
            },
            order: {
                [queryPayload.query.sortBy]: queryPayload.query.sortDirection,
            },
            take: queryPayload.query.pageSize,
            skip:
                (queryPayload.query.pageNumber - 1) *
                queryPayload.query.pageSize,
        });

        const blogsPaginator: PaginatorDto<BlogViewDto> = {
            pagesCount: Math.ceil(countBlogs / queryPayload.query.pageSize),
            page: queryPayload.query.pageNumber,
            pageSize: queryPayload.query.pageSize,
            totalCount: countBlogs,
            items: blogs.map((c) => blogViewDtoMapper(c)),
        };

        notice.addData(blogsPaginator);

        return notice;
    }
}
