import { LikeStatus } from '../output/likes-view.dto';
import { IsEnum } from 'class-validator';
import { Trim } from '../../../../../../common/decorators/transform/trim-decorator';

export class LikeInputDto {
    @Trim()
    @IsEnum(LikeStatus)
    likeStatus: LikeStatus;
}
