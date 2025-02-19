import { BanUserInfoViewDto } from './ban-user-info-view.dto';

export class UserViewDto {
    id: string;
    login: string;
    email: string;
    createdAt: Date;
    banInfo: BanUserInfoViewDto;
}

export class BannedUserViewDto {
    id: string;
    login: string;
    banInfo: BanUserInfoViewDto;
}
