import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../../domain/question.entity';
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
        @InjectRepository(Player) private playerRepo: Repository<Player>,
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

        //
        // const questionsQuery = this.questionRepo
        //     .createQueryBuilder('q')
        //     .select([
        //         'q.id',
        //         'q.body',
        //         'q.answers',
        //         'q.published',
        //         'q.createdAt',
        //         'q.updatedAt',
        //     ])
        //     .orderBy(
        //         `"${query.queryDtoForQuiz.sortBy === 'createdAt' ? `q"."createdAt` : query.queryDtoForQuiz.sortBy}"`,
        //         query.queryDtoForQuiz.sortDirection,
        //     );
        //
        // //фильтр для поля published
        // if (
        //     query.queryDtoForQuiz.publishedStatus === PublishedStatus.published
        // ) {
        //     questionsQuery.andWhere('q."published" = :publishedStatus', {
        //         publishedStatus: true,
        //     });
        // }
        // if (
        //     query.queryDtoForQuiz.publishedStatus ===
        //     PublishedStatus.notPublished
        // ) {
        //     questionsQuery.andWhere('q.published = :publishedStatus', {
        //         publishedStatus: false,
        //     });
        // }
        //
        // //обработка для bodySearchTerm
        // if (query.queryDtoForQuiz.bodySearchTerm) {
        //     questionsQuery.andWhere('q.body like :body', {
        //         body: `%${query.queryDtoForQuiz.bodySearchTerm}%`,
        //     });
        // }
        //
        // //пагинация
        // const countQuestions = await questionsQuery.getCount();
        // questionsQuery.take(query.queryDtoForQuiz.pageSize);
        // questionsQuery.skip(
        //     (query.queryDtoForQuiz.pageNumber - 1) *
        //         query.queryDtoForQuiz.pageSize,
        // );
        //
        // const questions = await questionsQuery.getMany();
        // const mappedQuestions: QuestionViewDto[] = [];
        // questions.map((q) => {
        //     mappedQuestions.push(questionViewMapper(q));
        // });
        //
        // const result: PaginatorDto<QuestionViewDto> = {
        //     pagesCount: Math.ceil(
        //         countQuestions / query.queryDtoForQuiz.pageSize,
        //     ),
        //     pageSize: query.queryDtoForQuiz.pageSize,
        //     page: query.queryDtoForQuiz.pageNumber,
        //     totalCount: countQuestions,
        //     items: mappedQuestions,
        // };
        //
        // notice.addData(result);
        // return notice;
    }
}

export type GetStatisticResultType = MyStatisticViewDto;
