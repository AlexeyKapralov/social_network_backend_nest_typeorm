export class BlogWithBanInfoViewDto {
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    createdAt: string;
    isMembership: boolean;
    banInfo: {
        isBanned: boolean;
        banDate: Date;
    };
}
