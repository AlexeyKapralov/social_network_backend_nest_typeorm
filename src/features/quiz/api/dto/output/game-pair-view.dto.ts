import { GamePlayerProgressViewDto } from './game-player-progress-view.dto';
import { QuestionViewDto } from './question-view.dto';

export class GamePairViewDto {
    id: string;
    firstPlayerProgress: GamePlayerProgressViewDto;
    secondPlayerProgress: GamePlayerProgressViewDto;
    questions: QuestionViewDto[];
    status: GameStatuses;
    pairCreatedDate: string;
    startGameDate: string;
    finishGameDate: string;
}

export enum GameStatuses {
    PendingSecondPlayer = 'PendingSecondPlayer',
    Active = 'Active',
    Finished = 'Finished',
}
