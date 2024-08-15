import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class Device {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    deviceName: string;

    @Column()
    ip: string;

    @Column()
    iat: Date;

    @Column()
    exp: Date;
}
