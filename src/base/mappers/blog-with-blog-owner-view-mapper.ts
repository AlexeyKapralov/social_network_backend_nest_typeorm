import { Blog } from '../../features/blogs/blogs/domain/blog-entity';
import { BlogWithOwnerViewDto } from '../../features/blogs/blogs/api/dto/output/blog-with-owner-view-dto';

export const blogWithOwnerViewDtoMapper = (
    blog: Blog,
): BlogWithOwnerViewDto => {
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
    };
};
