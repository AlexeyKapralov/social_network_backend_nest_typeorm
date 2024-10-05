import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from '../../../src/features/quiz/application/quiz.service';
import { InterlayerStatuses } from '../../../src/base/models/interlayer';
import { v4 as uuid } from 'uuid';
import { GameStatuses } from '../../../src/features/quiz/api/dto/output/game-pair-view.dto';
import { AppModule } from '../../../src/app-module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { applyAppSettings } from '../../../src/settings/apply-app-settings';
import { DataSource } from 'typeorm';
import {
    CreateAnswerCommand,
    CreateAnswerUseCase,
} from '../../../src/features/quiz/application/usecases/create-answer.command';
import { AnswerStatusesEnum } from '../../../src/common/enum/answer-statuses.enum';
import { Answer } from '../../../src/features/quiz/domain/answer.entity';
import { Player } from '../../../src/features/quiz/domain/player.entity';
import { Game } from '../../../src/features/quiz/domain/game.entity';

describe('Quiz service integration tests', () => {
    let app: NestExpressApplication;
    let quizService: QuizService;
    let dataSource: DataSource;
    let createAnswerHandler: CreateAnswerUseCase;

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
        createAnswerHandler = app.get<CreateAnswerUseCase>(CreateAnswerUseCase);
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

        await dataSource.query(`
            INSERT INTO public.question
            (id, body, answers, published, "createdAt")
            VALUES(uuid_generate_v4(), 'body1', 'correct answer, true, answer', true, '2024-09-28T07:28:14.079Z');
            
            INSERT INTO public.question
            (id, body, answers, published, "createdAt")
            VALUES(uuid_generate_v4(), 'body2', 'correct answer, true, answer', true, '2024-09-28T08:28:14.079Z');
            
            INSERT INTO public.question
            (id, body, answers, published, "createdAt")
            VALUES(uuid_generate_v4(), 'body3', 'correct answer, true, answer', true, '2024-09-28T09:28:14.079Z');
            
            INSERT INTO public.question
            (id, body, answers, published, "createdAt")
            VALUES(uuid_generate_v4(), 'body4', 'correct answer, true, answer', true, '2024-09-28T10:28:14.079Z');
            
            INSERT INTO public.question
            (id, body, answers, published, "createdAt")
            VALUES(uuid_generate_v4(), 'body5', 'correct answer, true, answer', true, '2024-09-28T11:28:14.079Z');
            
            INSERT INTO public.question
            (id, body, answers, published, "createdAt")
            VALUES(uuid_generate_v4(), 'body6', 'correct answer, true, answer', true, '2024-09-28T12:28:14.079Z');
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
        expect.setState({ userId2: userId });

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
            questions: expect.arrayContaining([
                {
                    body: expect.any(String),
                    id: expect.stringMatching(
                        /^(?!00000000-0000-0000-0000-000000000000)([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/,
                    ),
                },
            ]),
            status: GameStatuses.Active,
            pairCreatedDate: expect.stringMatching(
                /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
            ),
            startGameDate: expect.stringMatching(
                /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
            ),
            finishGameDate: null,
        });

        expect(result.data.questions.length).toBe(5);

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

    it(`should create answer of first question`, async () => {
        const { userId } = expect.getState();
        const createAnswerCommand = new CreateAnswerCommand(userId, {
            answer: 'correct answer',
        });
        const createAnswerInterlayer =
            await createAnswerHandler.execute(createAnswerCommand);

        const answer = await dataSource.query(`
            SELECT status, "gameId"
            FROM public.answer
        `);

        const player: Player[] = await dataSource.query(`
            SELECT *
            FROM public.player
            WHERE "gameId" = '${answer[0].gameId}' AND "userId" = '${userId}'
        `);

        expect(answer.length).toBe(1);
        expect(answer[0].status).toEqual(AnswerStatusesEnum.Correct);
        expect(createAnswerInterlayer.data.answerStatus).toEqual(
            AnswerStatusesEnum.Correct,
        );
        expect(player[0].score).toBe(1);
    });

    it(`shouldn't create answer with incorrect answer`, async () => {
        const { userId } = expect.getState();
        const createAnswerCommand = new CreateAnswerCommand(userId, {
            answer: 'incorrect answer',
        });
        const createAnswerInterlayer =
            await createAnswerHandler.execute(createAnswerCommand);

        const answer: Answer[] = await dataSource.query(`
            SELECT *
            FROM public.answer
            ORDER BY "createdAt" DESC
        `);
        expect(answer.length).toBe(2);
        expect(answer[0].status).toEqual(AnswerStatusesEnum.Incorrect);
        expect(createAnswerInterlayer.data.answerStatus).toEqual(
            AnswerStatusesEnum.Incorrect,
        );
    });

    it(`shouldn't create answer if player answers already five questions`, async () => {
        const { userId } = expect.getState();
        const createAnswerCommand = new CreateAnswerCommand(userId, {
            answer: 'correct answer',
        });
        for (let i = 0; i <= 4; i++) {
            const createAnswerInterlayer =
                await createAnswerHandler.execute(createAnswerCommand);
            if (i === 4) {
                expect(createAnswerInterlayer.extensions[0].message).toBe(
                    'user already answers of 5 questions',
                );
            }
        }

        const answer: Answer[] = await dataSource.query(`
            SELECT *
            FROM public.answer
        `);
        expect(answer.length).toBe(5);
    });

    it(`should change status game in finished if both players answer 5 questions`, async () => {
        const { userId2 } = expect.getState();
        const createAnswerCommand = new CreateAnswerCommand(userId2, {
            answer: 'correct answer',
        });
        for (let i = 0; i <= 4; i++) {
            const createAnswerInterlayer =
                await createAnswerHandler.execute(createAnswerCommand);
        }

        const game: Game[] = await dataSource.query(`
            SELECT *
            FROM public.game
        `);
        expect(game[0].status).toBe(GameStatuses.Finished);
        expect(game[0].finishedAt.toISOString()).toEqual(
            expect.stringMatching(
                /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
            ),
        );
        expect.setState({ gameId: game[0].id });
    });

    it(`should get game by id`, async () => {
        const { userId2 } = expect.getState();

        const createAnswerCommand = new CreateAnswerCommand(userId2, {
            answer: 'correct answer',
        });
        for (let i = 0; i <= 4; i++) {
            const createAnswerInterlayer =
                await createAnswerHandler.execute(createAnswerCommand);
        }

        const game: Game[] = await dataSource.query(`
            SELECT *
            FROM public.game
        `);
        expect(game[0].status).toBe(GameStatuses.Finished);
        expect(game[0].finishedAt.toISOString()).toEqual(
            expect.stringMatching(
                /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
            ),
        );
    });
});
