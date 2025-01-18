import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../../domain/blog-entity';
import { Repository } from 'typeorm';
import { InterlayerNotice } from '../../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../../common/dto/paginator-dto';
import { QueryDtoForBlogs } from '../../../../../common/dto/query-dto';
import { BlogBlacklist } from '../../domain/blog-blacklist-entity';
import { BlogWithBanInfoAndUserInfoViewDto } from '../../api/dto/output/blog-with-ban-info-and-user-info-view-dto';
import { blogWithBanInfoAndUserInfoViewDto } from '../../../../../base/mappers/blog-with-blog-owner-and-ban-info-view-mapper';

export class GetBlogsForAdminPayload implements IQuery {
    constructor(public query: QueryDtoForBlogs) {}
}

@QueryHandler(GetBlogsForAdminPayload)
export class GetBlogsForAdminQuery
    implements
        IQueryHandler<
            GetBlogsForAdminPayload,
            InterlayerNotice<PaginatorDto<BlogWithBanInfoAndUserInfoViewDto>>
        >
{
    constructor(
        @InjectRepository(Blog) private readonly blogRepo: Repository<Blog>,
    ) {}

    async execute(
        queryPayload: GetBlogsForAdminPayload,
    ): Promise<
        InterlayerNotice<PaginatorDto<BlogWithBanInfoAndUserInfoViewDto>>
    > {
        const notice = new InterlayerNotice<
            PaginatorDto<BlogWithBanInfoAndUserInfoViewDto>
        >();

        if (queryPayload.query.searchNameTerm === null) {
            queryPayload.query.searchNameTerm = '%%';
        } else {
            queryPayload.query.searchNameTerm = `%${queryPayload.query.searchNameTerm}%`;
        }

        const countBlogs = await this.blogRepo
            .createQueryBuilder('b')
            .leftJoin(BlogBlacklist, 'bb', 'bb."blogId" = b.id')
            .leftJoin('b.user', 'u')
            .andWhere('lower(b.name) like lower(:name)', {
                name: queryPayload.query.searchNameTerm,
            })
            .select('b.*')
            .getCount();

        const blogs = await this.blogRepo
            .createQueryBuilder('b')
            .leftJoinAndSelect('b.blogBlacklist', 'bb')
            .leftJoinAndSelect('b.user', 'u')
            .andWhere('lower(b.name) like lower(:name)', {
                name: queryPayload.query.searchNameTerm,
            })
            .orderBy(
                `b."${queryPayload.query.sortBy}"`,
                queryPayload.query.sortDirection,
            )
            .limit(queryPayload.query.pageSize)
            .offset(
                (queryPayload.query.pageNumber - 1) *
                    queryPayload.query.pageSize,
            )
            .getMany();

        console.log('blogsaaaa', blogs);
        const blogsPaginator: PaginatorDto<BlogWithBanInfoAndUserInfoViewDto> =
            {
                pagesCount: Math.ceil(countBlogs / queryPayload.query.pageSize),
                page: queryPayload.query.pageNumber,
                pageSize: queryPayload.query.pageSize,
                totalCount: countBlogs,
                items: blogs.map((c) => blogWithBanInfoAndUserInfoViewDto(c)),
            };

        notice.addData(blogsPaginator);

        return notice;
    }
}
