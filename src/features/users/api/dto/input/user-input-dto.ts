import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim-decorator';

export class UserInputDto {
    @Trim()
    @Length(3, 10)
    @IsString()
    @Matches('^[a-zA-Z0-9_-]*$')
    login: string

    @Trim()
    @Length(6, 20)
    @IsString()
    password: string

    @Trim()
    @IsEmail()
    @IsString()
    @Matches('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$')
    email: string
}