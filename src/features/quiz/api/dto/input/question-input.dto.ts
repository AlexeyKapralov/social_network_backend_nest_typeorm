import {
    ArrayNotEmpty,
    IsArray,
    IsNotEmpty,
    IsString,
    Length,
    ValidateNested,
} from 'class-validator';
import { Trim } from '../../../../../common/decorators/transform/trim-decorator';

export class QuestionInputDto {
    @Length(10, 500)
    body: string;
    @IsArray()
    @ArrayNotEmpty()
    @Trim()
    @IsString({ each: true })
    correctAnswers: string[];
}
