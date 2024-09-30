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

@Module({
    imports: [
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
        CreateAnswerUseCase,
    ],
    exports: [QuizService],
})
export class QuizModule {}
