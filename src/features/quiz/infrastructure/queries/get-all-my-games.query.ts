import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Player } from '../../domain/player.entity';
import { GamePairViewDto } from '../../api/dto/output/game-pair-view.dto';
import { PaginatorDto } from '../../../../common/dto/paginator-dto';
import {
    QueryDtoForGetAllGames,
    SortField,
} from '../../../../common/dto/query-dto';
import { Game } from '../../domain/game.entity';

export class GetAllMyGamesPayload implements IQuery {
    constructor(
        public query: QueryDtoForGetAllGames,
        public userId: string,
    ) {}
}

@QueryHandler(GetAllMyGamesPayload)
export class GetAllMyGamesQuery
    implements
        IQueryHandler<
            GetAllMyGamesPayload,
            InterlayerNotice<GetMyAllGamesResultType>
        >
{
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        @InjectRepository(Player)
        private readonly playerRepo: Repository<Player>,
        @InjectRepository(Game)
        private readonly gameRepo: Repository<Game>,
    ) {}

    async execute(
        query: GetAllMyGamesPayload,
    ): Promise<InterlayerNotice<GetMyAllGamesResultType>> {
        const notice = new InterlayerNotice<GetMyAllGamesResultType>();

        //надо по user id получить всех playerId
        const players = await this.playerRepo.find({
            where: {
                user: {
                    id: query.userId,
                },
            },
            select: {
                game: { id: true },
            },
            relations: ['game'],
        });
        console.log('players', players);

        if (!players.length) {
            notice.addError(
                'data is not found',
                '',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }
        const gameIds = players.map((g) => {
            return g.game.id;
        });
        console.log('gameIds', gameIds);

        const gameIdsStr = gameIds.map((i) => `'${i}'`).join(',');

        //определение поля для сортировки
        let sort = null;
        switch (query.query.sortBy) {
            case SortField.id: {
                sort = 'game.id';
                break;
            }
            case SortField.finishGameDate: {
                sort = 'game."finishedAt"';
                break;
            }
            case SortField.status: {
                sort = 'game.status';
                break;
            }
            case SortField.startGameDate: {
                sort = 'game."startedAt"';
                break;
            }
            case SortField.pairCreatedDate: {
                sort = 'game."createdAt"';
                break;
            }
        }

        //основной запрос для игр
        const baseGames = this.gameRepo
            .createQueryBuilder('game')
            .where('game.id IN (:...gameIds)', { gameIds })
            .leftJoinAndSelect('game.gameQuestions', 'gameQuestions')
            .leftJoinAndSelect('gameQuestions.question', 'question')
            .select([
                'game.id',
                'game.status',
                'game.createdAt',
                'game.startedAt',
                'game.player_1_id',
                'game.player_2_id',
                'game.finishedAt',
                'gameQuestions.id',
                'question.body',
            ])
            .orderBy(sort, query.query.sortDirection);

        console.log('baseGames', baseGames);

        const games = await baseGames
            .limit(query.query.pageSize)
            .skip((query.query.pageNumber - 1) * query.query.pageSize)
            .getMany();

        console.log('games', games);

        const gamesCount = await baseGames.getCount();
        console.log('gamesCount', gamesCount);

        //для них все answers
        //получение player 1
        const gamesWithAnswersAndPlayers1 = await this.dataSource.query(
            `
            select
                g.id,
                a."questionId",
                a.status as "answerStatus",
                a."createdAt" as "addedAt",
                u.login,
                u.id as "playerId",
                p.score from game g
            left join player p on g.player_1_id = p.id
            left join answer a ON a."playerId" = p.id
            left join "user" u on u.id = p."userId"
            WHERE g."id" IN (${gameIdsStr})
            `,
        );

        console.log('gamesWithAnswersAndPlayers1', gamesWithAnswersAndPlayers1);

        //получение player 2
        const gamesWithAnswersAndPlayers2 = await this.dataSource.query(
            `
            select
                g.id,
                a."questionId",
                a.status as "answerStatus",
                a."createdAt" as "addedAt",
                u.login,
                u.id as "playerId",
                p.score from game g
            left join player p on g.player_2_id = p.id
            left join answer a ON a."playerId" = p.id
            left join "user" u on u.id = p."userId"
            WHERE g."id" IN (${gameIdsStr})
            `,
        );
        console.log('gamesWithAnswersAndPlayers2', gamesWithAnswersAndPlayers2);

        //для каждой game свои gameQuestion и по ним Question (id и body)
        const items = games.map((game) => {
            //mapping for player 1
            const firstPlayerProgress = {
                answers: [],
                player: {},
                score: 0,
            };
            gamesWithAnswersAndPlayers1.map((el) => {
                if (el.id === game.id) {
                    firstPlayerProgress.player = {
                        id: el.playerId,
                        login: el.login,
                    };
                    firstPlayerProgress.score = el.score;

                    if (el.questionId) {
                        const obj = {
                            questionId: el.questionId,
                            answerStatus: el.questionId,
                            addedAt: el.addedAt,
                        };
                        firstPlayerProgress.answers.push(obj);
                    }
                }
            });

            //mapping for player 2
            const secondPlayerProgress = {
                answers: [],
                player: {},
                score: 0,
            };
            gamesWithAnswersAndPlayers2.map((el) => {
                if (el.id === game.id) {
                    secondPlayerProgress.player = {
                        id: el.playerId,
                        login: el.login,
                    };
                    secondPlayerProgress.score = el.score;
                    if (el.questionId) {
                        const obj = {
                            questionId: el.questionId,
                            answerStatus: el.questionId,
                            addedAt: el.addedAt,
                        };
                        secondPlayerProgress.answers.push(obj);
                    }
                }
            });

            return {
                id: game.id,
                firstPlayerProgress: firstPlayerProgress,
                secondPlayerProgress: secondPlayerProgress,
                questions: game.gameQuestions?.length
                    ? game.gameQuestions.map((i) => ({
                          id: i.id,
                          body: i.question.body,
                      }))
                    : null,
                status: game.status,
                finishGameDate: game.finishedAt,
                pairCreatedDate: game.createdAt,
                startGameDate: game.startedAt,
            };
        }) as any;

        notice.addData({
            pagesCount: Math.ceil(gamesCount / query.query.pageSize),
            page: query.query.pageNumber,
            pageSize: query.query.pageSize,
            totalCount: gamesCount,
            items: items,
        });

        return notice;
    }
}

export type GetMyAllGamesResultType = PaginatorDto<GamePairViewDto>;
