import { Blog } from '../../features/blogs/blogs/domain/blog-entity';
import { BlogWithBanInfoAndUserInfoViewDto } from '../../features/blogs/blogs/api/dto/output/blog-with-ban-info-and-user-info-view-dto';

export const blogWithBanInfoAndUserInfoViewDto = (
    blog: Blog,
): BlogWithBanInfoAndUserInfoViewDto => {
    return {
        id: blog.id,
        name: blog.name,
        createdAt: blog.createdAt.toISOString(),
        description: blog.description,
        isMembership: blog.isMembership,
        websiteUrl: blog.websiteUrl,
        blogOwnerInfo: {
            userId: blog.user?.id || null,
            userLogin: blog.user?.login || null,
        },
        banInfo: {
            isBanned: !!blog.blogBlacklist[0]?.id,
            banDate: blog.blogBlacklist[0]?.banDate
                ? blog.blogBlacklist[0]?.banDate
                : null,
        },
    };
};
