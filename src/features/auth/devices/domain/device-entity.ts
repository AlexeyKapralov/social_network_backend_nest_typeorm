import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
