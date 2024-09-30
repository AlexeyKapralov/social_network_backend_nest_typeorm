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
    constructor(private readonly quizRepository: QuizRepository) {}

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
            await this.quizRepository.getActiveGameOfUser(userId);
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

        //если второй игрок еще не ответил, то плюс бал
        const game = await this.quizRepository.getGameById(activeGame.id);

        //получить id другого игрока
        let anotherPlayerId;
        if (game.player_1_id === player.id) {
            anotherPlayerId = game.player_1_id;
        } else {
            anotherPlayerId = game.player_2_id;
        }

        //посчитать у этого игрока кол-во ответов
        const anotherPlayerCountAnswers =
            await this.quizRepository.getCountAnswers(
                anotherPlayerId,
                activeGame.id,
            );
        const currentPlayerCountAnswers =
            await this.quizRepository.getCountAnswers(player.id, activeGame.id);
        //если он еще не ответил на все вопросы, то этому игроку плюс бал
        if (
            anotherPlayerCountAnswers !== 5 &&
            currentPlayerCountAnswers === 5
        ) {
            await this.quizRepository.addScore(player.id);
        }

        notice.addData(answerViewDtoMapper(answer));
        return notice;
    }
}