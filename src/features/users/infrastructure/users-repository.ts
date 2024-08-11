import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserInputDto } from '../api/dto/input/user-input-dto';
import { User } from '../domain/user-entity';
import { v4 as uuid } from 'uuid';
import { CryptoService } from '../../../base/services/crypto-service';

@Injectable()
export class UsersRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
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
        user.password = await this.cryptoService.createPasswordHash(
            userInputBody.password,
        );
        user.isConfirmed = isConfirmed;

        return await userRepository.save(user);
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
            { confirmationCode: confirmationCode },
        );
        return isUpdated.affected === 1;
    }

    async confirmCode(code: string): Promise<boolean> {
        const userRepository = this.dataSource.getRepository(User);

        const user = await userRepository.update({
            confirmationCode: code,
            isDeleted: false,
            isConfirmed: false,
            createdAt,
        });
    }
}
