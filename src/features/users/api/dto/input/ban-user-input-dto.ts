import {
    IsBoolean,
    isBoolean,
    IsEmail,
    IsString,
    Length,
    Matches,
} from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim-decorator';

export class BanUserInputDto {
    @IsBoolean()
    isBanned: boolean;

    @Trim()
    @Length(6, 1000)
    @IsString()
    banReason: string;
}
