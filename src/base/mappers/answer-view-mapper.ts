import { Answer } from '../../features/quiz/domain/answer.entity';
import { AnswerViewDto } from '../../features/quiz/api/dto/output/answer-view.dto';
import { AnswerStatusesEnum } from '../../common/enum/answer-statuses.enum';

export const answerViewDtoMapper = (answer: Answer): AnswerViewDto => {
    return {
        questionId: answer.question.id,
        answerStatus: answer.status as AnswerStatusesEnum,
        addedAt: answer.createdAt.toISOString(),
    };
};
