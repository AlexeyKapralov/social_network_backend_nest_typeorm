import { ExtendedLikesInfoViewDto } from '../../../../posts/api/dto/output/extended-likes-info-view.dto';

export type CommentsViewDto = {
    id: string;
    content: string;
    commentatorInfo: CommentatorInfo;
    createdAt: string;
    likesInfo: LikesInfoViewDto;
};

type CommentatorInfo = {
    userId: string;
    userLogin: string;
};
type LikesInfoViewDto = Omit<ExtendedLikesInfoViewDto, 'newestLikes'>;
