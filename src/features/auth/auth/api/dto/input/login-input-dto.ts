import { IsString } from 'class-validator';

export class LoginInputDto {
    @IsString()
    loginOrEmail: string;
    @IsString()
    password: string;
}
