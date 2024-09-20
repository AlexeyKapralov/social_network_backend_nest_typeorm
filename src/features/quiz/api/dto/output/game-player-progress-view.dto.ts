import { AnswerViewDto } from './answer-view.dto';
import { PlayerViewDto } from './player-view.dto';

export class GamePlayerProgressViewDto {
    answers: AnswerViewDto[];
    player: PlayerViewDto;
    score: number;
}
