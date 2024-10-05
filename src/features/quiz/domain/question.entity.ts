import {
    BaseEntity,
    Column,
    DeleteDateColumn,
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

    @Column({ default: false })
    published: boolean;

    @Column({ type: 'timestamptz' })
    createdAt: Date;

    @Column({ nullable: true, type: 'timestamptz' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamptz' })
    deletedAt: Date;

    @ManyToOne(() => GameQuestion)
    @JoinColumn({ name: 'gameQuestionsId' })
    gameQuestions: GameQuestion[];
}
