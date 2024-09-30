import { AnswerStatusesEnum } from '../../../../../common/enum/answer-statuses.enum';

export class AnswerViewDto {
    questionId: string;
    answerStatus: AnswerStatusesEnum;
    addedAt: string;
}
