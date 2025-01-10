import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogViewDto } from '../../api/dto/output/blog-view-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../../domain/blog-entity';
import { ILike, Repository } from 'typeorm';
import { InterlayerNotice } from '../../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../../common/dto/paginator-dto';
import { QueryDtoWithName } from '../../../../../common/dto/query-dto';
import { blogViewDtoMapper } from '../../../../../base/mappers/blog-view-mapper';

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
                },
            },
        });

        const blogs = await this.blogRepo.find({
            where: {
                name: ILike(queryPayload.query.searchNameTerm),
                user: {
                    id: queryPayload.userId,
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

        console.log('blogs', blogs);

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
