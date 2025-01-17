import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users-repository';
import { UserInputDto } from '../api/dto/input/user-input-dto';
import { User } from '../domain/user-entity';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../base/models/interlayer';
import { QueryDtoWithEmailLogin } from '../../../common/dto/query-dto';
import { PaginatorDto } from '../../../common/dto/paginator-dto';
import { UsersQueryRepository } from '../infrastructure/users-query-repository';
import { BanUserInputDto } from '../api/dto/input/ban-user-input-dto';
import { not } from 'rxjs/internal/util/not';
import { DeviceService } from '../../auth/devices/application/device-service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly usersQueryRepository: UsersQueryRepository,
        private readonly deviceService: DeviceService,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

    async createUser(
        userInputBody: UserInputDto,
    ): Promise<InterlayerNotice<User | null>> {
        const notice = new InterlayerNotice<User>();
        const userByEmail = await this.usersQueryRepository.findUserByEmail(
            userInputBody.email,
        );
        const userByLogin = await this.usersQueryRepository.findUserByLogin(
            userInputBody.login,
        );
        if (userByEmail) {
            notice.addError(
                'email already exists',
                'email',
                InterlayerStatuses.BAD_REQUEST,
            );
        }
        if (userByLogin) {
            notice.addError(
                'login already exists',
                'login',
                InterlayerStatuses.BAD_REQUEST,
            );
        }
        if (notice.hasError()) {
            return notice;
        }

        const user = await this.usersRepository.createUser(userInputBody, true);
        notice.addData(user);

        return notice;
    }
    async findUsers(
        query: QueryDtoWithEmailLogin,
    ): Promise<InterlayerNotice<PaginatorDto<User>>> {
        const notice = new InterlayerNotice<PaginatorDto<User>>();

        const countUsers = await this.usersQueryRepository.getCountUsers(
            query.searchEmailTerm,
            query.searchLoginTerm,
        );
        const users = await this.usersQueryRepository.findUsers(query);

        const usersWithQuery: PaginatorDto<User> = {
            pagesCount: Math.ceil(countUsers / query.pageSize),
            page: query.pageNumber,
            pageSize: query.pageSize,
            totalCount: countUsers,
            items: users,
        };

        notice.addData(usersWithQuery);
        return notice;
    }

    async deleteUser(userId: string) {
        const notice = new InterlayerNotice();

        const user = await this.usersQueryRepository.findUserById(userId);
        if (!user) {
            notice.addError(
                'user did not found',
                'user',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const isDeletedUser = await this.usersRepository.deleteUser(userId);
        if (!isDeletedUser) {
            notice.addError(
                'user did not delete',
                'user',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }
        return notice;
    }

    async banUser(
        userId: string,
        banUserInputDto: BanUserInputDto,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        const user = await this.usersRepository.findUser(userId);
        if (!user) {
            notice.addError('use not found', '', InterlayerStatuses.NOT_FOUND);
            return notice;
        }
        if (banUserInputDto.isBanned) {
            await queryRunner.startTransaction('REPEATABLE READ');

            try {
                const banResult = await this.usersRepository.banUser(
                    userId,
                    banUserInputDto.banReason,
                );
                if (!banResult) {
                    notice.addError(
                        'ban is not completed',
                        '',
                        InterlayerStatuses.BAD_REQUEST,
                    );
                    await queryRunner.rollbackTransaction();
                    return notice;
                }
                const interlayerDeleteAllDevicesByUserId =
                    await this.deviceService.deleteAllDevicesByUserId(userId);
                if (interlayerDeleteAllDevicesByUserId.hasError()) {
                    notice.addError(
                        'devices are not deleted',
                        '',
                        InterlayerStatuses.BAD_REQUEST,
                    );
                    await queryRunner.rollbackTransaction();
                    return notice;
                }
                await queryRunner.commitTransaction();
                console.log('transaction for ban user was commited');
                return notice;
            } catch (e) {
                await queryRunner.rollbackTransaction();
                console.log('transaction for ban user was rollback');
                return notice;
            }
        } else {
            await queryRunner.startTransaction('REPEATABLE READ');

            try {
                const unbanResult =
                    await this.usersRepository.unbanUser(userId);
                if (!unbanResult) {
                    notice.addError(
                        'unban is not completed',
                        '',
                        InterlayerStatuses.BAD_REQUEST,
                    );
                    await queryRunner.rollbackTransaction();
                    return notice;
                }
                await queryRunner.commitTransaction();
                console.log('transaction for ban user was commited');
                return notice;
            } catch (e) {
                await queryRunner.rollbackTransaction();
                console.log('transaction for ban user was rollback');
                return notice;
            }
        }
    }
}
