import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';
import { AnswerInputDto } from '../../api/dto/input/answer-input.dto';
import { QuizRepository } from '../../infrastructure/quiz.repository';
import { AnswerViewDto } from '../../api/dto/output/answer-view.dto';
import { answerViewDtoMapper } from '../../../../base/mappers/answer-view-mapper';
import { AnswerStatusesEnum } from '../../../../common/enum/answer-statuses.enum';
import { Answer } from '../../domain/answer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../../domain/game.entity';
import { GameQuestion } from '../../domain/game-question.entity';

export class CreateAnswerCommand {
    constructor(
        public userId: string,
        public answerInputDto: AnswerInputDto,
    ) {}
}

@CommandHandler(CreateAnswerCommand)
export class CreateAnswerUseCase
    implements
        ICommandHandler<CreateAnswerCommand, InterlayerNotice<AnswerViewDto>>
{
    constructor(
        private readonly quizRepository: QuizRepository,
        @InjectRepository(Answer) private answerRepo: Repository<Answer>,
    ) {}

    async execute(
        command: CreateAnswerCommand,
    ): Promise<InterlayerNotice<AnswerViewDto>> {
        const notice = new InterlayerNotice<AnswerViewDto>();

        const { answerInputDto, userId } = command;

        //проверить участвует ли пользователь в игре
        const isUserTakePartGame =
            await this.quizRepository.checkIsUserTakePartInGame(userId);
        if (!isUserTakePartGame) {
            notice.addError(
                'user is not found',
                'user',
                InterlayerStatuses.UNAUTHORIZED,
            );
            return notice;
        }

        //проверить есть ли активная игра
        const activeGame =
            await this.quizRepository.getActiveOrPendingGameOfUser(userId);
        if (!activeGame) {
            notice.addError(
                'user is not take part in active game',
                'user',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        //получить игрока
        const player = await this.quizRepository.getPlayerByUserIdAndGameId(
            userId,
            activeGame.id,
        );
        if (!activeGame) {
            notice.addError(
                'player is not found',
                'player',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        //проверить может он уже ответил на все вопросы
        const countAnswers = await this.quizRepository.getCountAnswers(
            player.id,
            activeGame.id,
        );

        if (countAnswers === 5) {
            notice.addError(
                'user already answers of 5 questions',
                'user',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        //получить вопрос для игрока
        const question = await this.quizRepository.getNextQuestion(
            player.id,
            activeGame.id,
        );
        if (!question) {
            notice.addError(
                'question is not found',
                'question',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        //получить статус ответа, правильный или нет
        const answerStatus = await this.quizRepository.getAnswerStatus(
            question.id,
            answerInputDto,
        );

        //добавить ответ
        const answer = await this.quizRepository.createAnswer(
            player.id,
            activeGame.id,
            question.id,
            answerStatus,
        );

        //если все ответы быстрее второй игрок еще не ответил, то плюс бал
        const game = await this.quizRepository.getGameById(activeGame.id);

        //получить id другого игрока
        let anotherPlayerId;
        if (game.player_1_id === player.id) {
            anotherPlayerId = game.player_2_id;
        } else {
            anotherPlayerId = game.player_1_id;
        }

        //посчитать у этого игрока кол-во ответов
        const anotherPlayerCountAnswers =
            await this.quizRepository.getCountAnswers(
                anotherPlayerId,
                activeGame.id,
            );
        const currentPlayerCountAnswers =
            await this.quizRepository.getCountAnswers(player.id, activeGame.id);
        const currentPlayerCountCorrectAnswers =
            await this.quizRepository.getCountCorrectAnswers(
                player.id,
                activeGame.id,
            );

        //если он еще не ответил на все вопросы, то этому игроку плюс бал
        if (
            anotherPlayerCountAnswers !== 5 &&
            currentPlayerCountAnswers === 5 &&
            currentPlayerCountCorrectAnswers > 0
        ) {
            await this.quizRepository.addScore(player.id);
        }

        if (
            anotherPlayerCountAnswers === 5 &&
            currentPlayerCountAnswers === 5
        ) {
            await this.quizRepository.finishGame(activeGame.id);
        }

        const mappedAnswer: AnswerViewDto = await this.answerRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect(
                GameQuestion,
                'gq',
                `gq."questionId" = a."questionId" and gq."gameId" = a."gameId"`,
            )
            .select([
                'gq.id as "questionId"',
                'a.status as "answerStatus"',
                'a."createdAt" as "addedAt"',
            ])
            .andWhere('a."id" = :answerId', {
                answerId: answer.id,
            })
            .getRawOne();

        notice.addData(mappedAnswer);
        return notice;
    }
}
