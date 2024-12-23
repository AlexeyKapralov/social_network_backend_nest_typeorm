import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
    type: 'postgres',
    host: 'localhost', //'127.0.0.1',
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB_NAME,
    port: 5432,
    synchronize: false,
    entities: [`src/**/*entity{.ts,.js}`],
    migrations: [__dirname + `/migrations/**/*{.ts,.js}`],
});
