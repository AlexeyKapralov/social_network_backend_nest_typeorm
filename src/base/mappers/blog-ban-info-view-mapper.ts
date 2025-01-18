import { Blog } from '../../features/blogs/blogs/domain/blog-entity';
import { BlogWithBanInfoViewDto } from '../../features/blogs/blogs/api/dto/output/blog-with-ban-info-view-dto';

export const blogBanInfoViewMapper = (blog: Blog): BlogWithBanInfoViewDto => {
    return {
        id: blog.id,
        name: blog.name,
        createdAt: blog.createdAt.toISOString(),
        description: blog.description,
        isMembership: blog.isMembership,
        websiteUrl: blog.websiteUrl,
        banInfo: {
            isBanned: !!blog.blogBlacklist[0]?.id,
            banDate: blog.blogBlacklist[0]?.banDate
                ? blog.blogBlacklist[0]?.banDate
                : null,
        },
    };
};
