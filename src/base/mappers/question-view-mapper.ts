import { Question } from '../../features/quiz/domain/question.entity';
import { QuestionViewDto } from '../../features/quiz/api/dto/output/question-view.dto';

export const questionViewMapper = (question: Question): QuestionViewDto => {
    return {
        id: question.id,
        body: question.body,
        correctAnswers: question.answers,
        published: question.published,
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt ? question.updatedAt.toISOString() : null,
    };
};
