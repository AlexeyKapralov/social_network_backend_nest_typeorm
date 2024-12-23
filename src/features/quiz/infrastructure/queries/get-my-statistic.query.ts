import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessTokenPayloadDto } from '../../../../common/dto/access-token-payload-dto';
import { MyStatisticViewDto } from '../../api/dto/output/my-statistic-view.dto';
import { Player } from '../../domain/player.entity';
import { GameResultsEnum } from '../../api/dto/output/game-results-view.dto';

export class GetStatisticPayload implements IQuery {
    constructor(public token: AccessTokenPayloadDto) {}
}

@QueryHandler(GetStatisticPayload)
export class GetStatisticQuery
    implements
        IQueryHandler<
            GetStatisticPayload,
            InterlayerNotice<GetStatisticResultType>
        >
{
    constructor(
        @InjectRepository(Player)
        private readonly playerRepo: Repository<Player>,
    ) {}

    async execute(
        query: GetStatisticPayload,
    ): Promise<InterlayerNotice<GetStatisticResultType>> {
        const notice = new InterlayerNotice<GetStatisticResultType>();

        const players: (Player & { p2Score: number; gameStatus: string })[] =
            await this.playerRepo.query(
                `
            SELECT
                p.id,
                p.score,
                p."userId",
                p."gameId",
                COALESCE(max_p2_score.max_score, 0) AS "p2Score",
                CASE
                    WHEN COALESCE(max_p2_score.max_score, 0) = p.score THEN '${GameResultsEnum.Draw}'
                    WHEN COALESCE(max_p2_score.max_score, 0) < p.score THEN '${GameResultsEnum.Win}'
                    ELSE '${GameResultsEnum.Lose}'
                END AS "gameStatus"
            FROM
                public.player p
            LEFT JOIN (
                select "gameId", MAX(score) AS max_score
                from public.player
                where "userId" <> $1
                GROUP by "gameId"
            ) AS max_p2_score ON p."gameId" = max_p2_score."gameId"
            WHERE
                p."userId" = $1;
        `,
                [query.token.userId],
            );

        const sumScore = players.reduce((acc, p) => {
            return acc + p.score;
        }, 0);

        const avgScore = Number((sumScore / players.length).toFixed(2));

        const gamesCount = players.length;

        const winsCount = players.filter(
            (p) => p.gameStatus === GameResultsEnum.Win,
        ).length;
        const loseCount = players.filter(
            (p) => p.gameStatus === GameResultsEnum.Lose,
        ).length;
        const drawCount = players.filter(
            (p) => p.gameStatus === GameResultsEnum.Draw,
        ).length;

        notice.addData({
            sumScore: sumScore,
            avgScores: avgScore,
            gamesCount: gamesCount,
            winsCount: winsCount,
            lossesCount: loseCount,
            drawsCount: drawCount,
        });

        return notice;
    }
}

export type GetStatisticResultType = MyStatisticViewDto;
