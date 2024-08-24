import { Length } from 'class-validator';
import { Trim } from '../../../../../../common/decorators/transform/trim-decorator';

export class BlogPostInputDto {
    @Trim()
    @Length(1, 30)
    title: string;
    @Trim()
    @Length(1, 100)
    shortDescription: string;
    @Trim()
    @Length(1, 1000)
    content: string;
}
