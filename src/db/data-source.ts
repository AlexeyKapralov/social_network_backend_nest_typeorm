import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
    type: 'postgres',
    host: 'localhost', //'127.0.0.1',
    username: 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.POSTGRESQL_DB_NAME,
    port: 5432,
    synchronize: false,
    entities: [`src/**/*entity{.ts,.js}`],
    migrations: [__dirname + `/migrations/**/*{.ts,.js}`],
});
