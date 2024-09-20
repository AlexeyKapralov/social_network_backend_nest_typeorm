import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/domain/user-entity';
import { Game } from './game.entity';

@Entity()
export class Player extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    score: number;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Game)
    @JoinColumn({ name: 'gameId' })
    game: Game;
}
