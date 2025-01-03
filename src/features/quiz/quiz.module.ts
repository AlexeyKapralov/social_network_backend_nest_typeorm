import { Module } from '@nestjs/common';
import { QuizController } from './api/quiz.controller';
import { QuizService } from './application/quiz.service';
import { QuizRepository } from './infrastructure/quiz.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from './domain/answer.entity';
import { Game } from './domain/game.entity';
import { GameQuestion } from './domain/game-question.entity';
import { Player } from './domain/player.entity';
import { Question } from './domain/question.entity';
import { QuizSuperAdminController } from './api/quiz-super-admin.controller';
import { GetQuestionsQuery } from './infrastructure/queries/get-questions.query';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateAnswerUseCase } from './application/usecases/create-answer.command';
import { GetGameQuery } from './infrastructure/queries/get-game.query';
import { UsersModule } from '../users/users-module';
import { GetStatisticQuery } from './infrastructure/queries/get-my-statistic.query';
import { GetAllMyGamesQuery } from './infrastructure/queries/get-all-my-games.query';
import { GetTopPlayersQuery } from './infrastructure/queries/get-top-players.query';
import { User } from '../users/domain/user-entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        UsersModule,
        TypeOrmModule.forFeature([
            Answer,
            Game,
            User,
            GameQuestion,
            Player,
            Question,
        ]),
        CqrsModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [QuizController, QuizSuperAdminController],
    providers: [
        QuizService,
        QuizRepository,
        GetQuestionsQuery,
        GetStatisticQuery,
        GetAllMyGamesQuery,
        GetGameQuery,
        GetTopPlayersQuery,
        CreateAnswerUseCase,
    ],
    exports: [QuizService],
})
export class QuizModule {}
