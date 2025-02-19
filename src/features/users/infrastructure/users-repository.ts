import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, MoreThan } from 'typeorm';
import { UserInputDto } from '../api/dto/input/user-input-dto';
import { User } from '../domain/user-entity';
import { v4 as uuid } from 'uuid';
import { CryptoService } from '../../../base/services/crypto-service';
import { Blog } from '../../blogs/blogs/domain/blog-entity';
import { BlogBlacklist } from '../../blogs/blogs/domain/blog-blacklist-entity';

@Injectable()
export class UsersRepository {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly cryptoService: CryptoService,
    ) {}

    async createUser(
        userInputBody: UserInputDto,
        isConfirmed: boolean,
    ): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);

        const user = new User();
        user.createdAt = new Date(new Date().toISOString());
        user.confirmationCode = uuid();
        user.login = userInputBody.login;
        user.email = userInputBody.email;
        //плюс один день жизнь confirmationCode
        user.confirmationCodeExpireDate = new Date(
            new Date().setDate(new Date().getDate() + 1),
        );
        user.password = await this.cryptoService.createPasswordHash(
            userInputBody.password,
        );
        user.isConfirmed = isConfirmed;

        return userRepository.save(user);
    }

    async findUser(userId: string): Promise<User> {
        return this.dataSource.getRepository(User).findOne({
            where: {
                id: userId,
                isConfirmed: true,
            },
        });
    }

    async deleteUser(userId: string): Promise<boolean> {
        const userRepository = this.dataSource.getRepository(User);

        const isDeleted = await userRepository.update(
            {
                id: userId,
            },
            { isDeleted: true },
        );
        return isDeleted.affected === 1;
    }

    async updateConfirmationCode(
        userId: string,
        confirmationCode: string,
    ): Promise<boolean> {
        const userRepository = this.dataSource.getRepository(User);

        const isUpdated = await userRepository.update(
            { id: userId, isDeleted: false },
            {
                isConfirmed: false,
                confirmationCode: confirmationCode,
                confirmationCodeExpireDate: new Date(
                    new Date().setDate(new Date().getDate() + 1),
                ),
            },
        );
        return isUpdated.affected === 1;
    }

    async updatePasswordByUserId(
        userId: string,
        passwordHash: string,
    ): Promise<boolean> {
        const userRepository = this.dataSource.getRepository(User);

        const isUpdated = await userRepository.update(
            { id: userId, isDeleted: false },
            {
                password: passwordHash,
            },
        );
        return isUpdated.affected === 1;
    }
    async updatePasswordByCode(
        confirmationCode: string,
        newPasswordHash: string,
    ): Promise<boolean> {
        const userRepository = this.dataSource.getRepository(User);

        const isUpdatedPassword = await userRepository.update(
            {
                confirmationCode: confirmationCode,
                isDeleted: false,
                confirmationCodeExpireDate: MoreThan(new Date()),
            },
            { password: newPasswordHash },
        );
        return isUpdatedPassword.affected === 1;
    }

    async confirmCode(code: string): Promise<boolean> {
        const userRepository = this.dataSource.getRepository(User);

        const userResult = await userRepository.update(
            {
                confirmationCode: code,
                isDeleted: false,
                isConfirmed: false,
                confirmationCodeExpireDate: MoreThan(new Date()),
            },
            { isConfirmed: true },
        );
        return userResult.affected > 0;
    }

    async banUser(userId: string, banReason: string): Promise<boolean> {
        try {
            await this.dataSource.getRepository(User).update(
                {
                    id: userId,
                    isDeleted: false,
                },
                {
                    isBanned: true,
                    banReason: banReason,
                    banDate: new Date(),
                },
            );
            return true;
        } catch (e) {
            console.log('error', e);
            return false;
        }
    }

    async unbanUser(userId: string) {
        try {
            await this.dataSource.getRepository(User).update(
                {
                    id: userId,
                    isDeleted: false,
                },
                {
                    isBanned: false,
                    banReason: null,
                    banDate: null,
                },
            );
            return true;
        } catch (e) {
            console.log('error', e);
            return false;
        }
    }

    async getBlog(ownerId: string, blogId: string) {
        const blogRepo = this.dataSource.getRepository(Blog);
        return blogRepo.find({
            where: {
                ownerId: ownerId,
                id: blogId,
            },
            select: {
                id: true,
            },
        });
    }

    async banUserForBlogs(
        blogs: Blog[],
        userId: string,
        banReason: string,
    ): Promise<boolean> {
        try {
            await this.unbanUserForBlogs(blogs, userId);
            const values = blogs.map((blog) => ({
                blogId: blog.id,
                userId: userId,
                banReason: banReason,
                banDate: new Date(),
            }));
            await this.dataSource
                .createQueryBuilder()
                .insert()
                .into(BlogBlacklist)
                .values(values)
                .execute();

            return true;
        } catch (e) {
            console.log('error', e);
            return false;
        }
    }

    async unbanUserForBlogs(blogs: Blog[], userId: string) {
        try {
            const values = [];
            blogs.forEach((blog) => values.push(blog.id));
            await this.dataSource
                .createQueryBuilder()
                .delete()
                .from(BlogBlacklist)
                .where('userId = :userId', { userId: userId })
                .andWhere('blogId IN (:...blogIdArray)', {
                    blogIdArray: values,
                })
                .execute();
            return true;
        } catch (e) {
            console.log('error', e);
            return false;
        }
    }
}
