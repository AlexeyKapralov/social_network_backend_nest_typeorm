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
import { User } from '../users/domain/user-entity';

@Module({
    imports: [
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
    controllers: [AuthController],
    providers: [
        BasicStrategy,
        AuthService,
        DeviceService,
        DeviceRepository,
        EmailService,
        CryptoService,
    ],
    exports: [AuthService],
})
export class AuthModule {}
