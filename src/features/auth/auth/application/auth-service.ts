import { Injectable } from '@nestjs/common';
import { UserInputDto } from '../../../users/api/dto/input/user-input-dto';
import { UsersRepository } from '../../../users/infrastructure/users-repository';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';
import { User } from '../../../users/domain/user-entity';
import { EmailService } from '../../../../base/services/email-service';
import { UsersQueryRepository } from '../../../users/infrastructure/users-query-repository';
import { RegistrationEmailResendingDto } from '../api/dto/input/registration-email-resending-dto';
import { v4 as uuid } from 'uuid';
import { NewPasswordRecoveryInputDto } from '../api/dto/input/new-password-recovery-input-dto';
import { CryptoService } from '../../../../base/services/crypto-service';
import { LoginInputDto } from '../api/dto/input/login-input-dto';
import { TokensDto } from '../../../../base/models/tokens-dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiSettings } from '../../../../settings/env/api-settings';
import { DeviceService } from '../../devices/application/device-service';
import ms from 'ms';
import { RefreshTokenPayloadDto } from '../../../../common/dto/refresh-token-payload-dto';
import { DeviceQueryRepository } from '../../devices/infrastructure/device-query-repository';
import { DeviceRepository } from '../../devices/infrastructure/device-repository';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UsersRepository,
        private readonly userQueryRepository: UsersQueryRepository,
        private readonly emailService: EmailService,
        private readonly cryptoService: CryptoService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly deviceService: DeviceService,
        private readonly deviceQueryRepository: DeviceQueryRepository,
        private readonly deviceRepository: DeviceRepository,
    ) {}
    async registrationUser(userInputBody: UserInputDto) {
        const notice = new InterlayerNotice<User>();

        const userByLogin = await this.userQueryRepository.findUserByLogin(
            userInputBody.login,
        );
        if (userByLogin) {
            notice.addError(
                'login already exists',
                'login',
                InterlayerStatuses.FORBIDDEN,
            );
        }

        const userByEmail = await this.userQueryRepository.findUserByEmail(
            userInputBody.email,
        );
        if (userByEmail) {
            notice.addError(
                'email already exists',
                'email',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const user = await this.userRepository.createUser(userInputBody, false);
        if (!user) {
            notice.addError(
                'user did not created',
                'user',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }

        const html = `
				 <h1>Thank you for registration</h1>
				 <p>To finish registration please follow the link below:
                     <a href='https://ab.com?code=${user.confirmationCode}'>complete registration</a>
				 </p>
			`;
        try {
            await this.emailService.sendEmail(
                user.email,
                'Confirmation Code',
                html,
            );
        } catch (e) {
            console.error(`some problems with send confirm code ${e}`);
        }

        notice.addData(user);
        return notice;
    }

    async confirmCode(code: string): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const user =
            await this.userQueryRepository.findUserByConfirmationCode(code);
        if (!user) {
            notice.addError(
                'confirmation code is incorrect',
                'code',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }

        if (
            user.isConfirmed === true ||
            user.confirmationCodeExpireDate < new Date()
        ) {
            notice.addError(
                'confirmation code expired or already have been applied',
                'code',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }

        const isConfirmCode = await this.userRepository.confirmCode(code);
        if (!isConfirmCode) {
            notice.addError(
                'confirmation code did not confirmed',
                'code',
                InterlayerStatuses.BAD_REQUEST,
            );
            return notice;
        }
        return notice;
    }

    async resendEmail(
        registrationEmailResendingBody: RegistrationEmailResendingDto,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const user = await this.userQueryRepository.findUserByEmail(
            registrationEmailResendingBody.email,
        );
        if (!user || user.isConfirmed === true) {
            notice.addError(
                'email did not found or already confirmed',
                'email',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }
        const newConfirmationCode = uuid();
        const isUpdatedUser = await this.userRepository.updateConfirmationCode(
            user.id,
            newConfirmationCode,
        );
        if (!isUpdatedUser) {
            notice.addError(
                'user confirmation code did not updated',
                'user confirmation code',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }
        const html = `
             <h1>Your confirmation code</h1>
             <p>Here is your new confirmation code, please follow the 
                 <a href='https://ab.com?code=${newConfirmationCode}'>link </a>below:
             </p>
        `;
        try {
            await this.emailService.sendEmail(
                user.email,
                'Confirmation Code',
                html,
            );
        } catch (e) {
            console.error(`some problems with resend confirmation code ${e}`);
        }
        return notice;
    }

    async passwordResetEmail(
        registrationEmailResendingBody: RegistrationEmailResendingDto,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const user = await this.userQueryRepository.findUserByEmail(
            registrationEmailResendingBody.email,
        );
        if (!user) {
            return notice;
        }
        const newConfirmationCode = uuid();
        const newPassword = uuid();
        const isUpdatedUser = await this.userRepository.updateConfirmationCode(
            user.id,
            newConfirmationCode,
        );
        const isUpdatedPassword =
            await this.userRepository.updatePasswordByUserId(
                user.id,
                newPassword,
            );
        if (!isUpdatedUser || !isUpdatedPassword) {
            return notice;
        }
        const html = `
             <h1>Your new confirmation code</h1>
             <p>Here is your new confirmation code, please follow the 
                 <a href='https://ab.com?code=${newConfirmationCode}'>link </a>below:
             </p>
        `;
        try {
            await this.emailService.sendEmail(
                user.email,
                'New Confirmation Code',
                html,
            );
        } catch (e) {
            console.error(`some problems with resend confirmation code ${e}`);
        }
        return notice;
    }

    async createNewPassword(
        newPasswordRecoveryInputDto: NewPasswordRecoveryInputDto,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const user = await this.userQueryRepository.findUserByConfirmationCode(
            newPasswordRecoveryInputDto.recoveryCode,
        );
        if (!user) {
            notice.addError('user did not find');
            return notice;
        }

        const passwordHash = await this.cryptoService.createPasswordHash(
            newPasswordRecoveryInputDto.newPassword,
        );

        const isCreatedNewPass = await this.userRepository.updatePasswordByCode(
            newPasswordRecoveryInputDto.recoveryCode,
            passwordHash,
        );
        if (!isCreatedNewPass) {
            notice.addError('pass did not updated');
            return notice;
        }
        return notice;
    }

    async login(
        loginInputDto: LoginInputDto,
        ip: string,
        deviceName: string,
    ): Promise<InterlayerNotice<TokensDto>> {
        const notice = new InterlayerNotice<TokensDto>();

        let user: User;
        const userByLogin = await this.userQueryRepository.findUserByLogin(
            loginInputDto.loginOrEmail,
        );
        const userByEmail = await this.userQueryRepository.findUserByEmail(
            loginInputDto.loginOrEmail,
        );
        if (!userByLogin && !userByEmail) {
            notice.addError('user did not find');
            return notice;
        }
        userByLogin ? (user = userByLogin) : (user = userByEmail);

        const isPasswordValid = await this.cryptoService.comparePasswordHash(
            loginInputDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            notice.addError('password is not valid');
            return notice;
        }

        const tokens = await this.updateDevicesAndCreateTokens(
            user.id,
            deviceName,
            ip,
        );

        notice.addData({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });

        return notice;
    }

    async updateDevicesAndCreateTokens(
        userId: string = undefined,
        deviceName: string = undefined,
        ip: string = undefined,
        deviceId: string = undefined,
    ): Promise<TokensDto | null> {
        if (deviceId) {
            const device = await this.deviceRepository.findDeviceById(deviceId);
            if (!device) {
                return null;
            }
            userId = device.userId;
            deviceName = device.deviceName;
            ip = device.ip;
        }
        const apiSettings = this.configService.get<ApiSettings>('apiSettings', {
            infer: true,
        });
        let accessTokenExpLive = apiSettings.ACCESS_TOKEN_EXPIRATION_LIVE;
        accessTokenExpLive = Number(ms(accessTokenExpLive)) / 1000;

        let refreshTokenExpLive = apiSettings.REFRESH_TOKEN_EXPIRATION_LIVE;
        refreshTokenExpLive = Number(ms(refreshTokenExpLive)) / 1000;

        const dateNowNumber = Math.trunc(Date.now() / 1000);

        const deviceInterlayer = await this.deviceService.createDeviceOrUpdate(
            userId,
            deviceName,
            ip,
            new Date((dateNowNumber + refreshTokenExpLive) * 1000),
            new Date(dateNowNumber * 1000),
        );

        const accessToken = this.jwtService.sign({
            userId: userId,
            exp: dateNowNumber + accessTokenExpLive,
            iat: dateNowNumber,
        });
        const refreshToken = this.jwtService.sign({
            deviceId: deviceInterlayer.data.id,
            exp: dateNowNumber + refreshTokenExpLive,
            iat: dateNowNumber,
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    async logout(refreshTokenPayloadDto: RefreshTokenPayloadDto) {
        const notice = new InterlayerNotice();

        const isDeviceExpiredInterlayer =
            await this.deviceService.checkDeviceExpiration(
                refreshTokenPayloadDto.deviceId,
                refreshTokenPayloadDto.iat,
            );
        if (isDeviceExpiredInterlayer.hasError()) {
            notice.addError('device did not found');
            return notice;
        }

        const newDate = new Date(Math.trunc(Date.now() / 1000) * 1000);
        const isUpdatedDevice = await this.deviceService.updateDevice(
            refreshTokenPayloadDto.deviceId,
            newDate,
            newDate,
        );
        if (isUpdatedDevice.hasError()) {
            notice.addError('device did not updated');
            return notice;
        }
        return notice;
    }
}
