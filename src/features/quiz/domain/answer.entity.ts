import {
    BaseEntity,
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { Player } from './player.entity';
import { Game } from './game.entity';

@Entity()
export class Answer extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ collation: 'C' })
    status: string;

    @Column()
    createdAt: Date;

    @ManyToOne(() => Question)
    @JoinColumn({ name: 'questionId' })
    question: Question;

    @ManyToOne(() => Player)
    @JoinColumn({ name: 'playerId' })
    player: Player;

    @ManyToOne(() => Game)
    @JoinColumn({ name: 'gameId' })
    game: Game;
}
