import { User } from '../../features/users/domain/user-entity';
import { BannedUserViewDto } from '../../features/users/api/dto/output/user-view-dto';

export const toBannedUserViewDtoMapper = (user: User): BannedUserViewDto => {
    return {
        id: user.id,
        login: user.login,
        banInfo: {
            isBanned: user.isBanned,
            banReason: user.banReason,
            banDate: user.banDate,
        },
    };
};
