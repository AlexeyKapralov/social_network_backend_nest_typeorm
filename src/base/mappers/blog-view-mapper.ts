import { Blog } from '../../features/blogs/blogs/domain/blog-entity';
import { BlogViewDto } from '../../features/blogs/blogs/api/dto/output/blog-view-dto';

export const blogViewDtoMapper = (blog: Blog): BlogViewDto => {
    return {
        id: blog.id,
        name: blog.name,
        createdAt: blog.createdAt.toISOString(),
        description: blog.description,
        isMembership: blog.isMembership,
        websiteUrl: blog.websiteUrl,
    };
};
