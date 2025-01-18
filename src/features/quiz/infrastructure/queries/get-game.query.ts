import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../../domain/question.entity';
import { Repository } from 'typeorm';
import {
    GamePairViewDto,
    GameStatuses,
} from '../../api/dto/output/game-pair-view.dto';
import { Game } from '../../domain/game.entity';
import { User } from '../../../users/domain/user-entity';
import { Player } from '../../domain/player.entity';
import { Answer } from '../../domain/answer.entity';
import { GameQuestion } from '../../domain/game-question.entity';
import { QuizRepository } from '../quiz.repository';

export class GetGamePayload implements IQuery {
    constructor(
        public gameId: string,
        public userId: string,
    ) {}
}

@QueryHandler(GetGamePayload)
export class GetGameQuery
    implements
        IQueryHandler<GetGamePayload, InterlayerNotice<GetGameResultType>>
{
    constructor(
        @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
        @InjectRepository(Answer)
        private readonly answerRepo: Repository<Answer>,
        private readonly quizRepository: QuizRepository,
    ) {}

    async execute(
        query: GetGamePayload,
    ): Promise<InterlayerNotice<GetGameResultType>> {
        const notice = new InterlayerNotice<GetGameResultType>();

        const game = await this.quizRepository.getGameById(query.gameId);
        if (!game) {
            notice.addError(
                'game was not found',
                '',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const player = await this.quizRepository.getPlayerByUserIdAndGameId(
            query.userId,
            query.gameId,
        );
        if (!player) {
            notice.addError(
                'user dont participates in this game',
                '',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const gameWithPlayersAndQuestionsQuery = this.gameRepo
            .createQueryBuilder('g')
            .leftJoinAndSelect(Player, 'p1', `p1.id = g.player_1_id`)
            .leftJoinAndSelect(User, 'u1', `u1.id = p1."userId"`)
            .leftJoinAndSelect(Player, 'p2', `p2.id = g.player_2_id`)
            .leftJoinAndSelect(User, 'u2', `u2.id = p2."userId"`)
            .leftJoinAndSelect(GameQuestion, 'gq', `gq."gameId" = g."id"`)
            .leftJoinAndSelect(Question, 'q', `q."id" = gq."questionId"`)
            .select([
                'g.id as id',
                'g.status as status',
                'g."createdAt" as "pairCreatedDate"',
                'g."startedAt" as "startGameDate"',
                'g."finishedAt" as "finishGameDate"',
                `
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'answers', '[]'::json,
                        'player', JSON_BUILD_OBJECT(
                            'id', u1.id,
                            'login', u1.login
                        ),
                        'score', p1.score
                    )                    
                )::json->0 AS "firstPlayerProgress"
                `,
                `
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'answers', '[]'::json,
                        'player', JSON_BUILD_OBJECT(
                            'id', u2.id,
                            'login', u2.login
                        ),
                        'score', p2.score
                    )                    
                )::json->0 AS "secondPlayerProgress"
                `,
                `
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', gq."id",
                        'body', q.body
                    )
                    ORDER BY gq.index
                ) AS "questions"
                `,
            ])
            .where('g.id = :gameId', { gameId: query.gameId })
            .groupBy('g.id')
            .addGroupBy('g.status')
            .addGroupBy('g."createdAt"')
            .addGroupBy('g."startedAt"')
            .addGroupBy('g."finishedAt"');

        const player1AnswersQuery = this.answerRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect(Game, 'g', `g.id = a."gameId"`)
            .leftJoinAndSelect(
                GameQuestion,
                'gq',
                `gq."questionId" = a."questionId" and gq."gameId" = a."gameId"`,
            )
            .select([
                `
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'questionId', gq.id,
                        'answerStatus', a.status,
                        'addedAt', TO_CHAR(a."createdAt"  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                    )
                ) "answers"
                `,
            ])
            .where('a."gameId" = :gameId', { gameId: query.gameId })
            .andWhere('a."playerId" = :playerId', {
                playerId: game.player_1_id,
            });

        const player2AnswersQuery = this.answerRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect(Game, 'g', `g.id = a."gameId"`)
            .leftJoinAndSelect(
                GameQuestion,
                'gq',
                `gq."questionId" = a."questionId" and gq."gameId" = a."gameId"`,
            )
            .select([
                `
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'questionId', gq.id,
                        'answerStatus', a.status,
                        'addedAt', TO_CHAR(a."createdAt"  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                    )
                ) "answers"
                `,
            ])
            .where('a."gameId" = :gameId', { gameId: query.gameId })
            .andWhere('a."playerId" = :playerId', {
                playerId: game.player_2_id,
            });

        const gameWithPlayersAndQuestions =
            await gameWithPlayersAndQuestionsQuery.getRawOne();
        const player1Answers = await player1AnswersQuery.getRawOne();
        const player2Answers = await player2AnswersQuery.getRawOne();

        if (
            gameWithPlayersAndQuestions.status ===
            GameStatuses.PendingSecondPlayer
        ) {
            gameWithPlayersAndQuestions.secondPlayerProgress = null;
            gameWithPlayersAndQuestions.questions = null;
        } else {
            gameWithPlayersAndQuestions.firstPlayerProgress['answers'] =
                player1Answers.answers || [];
            gameWithPlayersAndQuestions.secondPlayerProgress['answers'] =
                player2Answers.answers || [];
        }

        notice.addData(gameWithPlayersAndQuestions);
        return notice;
    }
}

export type GetGameResultType = GamePairViewDto;
