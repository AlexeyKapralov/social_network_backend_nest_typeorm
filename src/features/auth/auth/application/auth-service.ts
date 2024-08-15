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
        if (!user) {
            notice.addError(
                'email did not found',
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

        //todo не сделано создание девайса и токенов
        const apiSettings = this.configService.get<ApiSettings>('apiSettings', {
            infer: true,
        });
        const accessTokenExpLive = apiSettings.ACCESS_TOKEN_EXPIRATION_LIVE;
        const refreshTokenExpLive = apiSettings.REFRESH_TOKEN_EXPIRATION_LIVE;

        // const dateNow = new Date();
        // const atExp = new Date(Number(dateNow) + ms(accessTokenExpLive));
        // const rtExp = new Date(Number(dateNow) + ms(refreshTokenExpLive));

        const accessToken = this.jwtService.sign(
            {
                userId: userByEmail.id,
            },
            { expiresIn: accessTokenExpLive },
        );
        const refreshToken = this.jwtService.sign(
            {
                userId: userByEmail.id,
            },
            { expiresIn: refreshTokenExpLive },
        );
        const refreshTokenIAt = await this.jwtService.verifyAsync(refreshToken);

        await this.deviceService.createDeviceOrUpdate(
            user.id,
            deviceName,
            ip,
            new Date(1000 * refreshTokenIAt.exp),
            new Date(1000 * refreshTokenIAt.iat),
        );

        notice.addData({
            accessToken,
            refreshToken,
        });

        return notice;
    }
}
