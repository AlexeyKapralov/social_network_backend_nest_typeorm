import { Blog } from '../../features/blogs/blogs/domain/blog-entity';
import { BlogViewDto } from '../../features/blogs/blogs/api/dto/output/blog-view-dto';
import { Comment } from '../../features/blogs/comments/domain/comment.entity';
import { CommentsViewDto } from '../../features/blogs/comments/api/dto/output/comment-view.dto';

// export const blogViewDtoMapper = (blog: Comment): CommentsViewDto => {
//     return {
//         id: blog.id,
//         name: blog.name,
//         createdAt: blog.createdAt.toISOString(),
//         description: blog.description,
//         isMembership: blog.isMembership,
//         websiteUrl: blog.websiteUrl,
//     };
// };
