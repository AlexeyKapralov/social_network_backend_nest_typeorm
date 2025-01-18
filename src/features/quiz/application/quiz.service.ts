import { Injectable } from '@nestjs/common';
import { QuizRepository } from '../infrastructure/quiz.repository';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../base/models/interlayer';
import { GamePairViewDto } from '../api/dto/output/game-pair-view.dto';
import { Game } from '../domain/game.entity';
import { GamePlayerProgressViewDto } from '../api/dto/output/game-player-progress-view.dto';
import { QuestionViewDto } from '../api/dto/output/question-view.dto';
import { QuestionInputDto } from '../api/dto/input/question-input.dto';
import { questionViewMapper } from '../../../base/mappers/question-view-mapper';
import { PublishInputDto } from '../api/dto/input/publish-input.dto';
import { UsersRepository } from '../../users/infrastructure/users-repository';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class QuizService {
    constructor(
        private readonly quizRepository: QuizRepository,
        private readonly usersRepository: UsersRepository,
    ) {}

    //переписать в useCase или Command Handler
    async createConnection(
        userId: string,
    ): Promise<InterlayerNotice<GamePairViewDto>> {
        const notice = new InterlayerNotice<GamePairViewDto>();

        // существует ли юзер
        const user = await this.usersRepository.findUser(userId);
        if (!user) {
            console.log('user is no exist or not confirmed', userId);
            notice.addError(
                'user is not exists',
                'userId',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        // не участвует ли игрок уже в игре
        const isTakePart =
            await this.quizRepository.checkIsUserTakePartInGame(userId);
        if (isTakePart) {
            console.log('user is already participating in active pair');
            notice.addError(
                'user is already participating in active pair',
                'user',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        //проверить существуют ли вопросы вообще
        let questionsTotal = await this.quizRepository.getTotalCountQuestions();
        if (!questionsTotal) {
            console.log('questions was not created');
            notice.addError(
                'questions was not created',
                'questions',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        // есть ли игра свободная, т.е. без второго игрока
        let game: Game;
        let connectionResult: boolean;
        game = await this.quizRepository.getPendingGame();
        if (!game) {
            // если игры в ожидании нет, то создать игрока и создать игру
            game = await this.quizRepository.createGame(userId);
        } else {
            // если игра есть то присоединиться к игре
            game = await this.quizRepository.connectToGame(game.id, userId);
        }
        if (!game) {
            notice.addError(
                'user was not connected to pair',
                'user',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        let questions = this.setGameQuestions(game);

        let player1 = await this.quizRepository.getPlayerById(
            game?.player_1_id,
        );
        let player2 = await this.quizRepository.getPlayerById(
            game?.player_2_id,
        );

        const mappedGame: GamePairViewDto = {
            id: game.id,
            firstPlayerProgress: player1
                ? {
                      answers: [],
                      player: {
                          id: player1.user.id,
                          login: player1.user.login,
                      },
                      score: player1 ? player1.score : 0,
                  }
                : (null as GamePlayerProgressViewDto),
            secondPlayerProgress: player2
                ? {
                      answers: [],
                      player: {
                          id: player2.user.id,
                          login: player2.user.login,
                      },
                      score: player2 ? player2.score : 0,
                  }
                : (null as GamePlayerProgressViewDto),
            questions: questions,
            status: game.status,
            pairCreatedDate: game.createdAt.toISOString(),
            startGameDate: game.startedAt ? game.startedAt.toISOString() : null,
            finishGameDate: game.finishedAt
                ? game.finishedAt.toISOString()
                : null,
        };
        notice.addData(mappedGame);
        return notice;
    }

    private setGameQuestions(game: Game): any[] {
        let questions = [];
        if (game.gameQuestions.length > 0) {
            game.gameQuestions.forEach((gq) => {
                let gameQuestion = {
                    id: gq.id,
                    body: gq.question.body,
                };
                questions.push(gameQuestion);
            });
        } else {
            questions = null;
        }
        return questions;
    }

    async createQuestion(
        questionInputDto: QuestionInputDto,
    ): Promise<InterlayerNotice<QuestionViewDto>> {
        const notice = new InterlayerNotice<QuestionViewDto>();

        // проверить нет ли такого же вопроса уже
        const existQuestion = await this.quizRepository.getQuestion(
            questionInputDto.body,
        );
        if (existQuestion) {
            notice.addError(
                'question already exist',
                'body',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const question =
            await this.quizRepository.createQuestion(questionInputDto);
        if (!question) {
            notice.addError(
                'question was not created',
                'question',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        notice.addData(questionViewMapper(question));
        return notice;
    }

    async deleteQuestion(questionId: string): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        // проверить есть ли такой вопрос
        const existQuestion =
            await this.quizRepository.getQuestionById(questionId);
        if (!existQuestion) {
            notice.addError(
                'question did not found',
                'question',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const isDeleteQuestion =
            await this.quizRepository.deleteQuestion(questionId);
        if (!isDeleteQuestion) {
            notice.addError(
                'question was not deleted',
                'question',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        return notice;
    }

    async updateQuestion(
        questionId: string,
        questionInputDto: QuestionInputDto,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        // проверить есть ли такой вопрос
        const existQuestion =
            await this.quizRepository.getQuestionById(questionId);
        if (!existQuestion) {
            notice.addError(
                'question did not found',
                'question',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        // обновить
        const isUpdatedQuestion = await this.quizRepository.updateQuestion(
            questionId,
            questionInputDto,
        );
        if (!isUpdatedQuestion) {
            notice.addError(
                'question was not updated',
                'question',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        return notice;
    }

    async updatePublishedStatusQuestion(
        questionId: string,
        publishInputDto: PublishInputDto,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        // проверить есть ли такой вопрос
        const existQuestion =
            await this.quizRepository.getQuestionById(questionId);
        if (!existQuestion) {
            notice.addError(
                'question did not found',
                'question',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        // обновить
        const isUpdatedQuestion =
            await this.quizRepository.updatePublishedStatusQuestion(
                questionId,
                publishInputDto,
            );
        if (!isUpdatedQuestion) {
            notice.addError(
                'question published was not updated',
                'question published',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        return notice;
    }

    async getActiveGameByUserId(
        userId: string,
    ): Promise<InterlayerNotice<Game>> {
        const notice = new InterlayerNotice<Game>();

        // проверить участвует ли юзер в игре
        const game =
            await this.quizRepository.getActiveOrPendingGameOfUser(userId);
        if (!game) {
            notice.addError(
                `user don't participate in active game`,
                'user',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        notice.addData(game);
        return notice;
    }

    @Cron('*/10 * * * * *')
    async setFinishedGamesWithNoAnswerOfSecondPlayer(
        userId: string,
    ): Promise<void> {
        console.log('Called every 10 seconds');

        await this.quizRepository.setFinishedGamesWithNoAnswerOfSecondPlayer();
    }
}
