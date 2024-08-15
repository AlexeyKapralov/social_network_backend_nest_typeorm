import {
    BadRequestException,
    Body,
    Controller,
    Headers,
    HttpCode,
    HttpStatus,
    Ip,
    Post,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { UserInputDto } from '../../../users/api/dto/input/user-input-dto';
import { AuthService } from '../application/auth-service';
import { ThrottlerBehindProxyGuard } from '../guards/throttle-behind-proxy';
import { RegistrationEmailResendingDto } from './dto/input/registration-email-resending-dto';
import { RegistrationConfirmationCodeDto } from './dto/input/registration-confirmation-code-dto';
import { NewPasswordRecoveryInputDto } from './dto/input/new-password-recovery-input-dto';
import { LoginInputDto } from './dto/input/login-input-dto';
import { Response } from 'express';

@UseGuards(ThrottlerBehindProxyGuard)
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('registration')
    @HttpCode(HttpStatus.NO_CONTENT)
    async registrationUser(@Body() userInputBody: UserInputDto) {
        const interlayerRegisterUser =
            await this.authService.registrationUser(userInputBody);

        if (interlayerRegisterUser.hasError()) {
            throw new BadRequestException(
                interlayerRegisterUser.extensions.map((e) => {
                    return {
                        message: e.message,
                        field: e.key,
                    };
                }),
            );
        }
    }

    @Post('registration-email-resending')
    @HttpCode(HttpStatus.NO_CONTENT)
    async resendEmail(
        @Body() registrationEmailResendingBody: RegistrationEmailResendingDto,
    ) {
        //todo дописать контроллер
        const interlayerResendEmail = await this.authService.resendEmail(
            registrationEmailResendingBody,
        );

        if (interlayerResendEmail.hasError()) {
            throw new BadRequestException(
                interlayerResendEmail.extensions.map((e) => {
                    return {
                        message: e.message,
                        field: e.key,
                    };
                }),
            );
        }
    }

    @Post('registration-confirmation')
    @HttpCode(HttpStatus.NO_CONTENT)
    async confirmRegistration(
        @Body() confirmRegistrationBody: RegistrationConfirmationCodeDto,
    ) {
        const interlayerConfirmation = await this.authService.confirmCode(
            confirmRegistrationBody.code,
        );

        if (interlayerConfirmation.hasError()) {
            throw new BadRequestException(
                interlayerConfirmation.extensions.map((e) => {
                    return {
                        message: e.message,
                        field: e.key,
                    };
                }),
            );
        }
    }

    @Post('password-recovery')
    @HttpCode(HttpStatus.NO_CONTENT)
    async resetPassword(
        @Body() registrationEmailResendingBody: RegistrationEmailResendingDto,
    ) {
        await this.authService.passwordResetEmail(
            registrationEmailResendingBody,
        );
    }

    @Post('new-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    async createNewPassword(
        @Body() newPasswordRecoveryInputDto: NewPasswordRecoveryInputDto,
    ) {
        const updatedPasswordInterlayer =
            await this.authService.createNewPassword(
                newPasswordRecoveryInputDto,
            );
        if (updatedPasswordInterlayer.hasError()) {
            throw new BadRequestException();
        }
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginInputDto: LoginInputDto,
        @Ip() ip: string,
        @Headers('user-agent') deviceName: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        const interlayerTokens = await this.authService.login(
            loginInputDto,
            ip,
            deviceName,
        );
        if (interlayerTokens.hasError()) {
            throw new UnauthorizedException();
        }

        response.cookie('refreshToken', interlayerTokens.data.refreshToken, {
            secure: true,
            httpOnly: true,
        });
        return {
            accessToken: interlayerTokens.data.accessToken,
        };
    }
}
