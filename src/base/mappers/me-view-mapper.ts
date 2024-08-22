import { User } from '../../features/users/domain/user-entity';
import { MeViewDto } from '../../features/auth/auth/api/dto/output/me-view-dto';

export const toMeViewDtoMapper = (user: User): MeViewDto => {
    return {
        email: user.email,
        userId: user.id,
        login: user.login,
    };
};
