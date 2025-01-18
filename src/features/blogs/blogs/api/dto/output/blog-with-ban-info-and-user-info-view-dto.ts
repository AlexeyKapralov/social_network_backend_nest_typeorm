export class BlogWithBanInfoAndUserInfoViewDto {
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    createdAt: string;
    isMembership: boolean;
    blogOwnerInfo: {
        userId: string;
        userLogin: string;
    };
    banInfo: {
        isBanned: boolean;
        banDate: Date;
    };
}
