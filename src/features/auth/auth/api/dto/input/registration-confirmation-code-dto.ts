import { IsUUID } from 'class-validator';

export class RegistrationConfirmationCodeDto {
    @IsUUID()
    code: string;
}
