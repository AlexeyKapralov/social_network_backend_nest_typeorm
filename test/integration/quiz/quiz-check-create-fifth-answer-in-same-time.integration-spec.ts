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

describe('Quiz service integration tests quiz check create fifth answer in same time', () => {
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

        //создать пять вопросов
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
        await app.close();
    });

    it('should create connection', async () => {
        const user1 = await dataSource.query(`
            INSERT INTO public."user"
            (login, email, "password", "createdAt", "confirmationCode", "isConfirmed", "confirmationCodeExpireDate")
            VALUES('login', 'password', 'email', '2024-08-10 11:07:54.927', '1234', true, '2024-08-10 11:07:54.927')
            RETURNING id;
        `);
        const user2 = await dataSource.query(`
            INSERT INTO public."user"
            (login, email, "password", "createdAt", "confirmationCode", "isConfirmed", "confirmationCodeExpireDate")
            VALUES('login2', 'password', 'email', '2024-08-10 11:07:54.927', '1234', true, '2024-08-10 11:07:54.927')
            RETURNING id;
        `);

        expect.setState({ userId1: user2[0].id });
        expect.setState({ userId2: user1[0].id });

        const result = await quizService.createConnection(user1[0].id);
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
            secondPlayerProgress: null,
            questions: null,
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
        expect(players[0].userId).toBe(user1[0].id);

        const game = await dataSource.query(`
            SELECT id, status, "createdAt", player_1_id, player_2_id
            FROM public.game;
        `);
        expect(game[0].status).toBe(GameStatuses.PendingSecondPlayer);
        expect(game[0].player_1_id).toBe(players[0].id);
    });

    it('should join to exists connection', async () => {
        const { userId1 } = expect.getState();

        const users = await dataSource.query(`
            SELECT * FROM public.user
            WHERE id = '${userId1}'
        `);
        expect(users.length).toBe(1);

        const result = await quizService.createConnection(userId1);
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
            WHERE "userId" = '${userId1}'
        `);
        expect(players.length).toBe(1);

        const game = await dataSource.query(`
            SELECT id, status, "createdAt", player_1_id, player_2_id
            FROM public.game;
        `);
        expect(game[0].status).toBe(GameStatuses.Active);
        expect(game[0].player_2_id).toBe(players[0].id);
    });

    it(`should create answers from first user of four questions`, async () => {
        const { userId1 } = expect.getState();
        const createAnswerCommand = new CreateAnswerCommand(userId1, {
            answer: 'correct answer',
        });
        const createIncorrectAnswerCommand = new CreateAnswerCommand(userId1, {
            answer: 'incorrect answer',
        });
        const createAnswerInterlayer =
            await createAnswerHandler.execute(createAnswerCommand);
        await createAnswerHandler.execute(createIncorrectAnswerCommand);
        await createAnswerHandler.execute(createAnswerCommand);
        await createAnswerHandler.execute(createAnswerCommand);

        const answer = await dataSource.query(`
            SELECT status, "gameId"
            FROM public.answer
            ORDER BY "createdAt" ASC
        `);

        const player: Player[] = await dataSource.query(`
            SELECT *
            FROM public.player
            WHERE "gameId" = '${answer[0].gameId}' AND "userId" = '${userId1}'
        `);

        expect(answer.length).toBe(4);
        expect(answer[0].status).toEqual(AnswerStatusesEnum.Correct);
        expect(answer[1].status).toEqual(AnswerStatusesEnum.Incorrect);
        expect(createAnswerInterlayer.data.answerStatus).toEqual(
            AnswerStatusesEnum.Correct,
        );
        expect(player[0].score).toBe(3);
    });

    it(`should create answers from second user of four questions`, async () => {
        const { userId2 } = expect.getState();
        const createAnswerCommand = new CreateAnswerCommand(userId2, {
            answer: 'correct answer',
        });
        const createIncorrectAnswerCommand = new CreateAnswerCommand(userId2, {
            answer: 'incorrect answer',
        });
        await createAnswerHandler.execute(createIncorrectAnswerCommand);
        await createAnswerHandler.execute(createIncorrectAnswerCommand);
        await createAnswerHandler.execute(createAnswerCommand);
        await createAnswerHandler.execute(createAnswerCommand);

        const answer = await dataSource.query(
            `
            SELECT status, a."gameId"
            FROM public.answer a
            LEFT JOIN public.player p ON p.id = a."playerId"
            WHERE p."userId" = $1
            ORDER BY "createdAt" ASC
        `,
            [userId2],
        );

        const player: Player[] = await dataSource.query(`
            SELECT *
            FROM public.player
            WHERE "gameId" = '${answer[0].gameId}' AND "userId" = '${userId2}'
        `);

        expect(answer.length).toBe(4);
        expect(answer[0].status).toEqual(AnswerStatusesEnum.Incorrect);
        expect(answer[1].status).toEqual(AnswerStatusesEnum.Incorrect);
        expect(player[0].score).toBe(2);
    });

    it(`should create fifth answer from first and second player at the same time`, async () => {
        const { userId1 } = expect.getState();
        const { userId2 } = expect.getState();
        const createIncorrectAnswerCommand = new CreateAnswerCommand(userId1, {
            answer: 'incorrect answer',
        });
        const createCorrectAnswerCommand = new CreateAnswerCommand(userId2, {
            answer: 'correct answer',
        });
        await createAnswerHandler.execute(createIncorrectAnswerCommand);
        await createAnswerHandler.execute(createCorrectAnswerCommand);

        const answer = await dataSource.query(
            `
            SELECT status, a."gameId"
            FROM public.answer a
            LEFT JOIN public.player p ON p.id = a."playerId"
            WHERE p."userId" = $1
            ORDER BY "createdAt" DESC
        `,
            [userId1],
        );

        const player: Player[] = await dataSource.query(`
            SELECT *
            FROM public.player
            WHERE "gameId" = '${answer[0].gameId}' AND "userId" = '${userId1}'
        `);

        expect(answer[0].status).toEqual(AnswerStatusesEnum.Incorrect);
        expect(player[0].score).toBe(4);
    });

    // it(`shouldn't create answer with incorrect answer`, async () => {
    //     const { userId } = expect.getState();
    //     const createAnswerCommand = new CreateAnswerCommand(userId, {
    //         answer: 'incorrect answer',
    //     });
    //     const createAnswerInterlayer =
    //         await createAnswerHandler.execute(createAnswerCommand);
    //
    //     const answer: Answer[] = await dataSource.query(`
    //         SELECT *
    //         FROM public.answer
    //         ORDER BY "createdAt" DESC
    //     `);
    //     expect(answer.length).toBe(2);
    //     expect(answer[0].status).toEqual(AnswerStatusesEnum.Incorrect);
    //     expect(createAnswerInterlayer.data.answerStatus).toEqual(
    //         AnswerStatusesEnum.Incorrect,
    //     );
    // });
    //
    // it(`shouldn't create answer if player answers already five questions`, async () => {
    //     const { userId } = expect.getState();
    //     const createAnswerCommand = new CreateAnswerCommand(userId, {
    //         answer: 'correct answer',
    //     });
    //     for (let i = 0; i <= 4; i++) {
    //         const createAnswerInterlayer =
    //             await createAnswerHandler.execute(createAnswerCommand);
    //         if (i === 4) {
    //             expect(createAnswerInterlayer.extensions[0].message).toBe(
    //                 'user already answers of 5 questions',
    //             );
    //         }
    //     }
    //
    //     const answer: Answer[] = await dataSource.query(`
    //         SELECT *
    //         FROM public.answer
    //     `);
    //     expect(answer.length).toBe(5);
    // });
    //
    // it(`should change status game in finished if both players answer 5 questions`, async () => {
    //     const { userId2 } = expect.getState();
    //     const createAnswerCommand = new CreateAnswerCommand(userId2, {
    //         answer: 'correct answer',
    //     });
    //     for (let i = 0; i <= 4; i++) {
    //         const createAnswerInterlayer =
    //             await createAnswerHandler.execute(createAnswerCommand);
    //     }
    //
    //     const game: Game[] = await dataSource.query(`
    //         SELECT *
    //         FROM public.game
    //     `);
    //     expect(game[0].status).toBe(GameStatuses.Finished);
    //     expect(game[0].finishedAt.toISOString()).toEqual(
    //         expect.stringMatching(
    //             /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
    //         ),
    //     );
    //     expect.setState({ gameId: game[0].id });
    // });
    //
    // it(`should get game by id`, async () => {
    //     const { userId2 } = expect.getState();
    //
    //     const createAnswerCommand = new CreateAnswerCommand(userId2, {
    //         answer: 'correct answer',
    //     });
    //     for (let i = 0; i <= 4; i++) {
    //         const createAnswerInterlayer =
    //             await createAnswerHandler.execute(createAnswerCommand);
    //     }
    //
    //     const game: Game[] = await dataSource.query(`
    //         SELECT *
    //         FROM public.game
    //     `);
    //     expect(game[0].status).toBe(GameStatuses.Finished);
    //     expect(game[0].finishedAt.toISOString()).toEqual(
    //         expect.stringMatching(
    //             /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
    //         ),
    //     );
    // });
});
