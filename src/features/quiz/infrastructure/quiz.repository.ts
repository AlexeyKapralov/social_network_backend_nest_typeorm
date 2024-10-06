import { Injectable } from '@nestjs/common';
import { Game } from '../domain/game.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { GameStatuses } from '../api/dto/output/game-pair-view.dto';
import { Player } from '../domain/player.entity';
import { v4 as uuid } from 'uuid';
import { QuestionInputDto } from '../api/dto/input/question-input.dto';
import { Question } from '../domain/question.entity';
import { PublishInputDto } from '../api/dto/input/publish-input.dto';
import { Answer } from '../domain/answer.entity';
import { GameQuestion } from '../domain/game-question.entity';
import { AnswerInputDto } from '../api/dto/input/answer-input.dto';
import { AnswerStatusesEnum } from '../../../common/enum/answer-statuses.enum';

@Injectable()
export class QuizRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        @InjectRepository(Game) private gameRepo: Repository<Game>,
        @InjectRepository(Question) private questionRepo: Repository<Question>,
        @InjectRepository(Player) private playerRepo: Repository<Player>,
    ) {}

    async getPendingGame(): Promise<Game | null> {
        return await this.gameRepo.findOne({
            where: {
                status: GameStatuses.PendingSecondPlayer,
            },
        });
    }

    async getGameById(gameId: string): Promise<Game | null> {
        return await this.gameRepo.findOne({
            where: {
                id: gameId,
            },
        });
    }

    async getPlayerById(playerId: string): Promise<Player | null> {
        return await this.playerRepo.findOne({
            where: {
                id: playerId,
            },
            relations: {
                user: true,
            },
        });
    }

    async getPlayerByUserIdAndGameId(
        userId: string,
        gameId: string,
    ): Promise<Player | null> {
        return await this.playerRepo.findOne({
            where: {
                user: {
                    id: userId,
                },
                game: {
                    id: gameId,
                },
            },
        });
    }

    async checkIsUserTakePartInGame(userId: string): Promise<boolean> {
        const games = await this.gameRepo.find({
            where: [
                { status: GameStatuses.Active },
                { status: GameStatuses.PendingSecondPlayer },
            ],
        });

        const gamesIds = games.map((game: Game) => game.id);

        const players = await this.playerRepo.find({
            where: {
                game: { id: In([...gamesIds]) },
                user: { id: userId },
            },
        });

        return players.length > 0;
    }

    async getActiveOrPendingGameOfUser(userId: string): Promise<Game | null> {
        const games = await this.gameRepo.find({
            where: [
                { status: GameStatuses.Active },
                { status: GameStatuses.PendingSecondPlayer },
            ],
        });

        if (games.length === 0) {
            return null;
        }

        const gamesIds = games.map((game: Game) => game.id);

        const players = await this.playerRepo.find({
            where: {
                game: { id: In([...gamesIds]) },
                user: { id: userId },
            },
        });

        if (players.length === 0) {
            return null;
        }

        const activeGame = await this.gameRepo.findOne({
            where: [
                {
                    status: GameStatuses.Active,
                    player_1_id: players[0].id,
                },
                {
                    status: GameStatuses.PendingSecondPlayer,
                    player_1_id: players[0].id,
                },
                {
                    status: GameStatuses.Active,
                    player_2_id: players[0].id,
                },
                {
                    status: GameStatuses.PendingSecondPlayer,
                    player_2_id: players[0].id,
                },
            ],
        });
        return activeGame;
    }

    async getActiveGameOfUser(userId: string): Promise<Game | null> {
        const games = await this.gameRepo.find({
            where: [
                { status: GameStatuses.Active },
                { status: GameStatuses.PendingSecondPlayer },
            ],
        });

        if (games.length === 0) {
            return null;
        }

        const gamesIds = games.map((game: Game) => game.id);

        const players = await this.playerRepo.find({
            where: {
                game: { id: In([...gamesIds]) },
                user: { id: userId },
            },
        });

        if (players.length === 0) {
            return null;
        }

        const activeGame = await this.gameRepo.findOne({
            where: [
                {
                    status: GameStatuses.Active,
                    player_1_id: players[0].id,
                },
                {
                    status: GameStatuses.PendingSecondPlayer,
                    player_1_id: players[0].id,
                },
                {
                    status: GameStatuses.Active,
                    player_2_id: players[0].id,
                },
                {
                    status: GameStatuses.PendingSecondPlayer,
                    player_2_id: players[0].id,
                },
            ],
        });
        return activeGame;
    }

    async getPendingGameOfUser(userId: string): Promise<Game | null> {
        const games = await this.gameRepo.find({
            where: { status: GameStatuses.PendingSecondPlayer },
        });

        if (games.length === 0) {
            return null;
        }

        const gamesIds = games.map((game: Game) => game.id);

        const players = await this.playerRepo.find({
            where: {
                game: { id: In([...gamesIds]) },
                user: { id: userId },
            },
        });
        if (players.length === 0) {
            return null;
        }

        const pendingGame = await this.gameRepo.findOne({
            where: [
                {
                    status: GameStatuses.PendingSecondPlayer,
                    player_1_id: players[0].id,
                },
                {
                    status: GameStatuses.PendingSecondPlayer,
                    player_2_id: players[0].id,
                },
            ],
        });
        return pendingGame;
    }

    async getTotalCountQuestions(): Promise<boolean> {
        const questions = await this.questionRepo.count();

        return questions >= 5;
    }

    async createGame(userId: string): Promise<Game | null> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const id = uuid();

            // todo создать игру
            const gameRepository = queryRunner.manager.getRepository(Game);
            const game = gameRepository.create({
                status: GameStatuses.PendingSecondPlayer,
                player_1_id: id,
                player_2_id: null,
                gameQuestions: [],
                createdAt: new Date(),
                startedAt: null,
                finishedAt: null,
                answers: [],
            });
            await game.save();

            //todo создать игрока
            const playerRepository = queryRunner.manager.getRepository(Player);
            const player = playerRepository.create({
                id: id,
                game: game,
                score: 0,
                user: {
                    id: userId,
                },
            });

            await player.save();
            await queryRunner.commitTransaction();
            //todo вернуть игру
            return game;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async createAnswer(
        playerId: string,
        gameId: string,
        questionId: string,
        answerStatus: AnswerStatusesEnum,
    ): Promise<Answer | null> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // создать игру
            const answerRepository = queryRunner.manager.getRepository(Answer);
            const answer = answerRepository.create({
                status: answerStatus,
                createdAt: new Date().toISOString(),
                player: {
                    id: playerId,
                },
                game: {
                    id: gameId,
                },
                question: {
                    id: questionId,
                },
            });

            await answerRepository.save(answer);

            //если ответ правильный, то добавить score
            if (answerStatus === AnswerStatusesEnum.Correct) {
                const playerRepository =
                    queryRunner.manager.getRepository(Player);
                const player = await playerRepository.findOne({
                    where: {
                        id: playerId,
                    },
                });
                player.score++;
                await playerRepository.save(player);
            }

            await queryRunner.commitTransaction();
            return answer;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async getAnswerStatus(
        questionId: string,
        answerInputDto: AnswerInputDto,
    ): Promise<AnswerStatusesEnum> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const questionRepository =
                queryRunner.manager.getRepository(Question);
            const question = await questionRepository.findOne({
                where: {
                    id: questionId,
                },
            });

            if (
                !question.answers
                    .map((i) => i.trim())
                    .includes(answerInputDto.answer)
            ) {
                await queryRunner.rollbackTransaction();
                return AnswerStatusesEnum.Incorrect;
            }

            await queryRunner.commitTransaction();
            return AnswerStatusesEnum.Correct;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async connectToGame(gameId: string, userId: string): Promise<Game | null> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            //todo создать игрока
            const playerRepository = queryRunner.manager.getRepository(Player);
            const player = playerRepository.create({
                score: 0,
                user: {
                    id: userId,
                },
                game: { id: gameId },
            });
            await player.save();

            //todo попробовать присоединиться
            const gameRepository = queryRunner.manager.getRepository(Game);
            const updateGame = await gameRepository.update(
                {
                    status: GameStatuses.PendingSecondPlayer,
                    id: gameId,
                },
                {
                    player_2_id: player.id,
                    startedAt: new Date(),
                    status: GameStatuses.Active,
                },
            );

            if (updateGame.affected === 1) {
                //todo обновить добавить в игру 5 случайных вопросов
                const questions = await this.dataSource
                    .getRepository(Question)
                    .createQueryBuilder('q')
                    .select('id')
                    .limit(5)
                    .orderBy('RANDOM()')
                    .getRawMany();

                //todo по очереди добавить в таблицу game_question
                const gameQuestionRepository =
                    this.dataSource.getRepository(GameQuestion);

                let iterator = 0;
                const promises = questions.map(async (question) => {
                    const gameQuestion = new GameQuestion();
                    gameQuestion.index = iterator++;
                    gameQuestion.game = { id: gameId } as Game;
                    gameQuestion.question = {
                        id: question.id,
                    } as Question;
                    return await gameQuestionRepository.save(gameQuestion);
                });
                Promise.all(promises)
                    .then((results) => {
                        console.log(
                            'Все асинхронные операции завершены:',
                            results,
                        );
                    })
                    .catch((error) => {
                        console.error(
                            'Ошибка при выполнении асинхронных операций:',
                            error,
                        );
                    });

                await queryRunner.commitTransaction();
                return await this.gameRepo.findOne({
                    where: {
                        status: GameStatuses.Active,
                        id: gameId,
                    },
                    relations: {
                        gameQuestions: {
                            question: true,
                        },
                    },
                    order: {
                        gameQuestions: { index: 'ASC' },
                    },
                });
            }
            await queryRunner.commitTransaction();
            return null;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async getQuestion(questionBody: string): Promise<Question | null> {
        return await this.dataSource.getRepository(Question).findOne({
            where: {
                body: questionBody,
                published: true,
                deletedAt: null,
            },
        });
    }

    async getQuestionById(id: string): Promise<Question | null> {
        return await this.dataSource.getRepository(Question).findOne({
            where: {
                id: id,
                deletedAt: null,
            },
        });
    }

    async createQuestion(
        questionInputDto: QuestionInputDto,
    ): Promise<Question | null> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const questionRepository =
                queryRunner.manager.getRepository(Question);
            const question = questionRepository.create({
                body: questionInputDto.body,
                answers: questionInputDto.correctAnswers,
                published: false,
                createdAt: new Date(),
                updatedAt: null,
                deletedAt: null,
            });
            await question.save();
            await queryRunner.commitTransaction();
            return question;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async deleteQuestion(id: string): Promise<boolean> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const questionRepository =
                queryRunner.manager.getRepository(Question);
            const question = await questionRepository.findOne({
                where: {
                    id: id,
                    deletedAt: null,
                },
            });
            question.published = false;
            question.deletedAt = new Date();
            await questionRepository.save(question);

            await queryRunner.commitTransaction();
            return true;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return false;
        } finally {
            await queryRunner.release();
        }
    }

    async updateQuestion(
        id: string,
        questionInputDto: QuestionInputDto,
    ): Promise<boolean> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const questionRepository =
                queryRunner.manager.getRepository(Question);
            const questionResult = await questionRepository.update(
                {
                    id: id,
                    deletedAt: IsNull(),
                },
                {
                    body: questionInputDto.body,
                    answers: questionInputDto.correctAnswers,
                    updatedAt: new Date(),
                },
            );
            await queryRunner.commitTransaction();
            return questionResult.raw >= 0;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return false;
        } finally {
            await queryRunner.release();
        }
    }

    async updatePublishedStatusQuestion(
        id: string,
        publishInputDto: PublishInputDto,
    ): Promise<boolean> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const questionRepository =
                queryRunner.manager.getRepository(Question);
            const question = await questionRepository.findOne({
                where: {
                    id: id,
                    deletedAt: IsNull(),
                },
            });
            question.published = publishInputDto.published;
            question.updatedAt = new Date();
            await questionRepository.save(question);

            await queryRunner.commitTransaction();
            return true;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return false;
        } finally {
            await queryRunner.release();
        }
    }

    async getCountAnswers(
        playerId: string,
        gameId: string,
    ): Promise<number | null> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const answerRepository = queryRunner.manager.getRepository(Answer);
            const answersCount = await answerRepository.count({
                where: {
                    game: {
                        id: gameId,
                    },
                    player: {
                        id: playerId,
                    },
                },
            });
            await queryRunner.commitTransaction();
            return answersCount;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async checkIsAllAnswersFasterAnotherPLayer(
        currentPlayerId: string,
        gameId: string,
    ): Promise<{
        currentIsFaster: boolean;
        anotherIsFaster: boolean;
    } | null> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const answerRepository = queryRunner.manager.getRepository(Answer);
            const answersCount: Array<{
                currentIsFaster: boolean;
                anotherIsFaster: boolean;
            }> = await answerRepository.query(
                `
            select bool_and(t2.currentIsFaster) "currentIsFaster", bool_and(t2.anotherIsFaster) "anotherIsFaster" from 
            (
                SELECT 
                    CASE 
                        WHEN a."createdAt" < a2."createdAt" or a2."createdAt" is null THEN true
                        ELSE false 
                    END AS currentIsFaster,
                    CASE 
                        WHEN a."createdAt" > a2."createdAt" THEN true
                        ELSE false 
                    END AS anotherIsFaster
                from answer a
                left join (
                    --another player
                    SELECT * from answer a
                    where a."gameId" = $2 and a."playerId" <> $1
                ) a2 on a2."questionId" = a."questionId" 
                where 
                a."gameId" = $2 and 
                a."playerId" = $1
            ) as t2
            `,
                [currentPlayerId, gameId],
            );
            await queryRunner.commitTransaction();
            return answersCount[0];
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async getCountCorrectAnswers(
        playerId: string,
        gameId: string,
    ): Promise<number | null> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const answerRepository = queryRunner.manager.getRepository(Answer);
            const answersCount = await answerRepository.count({
                where: {
                    status: AnswerStatusesEnum.Correct,
                    game: {
                        id: gameId,
                    },
                    player: {
                        id: playerId,
                    },
                },
            });
            await queryRunner.commitTransaction();
            return answersCount;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async getNextQuestion(
        playerId: string,
        gameId: string,
    ): Promise<Question | null> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            //найти все ответы к игре этого игрока и посчитать их кол-во
            const answerRepository = queryRunner.manager.getRepository(Answer);
            const answersCount = await answerRepository.count({
                where: {
                    game: {
                        id: gameId,
                    },
                    player: {
                        id: playerId,
                    },
                },
            });
            if (answersCount === 5) {
                return null;
            }
            //взять следующий вопрос, т.е. если на 2 ответил то взять по индексу 2 в game_question
            const gameQuestionRepository =
                queryRunner.manager.getRepository(GameQuestion);
            const gameQuestion = await gameQuestionRepository.findOne({
                where: {
                    game: {
                        id: gameId,
                    },
                    index: answersCount,
                },
                relations: {
                    question: true,
                },
            });

            //вернуть вопрос
            const questionRepository =
                queryRunner.manager.getRepository(Question);
            const question = await questionRepository.findOne({
                where: {
                    id: gameQuestion.question.id,
                },
            });

            await queryRunner.commitTransaction();
            return question;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async addScore(playerId: string): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const playerRepository = queryRunner.manager.getRepository(Player);
            const player = await playerRepository.findOne({
                where: {
                    id: playerId,
                },
            });
            player.score++;
            await playerRepository.save(player);

            await queryRunner.commitTransaction();
        } catch (e) {
            console.log(e);
            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
    }

    async finishGame(gameId: string): Promise<boolean> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const gameRepository = queryRunner.manager.getRepository(Game);
            const game = await gameRepository.findOne({
                where: {
                    id: gameId,
                },
            });

            game.status = GameStatuses.Finished;
            game.finishedAt = new Date();
            await gameRepository.save(game);

            await queryRunner.commitTransaction();
            return true;
        } catch (e) {
            console.log(e);
            await queryRunner.rollbackTransaction();
            return false;
        } finally {
            await queryRunner.release();
        }
    }
}
