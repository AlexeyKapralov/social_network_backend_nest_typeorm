export class AnswerViewDto {
    questionId: string;
    answerStatus: answerStatusesEnum;
    addedAt: string;
}

export enum answerStatusesEnum {
    Correct = 'Correct',
    Incorrect = 'Incorrect',
}
