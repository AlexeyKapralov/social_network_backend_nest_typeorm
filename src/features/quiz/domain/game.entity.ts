import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { GameQuestion } from './game-question.entity';
import { Answer } from './answer.entity';
import { GameStatuses } from '../api/dto/output/game-pair-view.dto';

@Entity()
export class Game extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ collation: 'C' })
    status: GameStatuses;

    @Column()
    createdAt: Date;

    @Column({ nullable: true })
    startedAt: Date;

    @Column({ nullable: true })
    finishedAt: Date;

    @Column({ type: 'uuid' })
    player_1_id: string;

    @Column({ type: 'uuid', nullable: true })
    player_2_id: string;

    @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.game)
    gameQuestions: GameQuestion[];

    @OneToMany(() => Answer, (answer) => answer.game)
    answers: Answer[];
}
