import {
    LikeDetailsViewDto,
    LikeStatus,
} from '../../../../likes/api/dto/output/likes-view.dto';
import { PostImagesViewDto } from '../../../../blogs/api/dto/output/post-images-view.dto';

export type PostsViewDto = {
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    createdAt: string;
    extendedLikesInfo: ExtendedLikesInfoViewDto;
    images: PostImagesViewDto;
};

export type ExtendedLikesInfoViewDto = {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
    newestLikes: LikeDetailsViewDto[];
};
