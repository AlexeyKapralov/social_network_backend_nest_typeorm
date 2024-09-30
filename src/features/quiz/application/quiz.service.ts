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
import { Player } from '../domain/player.entity';
import { QuestionInputDto } from '../api/dto/input/question-input.dto';
import { questionViewMapper } from '../../../base/mappers/question-view-mapper';
import { PublishInputDto } from '../api/dto/input/publish-input.dto';

@Injectable()
export class QuizService {
    constructor(private quizRepository: QuizRepository) {}

    //todo переписать в useCase или Command Handler
    async createConnection(
        userId: string,
    ): Promise<InterlayerNotice<GamePairViewDto>> {
        const notice = new InterlayerNotice<GamePairViewDto>();
        //todo не участвует ли игрок уже в игре
        const isTakePart =
            await this.quizRepository.checkIsUserTakePartInGame(userId);
        if (isTakePart) {
            notice.addError(
                'user is already participating in active pair',
                'user',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        //todo есть ли игра свободная, т.е. без второго игрока
        let game: Game;
        let connectionResult: boolean;
        game = await this.quizRepository.getPendingGame();
        if (!game) {
            //todo если игры в ожидании нет, то создать игрока и создать игру
            game = await this.quizRepository.createGame(userId);
        } else {
            //todo если игра есть то присоединиться к игре
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

        let questions = [];
        if (game.gameQuestions.length > 0) {
            game.gameQuestions.map((gq) => {
                let gameQuestion = {
                    id: gq.id,
                    body: gq.question.body,
                };
                questions.push(gameQuestion);
            });
        }

        let player1: Player;
        let player2: Player;
        if (game.player_1_id) {
            player1 = await this.quizRepository.getPlayerById(game.player_1_id);
        }
        if (game.player_2_id) {
            player2 = await this.quizRepository.getPlayerById(game.player_2_id);
        }

        const mappedGame: GamePairViewDto = {
            id: game.id,
            firstPlayerProgress: {
                answers: [],
                player: player1
                    ? {
                          id: player1.id,
                          login: player1.user.login,
                      }
                    : {},
                score: player1 ? player1.score : 0,
            } as GamePlayerProgressViewDto,
            secondPlayerProgress: {
                answers: [],
                player: player2
                    ? {
                          id: player2.id,
                          login: player2.user.login,
                      }
                    : {},
                score: player2 ? player2.score : 0,
            } as GamePlayerProgressViewDto,
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

    async createQuestion(
        questionInputDto: QuestionInputDto,
    ): Promise<InterlayerNotice<QuestionViewDto>> {
        const notice = new InterlayerNotice<QuestionViewDto>();

        //todo проверить нет ли такого же вопроса уже
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

        //todo проверить есть ли такой вопрос
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

        //todo проверить есть ли такой вопрос
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

        //todo обновить
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

        //todo проверить есть ли такой вопрос
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

        //todo обновить
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
}
