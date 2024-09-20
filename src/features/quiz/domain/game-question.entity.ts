import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { Question } from './question.entity';

@Entity()
export class GameQuestion extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    index: number;

    @ManyToOne(() => Game, (game) => game.gameQuestions)
    @JoinColumn({ name: 'gameId' })
    game: Game;

    @ManyToOne(() => Question, (question) => question.gameQuestions)
    @JoinColumn({ name: 'questionId' })
    question: Question;
}
