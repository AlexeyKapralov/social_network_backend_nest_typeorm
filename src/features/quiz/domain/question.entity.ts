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

    @Column()
    createdAt: Date;

    @Column({ nullable: true })
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @ManyToOne(() => GameQuestion)
    @JoinColumn({ name: 'gameQuestionsId' })
    gameQuestions: GameQuestion[];
}
