import { User } from '../../features/users/domain/user-entity';
import { MeViewDto } from '../../features/auth/auth/api/dto/output/me-view-dto';
import { UserViewDto } from '../../features/users/api/dto/output/user-view-dto';

export const toUserViewDtoMapper = (user: User): UserViewDto => {
    return {
        email: user.email,
        createdAt: user.createdAt,
        id: user.id,
        login: user.login,
    };
};
