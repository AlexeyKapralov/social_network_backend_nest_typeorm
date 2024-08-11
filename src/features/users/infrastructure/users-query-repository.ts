import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, ILike } from 'typeorm';
import { UserInputDto } from '../api/dto/input/user-input-dto';
import { User } from '../domain/user-entity';
import { v4 as uuid } from 'uuid';
import { QueryDtoWithEmailLogin } from '../../../common/dto/query-dto';

@Injectable()
export class UsersQueryRepository {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

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
            },
        });
    }

    async findUserById(userId: string): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);

        return await userRepository.findOne({
            where: {
                id: userId,
                isDeleted: false,
            },
        });
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

        return await userRepository.find({
            where: {
                email: ILike(
                    `%${query.searchEmailTerm === null ? '' : query.searchEmailTerm}%`,
                ),
                login: ILike(
                    `%${query.searchLoginTerm === null ? '' : query.searchLoginTerm}%`,
                ),
                isDeleted: false,
                isConfirmed: true,
            },
            order: {
                [query.sortBy]: query.sortDirection,
            },
            skip: (query.pageNumber - 1) * query.pageSize,
            take: query.pageSize,
        });
    }

    async getCountUsers(emailTerm: string, loginTerm: string): Promise<number> {
        const userRepository = this.dataSource.getRepository(User);

        return await userRepository.countBy({
            email: ILike(`%${emailTerm === null ? '' : emailTerm}%`),
            login: ILike(`%${loginTerm === null ? '' : loginTerm}%`),
            isDeleted: false,
            isConfirmed: true,
        });
    }
}
