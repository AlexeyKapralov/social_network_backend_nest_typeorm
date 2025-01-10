import {
    Column,
    Entity,
    JoinColumn,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Player } from '../../quiz/domain/player.entity';
import { Blog } from '../../blogs/blogs/domain/blog-entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        collation: 'C',
    })
    login: string;

    @Column({
        collation: 'C',
    })
    email: string;

    @Column()
    @Exclude()
    password: string;

    @Column()
    createdAt: Date;

    @Column({ default: false })
    @Exclude()
    isDeleted: boolean;

    @Column()
    @Exclude()
    confirmationCode: string;

    @Column({ default: false })
    @Exclude()
    isConfirmed: boolean;

    @Column()
    @Exclude()
    confirmationCodeExpireDate: Date;

    @OneToMany(() => Player, (player) => player.user)
    @JoinColumn({ name: 'playerId' })
    players: Player[];

    @OneToMany(() => Blog, (blog) => blog.user)
    @JoinColumn({ name: 'blogId' })
    blogs: Blog[];
}
