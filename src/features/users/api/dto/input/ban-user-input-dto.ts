import { IsBoolean, IsString, IsUUID, Length } from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim-decorator';

export class BanUserInputDto {
    @IsBoolean()
    isBanned: boolean;

    @Trim()
    @Length(6, 1000)
    @IsString()
    banReason: string;
}

export class BanUserForSpecificBlogInputDto {
    @IsBoolean()
    isBanned: boolean;

    @Trim()
    @Length(6, 1000)
    @IsString()
    banReason: string;

    @Trim()
    @IsUUID()
    blogId: string;
}

export class BanUserSaInfoViewDto {
    @IsBoolean()
    isBanned: boolean;
}
