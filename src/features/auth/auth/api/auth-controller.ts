import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { UserInputDto } from '../../../users/api/dto/input/user-input-dto';
import { AuthService } from '../application/auth-service';
import { ThrottlerBehindProxyGuard } from '../guards/throttle-behind-proxy';
import { RegistrationEmailResendingDto } from './dto/input/registration-email-resending-dto';
import { RegistrationConfirmationCodeDto } from './dto/input/registration-confirmation-code-dto';

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
        await this.authService.registrationUser();
    }
}
