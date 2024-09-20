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

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Answer,
            Game,
            GameQuestion,
            Player,
            Question,
        ]),
    ],
    controllers: [QuizController],
    providers: [QuizService, QuizRepository],
    exports: [QuizService],
})
export class QuizModule {}
