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

@Module({
    imports: [
        UsersModule,
        TypeOrmModule.forFeature([
            Answer,
            Game,
            GameQuestion,
            Player,
            Question,
        ]),
        CqrsModule,
    ],
    controllers: [QuizController, QuizSuperAdminController],
    providers: [
        QuizService,
        QuizRepository,
        GetQuestionsQuery,
        GetStatisticQuery,
        GetGameQuery,
        CreateAnswerUseCase,
    ],
    exports: [QuizService],
})
export class QuizModule {}
