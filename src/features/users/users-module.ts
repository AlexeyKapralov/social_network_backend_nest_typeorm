import { Module } from '@nestjs/common';
import { UsersSaController } from './api/users-sa-controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/user-entity';
import { UsersService } from './application/users-service';
import { UsersRepository } from './infrastructure/users-repository';
import { UsersQueryRepository } from './infrastructure/users-query-repository';
import { CryptoService } from '../../base/services/crypto-service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UsersSaController],
    providers: [
        UsersService,
        UsersRepository,
        UsersQueryRepository,
        CryptoService,
    ],
    exports: [UsersService, UsersRepository, UsersQueryRepository],
})
export class UsersModule {}
