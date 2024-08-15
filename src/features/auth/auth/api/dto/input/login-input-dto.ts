import { IsString, IsStrongPassword } from 'class-validator';

export class LoginInputDto {
    @IsString()
    loginOrEmail: string;
    @IsString()
    password: string;
}
