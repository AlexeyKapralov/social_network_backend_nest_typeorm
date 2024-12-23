import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, MoreThan } from 'typeorm';
import { User } from '../domain/user-entity';
import { QueryDtoWithEmailLogin } from '../../../common/dto/query-dto';
import { UserViewDto } from '../api/dto/output/user-view-dto';
import { toUserViewDtoMapper } from '../../../base/mappers/user-view-mapper';

@Injectable()
export class UsersQueryRepository {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    async findUserByEmail(email: string): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);

        return await userRepository.findOne({
            where: {
                email: email,
                isDeleted: false,
            },
        });
    }

    async findUserByConfirmationCode(confirmationCode: string): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);

        return await userRepository.findOne({
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
            },
        });
        return user ? toUserViewDtoMapper(user) : null;
    }

    async findUserByLogin(login: string): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);

        return await userRepository.findOne({
            where: {
                login: login,
                isDeleted: false,
            },
        });
    }

    async findUsers(query: QueryDtoWithEmailLogin): Promise<User[]> {
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
        return await userRepository
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
            .skip((query.pageNumber - 1) * query.pageSize)
            .getMany();
    }

    async getCountUsers(emailTerm: string, loginTerm: string): Promise<number> {
        const userRepository = this.dataSource.getRepository(User);

        emailTerm = emailTerm === null ? '' : `%${emailTerm.toLowerCase()}%`;
        loginTerm = loginTerm === null ? '' : `%${loginTerm.toLowerCase()}%`;

        if (emailTerm === '' && loginTerm === '') {
            emailTerm = '%%';
            loginTerm = '%%';
        }

        return await userRepository
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
            .getCount();
    }
}
