import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Ip,
    Post,
    Req,
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
import { Response, Request } from 'express';
import { RefreshTokenPayloadDto } from '../../../../common/dto/refresh-token-payload-dto';
import {
    RefreshTokensCommand,
    RefreshTokensUseCaseResultType,
} from '../application/usecases/refresh-tokens-usecase';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../guards/jwt-auth-guard';
import { AccessTokenPayloadDto } from '../../../../common/dto/access-token-payload-dto';
import { UsersQueryRepository } from '../../../users/infrastructure/users-query-repository';
import { MeViewDto } from './dto/output/me-view-dto';

// @UseGuards(ThrottlerBehindProxyGuard)
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly commandBus: CommandBus,
        private readonly userQueryRepository: UsersQueryRepository,
    ) {}

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

    @UseGuards(JwtAuthGuard)
    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(
        @Req() req: any,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshTokenPayload: RefreshTokenPayloadDto = req.user.payload;
        if (!refreshTokenPayload.deviceId) {
            throw new UnauthorizedException();
        }

        const command = new RefreshTokensCommand(refreshTokenPayload);
        const tokensInterlayer = await this.commandBus.execute<
            RefreshTokensCommand,
            InterlayerNotice<RefreshTokensUseCaseResultType>
        >(command);
        if (tokensInterlayer.hasError()) {
            throw new UnauthorizedException();
        }

        res.cookie('refreshToken', tokensInterlayer.data.refreshToken, {
            httpOnly: true,
            secure: true,
        });
        return { accessToken: tokensInterlayer.data.accessToken };
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@Req() req: any) {
        const refreshTokenPayload: RefreshTokenPayloadDto = req.user.payload;
        if (!refreshTokenPayload.deviceId) {
            throw new UnauthorizedException();
        }

        const logoutInterlayer =
            await this.authService.logout(refreshTokenPayload);
        if (logoutInterlayer.hasError()) {
            throw new UnauthorizedException();
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @HttpCode(HttpStatus.OK)
    async getInfoAboutCurrentUser(@Req() req: any) {
        const refreshTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!refreshTokenPayload.userId) {
            throw new UnauthorizedException();
        }
        const userViewDto = await this.userQueryRepository.findUserById(
            refreshTokenPayload.userId,
        );
        if (!userViewDto) {
            throw new UnauthorizedException();
        }
        return {
            userId: userViewDto.id,
            login: userViewDto.login,
            email: userViewDto.email,
        };
    }
}
