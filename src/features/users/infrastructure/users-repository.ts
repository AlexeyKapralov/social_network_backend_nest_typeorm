import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, ILike } from 'typeorm';
import { UserInputDto } from '../api/dto/input/user-input-dto';
import { User } from '../domain/user-entity';
import { v4 as uuid } from 'uuid';
import { QueryDtoWithEmailLogin } from '../../../common/dto/query-dto';

@Injectable()
export class UsersRepository {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    async createUser(userInputBody: UserInputDto): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);

        const user = new User();
        user.createdAt = new Date(new Date().toISOString());
        user.confirmationCode = uuid();
        user.login = userInputBody.login;
        user.email = userInputBody.email;
        user.password = userInputBody.password;
        user.isConfirmed = true;

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
}
