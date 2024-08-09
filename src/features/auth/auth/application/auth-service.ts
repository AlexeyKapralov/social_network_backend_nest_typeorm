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

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UsersRepository,
        private readonly userQueryRepository: UsersQueryRepository,
        private readonly emailService: EmailService,
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
                     <a href='https://ab.com?code=${newConfirmationCode}'>link</a>below:
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
}
