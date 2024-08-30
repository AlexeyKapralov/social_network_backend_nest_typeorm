import { Length } from 'class-validator';
import { Trim } from '../../../../../../common/decorators/transform/trim-decorator';

export class CommentInputDto {
    @Trim()
    @Length(20, 300)
    content: string;
}
