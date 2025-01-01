import { PlayerViewDto } from './player-view.dto';

export class TopGamePlayerViewDto {
    sumScore: number;
    avgScores: number;
    gamesCount: number;
    winsCount: number;
    lossesCount: number;
    drawsCount: number;
    player: PlayerViewDto;
}
