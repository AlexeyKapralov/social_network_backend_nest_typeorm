import dayjs from 'dayjs';
import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from '../../../src/features/quiz/application/quiz.service';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../src/base/models/interlayer';
import { v4 as uuid } from 'uuid';
import {
    GamePairViewDto,
    GameStatuses,
} from '../../../src/features/quiz/api/dto/output/game-pair-view.dto';
import { AppModule } from '../../../src/app-module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { applyAppSettings } from '../../../src/settings/apply-app-settings';
import { DataSource } from 'typeorm';
import { Player } from '../../../src/features/quiz/domain/player.entity';

describe('Quiz service integration tests', () => {
    let app: NestExpressApplication;
    let quizService: QuizService;
    let dataSource: DataSource;
    // let appointmentsService: AppointmentsService;

    beforeAll(async () => {
        const testModule: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
            providers: [
                // QuizService,
                // {
                //     provide: DoctorsRepository,
                //     useValue: createMock<DoctorsRepository>(),
                // },
                // {
                //     provide: AppointmentsService,
                //     useValue: createMock<AppointmentsService>(),
                // },
            ],
        }).compile();

        app = testModule.createNestApplication();
        applyAppSettings(app);
        await app.init();
        quizService = app.get<QuizService>(QuizService);
        dataSource = app.get<DataSource>(DataSource);
        await dataSource.query(`
            DO $$
            DECLARE
                table_name text;
            BEGIN
                FOR table_name IN
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = 'public'
                LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(table_name) || ' CASCADE;';
                END LOOP;
            END $$;
        `);
    });

    afterAll(async () => {
        //чтобы база была пустая и если будут изменения, чтобы связи не мешали при наличии данных (например создается колонка NOT NULL и при наличии данных нельзя будет её добавить)
        // await dataSource.query(`
        //     DO $$
        //     DECLARE
        //         table_name text;
        //     BEGIN
        //         FOR table_name IN
        //             SELECT tablename
        //             FROM pg_tables
        //             WHERE schemaname = 'public'
        //         LOOP
        //             EXECUTE 'TRUNCATE TABLE ' || quote_ident(table_name) || ' CASCADE;';
        //         END LOOP;
        //     END $$;
        // `);
        await app.close();
    });

    it('should create connection', async () => {
        const userId = uuid();
        await dataSource.query(`
            INSERT INTO public."user"
            (id, login, email, "password", "createdAt", "confirmationCode", "isConfirmed", "confirmationCodeExpireDate")
            VALUES('${userId}', 'login', 'password', 'email', '2024-08-10 11:07:54.927', '1234', true, '2024-08-10 11:07:54.927');
        `);
        const userId2 = uuid();
        await dataSource.query(`
            INSERT INTO public."user"
            (id, login, email, "password", "createdAt", "confirmationCode", "isConfirmed", "confirmationCodeExpireDate")
            VALUES('${userId2}', 'login2', 'password', 'email', '2024-08-10 11:07:54.927', '1234', true, '2024-08-10 11:07:54.927');
        `);
        expect.setState({ userId: userId2 });

        const result = await quizService.createConnection(userId);
        expect(result.hasError()).toBeFalsy();

        expect(result.data).toEqual({
            id: expect.any(String),
            firstPlayerProgress: {
                answers: [],
                player: {
                    id: expect.any(String),
                    login: expect.any(String),
                },
                score: 0,
            },
            secondPlayerProgress: {
                answers: [],
                player: {},
                score: 0,
            },
            questions: [],
            status: 'PendingSecondPlayer',
            pairCreatedDate: expect.stringMatching(
                /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
            ),
            startGameDate: null,
            finishGameDate: null,
        });

        const players = await dataSource.query(`
            SELECT id, score, "userId"
            FROM public.player;
        `);
        expect(players[0].userId).toBe(userId);

        const game = await dataSource.query(`
            SELECT id, status, "createdAt", player_1_id, player_2_id
            FROM public.game;
        `);
        expect(game[0].status).toBe(GameStatuses.PendingSecondPlayer);
        expect(game[0].player_1_id).toBe(players[0].id);
    });

    it('should join to exists connection', async () => {
        const { userId } = expect.getState();

        const users = await dataSource.query(`
            SELECT * FROM public.user
            WHERE id = '${userId}'
        `);
        expect(users.length).toBe(1);

        const result = await quizService.createConnection(userId);
        expect(result.hasError()).toBeFalsy();

        expect(result.data).toEqual({
            id: expect.any(String),
            firstPlayerProgress: {
                answers: [],
                player: {
                    id: expect.any(String),
                    login: expect.any(String),
                },
                score: 0,
            },
            secondPlayerProgress: {
                answers: [],
                player: {
                    id: expect.any(String),
                    login: expect.any(String),
                },
                score: 0,
            },
            questions: [],
            status: GameStatuses.Active,
            pairCreatedDate: expect.stringMatching(
                /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
            ),
            startGameDate: expect.stringMatching(
                /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
            ),
            finishGameDate: null,
        });

        const players = await dataSource.query(`
            SELECT id, score, "userId"
            FROM public.player
            WHERE "userId" = '${userId}'
        `);
        expect(players.length).toBe(1);

        const game = await dataSource.query(`
            SELECT id, status, "createdAt", player_1_id, player_2_id
            FROM public.game;
        `);
        expect(game[0].status).toBe(GameStatuses.Active);
        expect(game[0].player_2_id).toBe(players[0].id);
    });

    it(`user can't join if he already play in an active game`, async () => {
        const { userId } = expect.getState();

        const users = await dataSource.query(`
            SELECT * FROM public.user WHERE id = '${userId}'
        `);
        expect(users.length).toBe(1);

        const result = await quizService.createConnection(userId);
        expect(result.hasError()).toBeTruthy();

        expect(result.extensions[0]).toEqual({
            message: 'user is already participating in active pair',
            key: 'user',
            code: InterlayerStatuses.FORBIDDEN,
        });
    });
});
