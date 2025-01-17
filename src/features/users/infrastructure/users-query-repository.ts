import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, MoreThan } from 'typeorm';
import { User } from '../domain/user-entity';
import { BanStatus, QueryDtoWithBan } from '../../../common/dto/query-dto';
import { UserViewDto } from '../api/dto/output/user-view-dto';
import { toUserViewDtoMapper } from '../../../base/mappers/user-view-mapper';

@Injectable()
export class UsersQueryRepository {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    async findUserByEmail(email: string): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);

        return userRepository.findOne({
            where: {
                email: email,
                isBanned: false,
                isDeleted: false,
            },
        });
    }

    async findUserByConfirmationCode(confirmationCode: string): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);

        return userRepository.findOne({
            where: {
                confirmationCode: confirmationCode,
                isDeleted: false,
                confirmationCodeExpireDate: MoreThan(new Date()),
            },
        });
    }

    async findUserById(userId: string): Promise<UserViewDto | null> {
        const userRepository = this.dataSource.getRepository(User);

        const user = await userRepository.findOne({
            where: {
                id: userId,
                isDeleted: false,
                isBanned: false,
            },
        });
        return user ? toUserViewDtoMapper(user) : null;
    }

    async findUserByLogin(login: string): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);

        return userRepository.findOne({
            where: {
                login: login,
                isBanned: false,
                isDeleted: false,
            },
        });
    }

    async findUsers(query: QueryDtoWithBan): Promise<UserViewDto[]> {
        const userRepository = this.dataSource.getRepository(User);

        let emailTerm =
            query.searchEmailTerm === null
                ? ''
                : `%${query.searchEmailTerm.toLowerCase()}%`;
        let loginTerm =
            query.searchLoginTerm === null
                ? ''
                : `%${query.searchLoginTerm.toLowerCase()}%`;

        if (emailTerm === '' && loginTerm === '') {
            emailTerm = '%%';
            loginTerm = '%%';
        }

        const dbQuery = userRepository
            .createQueryBuilder('u')
            .where(
                'u.isDeleted = :isDeleted and u.isConfirmed = :isConfirmed',
                {
                    isDeleted: false,
                    isConfirmed: true,
                },
            )
            .andWhere(
                '(LOWER(u.email) like :emailTerm or LOWER(u.login) like :loginTerm)',
                {
                    emailTerm,
                    loginTerm,
                },
            )
            .orderBy(`"${query.sortBy}"`, query.sortDirection)
            .take(query.pageSize)
            .skip((query.pageNumber - 1) * query.pageSize);

        if (query.banStatus !== BanStatus.all) {
            dbQuery.andWhere('u.isBanned = :isBanned', {
                isBanned: query.banStatus === BanStatus.banned,
            });
        }
        const users = await dbQuery.getMany();
        return users.map((i) => {
            return toUserViewDtoMapper(i);
        });
    }

    async getCountUsers(
        emailTerm: string,
        loginTerm: string,
        banStatus: BanStatus,
    ): Promise<number> {
        const userRepository = this.dataSource.getRepository(User);

        emailTerm = emailTerm === null ? '' : `%${emailTerm.toLowerCase()}%`;
        loginTerm = loginTerm === null ? '' : `%${loginTerm.toLowerCase()}%`;

        if (emailTerm === '' && loginTerm === '') {
            emailTerm = '%%';
            loginTerm = '%%';
        }

        const dbQuery = userRepository
            .createQueryBuilder('u')
            .where(
                'u.isDeleted = :isDeleted and u.isConfirmed = :isConfirmed',
                {
                    isDeleted: false,
                    isConfirmed: true,
                },
            )
            .andWhere(
                '(LOWER(u.email) like :emailTerm or LOWER(u.login) like :loginTerm)',
                {
                    emailTerm,
                    loginTerm,
                },
            );

        if (banStatus !== BanStatus.all) {
            dbQuery.andWhere('u.isBanned = :isBanned', {
                isBanned: banStatus === BanStatus.banned,
            });
        }

        return dbQuery.getCount();
    }
}
