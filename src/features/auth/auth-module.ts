import { Module } from '@nestjs/common';
import { BasicStrategy } from './auth/strategies/basic-strategy';
import { AuthController } from './auth/api/auth-controller';
import { AuthService } from './auth/application/auth-service';
import { UsersModule } from '../users/users-module';
import { EmailService } from '../../base/services/email-service';
import { CryptoService } from '../../base/services/crypto-service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../settings/env/configuration';
import { ApiSettings } from '../../settings/env/api-settings';
import { Device } from './devices/domain/device-entity';
import { DeviceService } from './devices/application/device-service';
import { DeviceRepository } from './devices/infrastructure/device-repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceQueryRepository } from './devices/infrastructure/device-query-repository';
import { CqrsModule } from '@nestjs/cqrs';
import { RefreshTokensUseCase } from './auth/application/usecases/refresh-tokens-usecase';
import { JwtStrategy } from './auth/strategies/jwt-strategy';
import { DeviceController } from './devices/api/device-controller';
import { DeleteDevicesUseCase } from './devices/application/usecases/delete-devices-usecase';

@Module({
    imports: [
        CqrsModule,
        UsersModule,
        TypeOrmModule.forFeature([Device]),
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService<ConfigurationType>) => {
                const apiSettings = configService.get<ApiSettings>(
                    'apiSettings',
                    { infer: true },
                );
                return {
                    secret: apiSettings.SECRET,
                };
            },
            global: true,
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController, DeviceController],
    providers: [
        BasicStrategy,
        JwtStrategy,
        AuthService,

        DeleteDevicesUseCase,
        RefreshTokensUseCase,

        DeviceService,
        EmailService,
        CryptoService,

        DeviceRepository,
        DeviceQueryRepository,
    ],
    exports: [AuthService, DeviceQueryRepository],
})
export class AuthModule {}
