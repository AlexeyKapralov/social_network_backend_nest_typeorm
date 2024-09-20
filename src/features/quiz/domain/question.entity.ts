import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { GameQuestion } from './game-question.entity';

@Entity()
export class Question extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ collation: 'C' })
    body: string;

    @Column({ type: 'simple-array' })
    answers: string[];

    @ManyToOne(() => GameQuestion)
    @JoinColumn({ name: 'gameQuestionsId' })
    gameQuestions: GameQuestion[];
}
