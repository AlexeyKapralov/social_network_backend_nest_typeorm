import { Matches } from 'class-validator';

export class RegistrationEmailResendingDto {
    @Matches('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$')
    email: string;
}
