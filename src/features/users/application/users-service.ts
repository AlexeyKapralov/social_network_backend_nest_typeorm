import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users-repository';
import { UserInputDto } from '../api/dto/input/user-input-dto';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../base/models/interlayer';
import {
    QueryDtoWithBan,
    QueryDtoWithLogin,
} from '../../../common/dto/query-dto';
import { PaginatorDto } from '../../../common/dto/paginator-dto';
import { UsersQueryRepository } from '../infrastructure/users-query-repository';
import {
    BanUserForSpecificBlogInputDto,
    BanUserInputDto,
} from '../api/dto/input/ban-user-input-dto';
import { DeviceService } from '../../auth/devices/application/device-service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
    BannedUserViewDto,
    UserViewDto,
} from '../api/dto/output/user-view-dto';
import { toUserViewDtoMapper } from '../../../base/mappers/user-view-mapper';
import { LikeService } from '../../blogs/likes/application/like.service';
import { Blog } from '../../blogs/blogs/domain/blog-entity';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly usersQueryRepository: UsersQueryRepository,
        private readonly deviceService: DeviceService,
        private readonly likesService: LikeService,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

    async createUser(
        userInputBody: UserInputDto,
    ): Promise<InterlayerNotice<UserViewDto | null>> {
        const notice = new InterlayerNotice<UserViewDto>();
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
        const mappedUser = toUserViewDtoMapper(user);
        notice.addData(mappedUser);

        return notice;
    }
    async findUsers(
        query: QueryDtoWithBan,
    ): Promise<InterlayerNotice<PaginatorDto<UserViewDto>>> {
        const notice = new InterlayerNotice<PaginatorDto<UserViewDto>>();

        const countUsers = await this.usersQueryRepository.getCountUsers(
            query.searchEmailTerm,
            query.searchLoginTerm,
            query.banStatus,
        );
        const users = await this.usersQueryRepository.findUsers(query);

        const usersWithQuery: PaginatorDto<UserViewDto> = {
            pagesCount: Math.ceil(countUsers / query.pageSize),
            page: query.pageNumber,
            pageSize: query.pageSize,
            totalCount: countUsers,
            items: users,
        };

        notice.addData(usersWithQuery);
        return notice;
    }

    async findBannedUsers(
        query: QueryDtoWithLogin,
        blogId: string,
        ownerId: string,
    ): Promise<InterlayerNotice<PaginatorDto<BannedUserViewDto>>> {
        const notice = new InterlayerNotice<PaginatorDto<BannedUserViewDto>>();

        const blog = await this.dataSource.getRepository(Blog).findOne({
            where: {
                id: blogId,
            },
            relations: {
                user: true,
            },
        });
        if (!blog) {
            notice.addError(
                'blog does not exist',
                '',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }
        if (blog.user.id !== ownerId) {
            notice.addError(
                'you are not blog owner',
                '',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const countUsers = await this.usersQueryRepository.getCountBannedUsers(
            query,
            blogId,
        );

        const users = await this.usersQueryRepository.findBannedUsers(
            query,
            blogId,
        );

        const usersWithQuery: PaginatorDto<BannedUserViewDto> = {
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
                await this.likesService.recountLikes();
                await queryRunner.commitTransaction();
                console.log('transaction for ban user was commited');
                return notice;
            } catch (e) {
                await queryRunner.rollbackTransaction();
                console.log('transaction for ban user was rollback');
                return notice;
            } finally {
                await queryRunner.release();
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
                await this.likesService.recountLikes();
                await queryRunner.commitTransaction();
                console.log('transaction for ban user was commited');
                return notice;
            } catch (e) {
                await queryRunner.rollbackTransaction();
                console.log('transaction for ban user was rollback');
                return notice;
            } finally {
                await queryRunner.release();
            }
        }
    }

    async banUserForSpecificBlog(
        ownerId: string,
        userId: string,
        banUserInputDto: BanUserForSpecificBlogInputDto,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        const user = await this.usersRepository.findUser(userId);
        if (!user) {
            notice.addError('user not found', '', InterlayerStatuses.NOT_FOUND);
            return notice;
        }

        const blog = await this.usersRepository.getBlog(
            ownerId,
            banUserInputDto.blogId,
        );
        if (!blog.length) {
            notice.addError(
                'blogs was not found',
                '',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        if (banUserInputDto.isBanned) {
            await queryRunner.startTransaction('REPEATABLE READ');

            try {
                const banResult = await this.usersRepository.banUserForBlogs(
                    blog,
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
                await this.likesService.recountLikes();
                await queryRunner.commitTransaction();
                console.log(
                    'transaction for ban user for specified blogs was commited',
                );
                return notice;
            } catch (e) {
                await queryRunner.rollbackTransaction();
                console.log(
                    'transaction for ban user for specified blogs was rollback',
                );
                return notice;
            } finally {
                await queryRunner.release();
            }
        } else {
            await queryRunner.startTransaction('REPEATABLE READ');

            try {
                const unbanResult =
                    await this.usersRepository.unbanUserForBlogs(blog, userId);
                if (!unbanResult) {
                    notice.addError(
                        'unban is not completed',
                        '',
                        InterlayerStatuses.BAD_REQUEST,
                    );
                    await queryRunner.rollbackTransaction();
                    return notice;
                }
                await this.likesService.recountLikes();
                await queryRunner.commitTransaction();
                console.log(
                    'transaction for ban user for specified blogs was commited',
                );
                return notice;
            } catch (e) {
                await queryRunner.rollbackTransaction();
                console.log(
                    'transaction for ban user for specified blogs was rollback',
                );
                return notice;
            } finally {
                await queryRunner.release();
            }
        }
    }
}
