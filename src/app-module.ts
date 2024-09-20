import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration, {
    ConfigurationType,
    validate,
} from './settings/env/configuration';
import { UsersModule } from './features/users/users-module';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './features/auth/auth-module';
import { ThrottlerModule } from '@nestjs/throttler';
import { TestingModule } from './features/testing/testing-module';
import BlogsModule from './features/blogs/blogs-module';
import { Device } from './features/auth/devices/domain/device-entity';
import { Blog } from './features/blogs/blogs/domain/blog-entity';
import { Post } from './features/blogs/posts/domain/posts.entity';
import { Like } from './features/blogs/likes/domain/likes.entity';
import { User } from './features/users/domain/user-entity';
import { Comment } from './features/blogs/comments/domain/comment.entity';
import { QuizModule } from './features/quiz/quiz.module';
import { Answer } from './features/quiz/domain/answer.entity';
import { Game } from './features/quiz/domain/game.entity';
import { GameQuestion } from './features/quiz/domain/game-question.entity';
import { Player } from './features/quiz/domain/player.entity';
import { Question } from './features/quiz/domain/question.entity';

@Global()
@Module({
    imports: [
        ThrottlerModule.forRoot([
            {
                ttl: 10000,
                limit: 5,
            },
        ]),
        TypeOrmModule.forRootAsync({
            useFactory: (configService: ConfigService<ConfigurationType>) => {
                const environmentSettings = configService.get(
                    'environmentSettings',
                    { infer: true },
                );
                const databaseSettings = configService.get('databaseSettings', {
                    infer: true,
                });

                const database = environmentSettings.isTesting
                    ? databaseSettings.POSTGRESQL_TEST_DB_NAME
                    : databaseSettings.POSTGRESQL_DB_NAME;

                const isTesting = environmentSettings.isTesting;

                const entitiesArray = [
                    Device,
                    Blog,
                    Post,
                    Like,
                    User,
                    Comment,
                    Answer,
                    Game,
                    GameQuestion,
                    Player,
                    Question,
                ];

                const dbPassword = databaseSettings.DB_PASSWORD;

                return {
                    type: 'postgres',
                    host: 'localhost', //'127.0.0.1',
                    username: 'postgres',
                    password: dbPassword,
                    database: database,
                    port: 5432,
                    // ssl: true,
                    // url: process.env.POSTGRESQL_CONNECTION_URI,
                    entities: entitiesArray,
                    autoLoadEntities: isTesting, //false в продакшене и для raw_sql только
                    synchronize: isTesting, //false в продакшене и для raw_sql только
                    logging: true,
                };
            },
            inject: [ConfigService],
        }),
        UsersModule,
        AuthModule,
        BlogsModule,
        PassportModule,
        QuizModule,
        TestingModule.register(process.env.ENV),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            validate: validate,
            ignoreEnvFile: false, //для development
            envFilePath: ['.env'],
        }),
    ],
    providers: [],
})
export class AppModule {}
