import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app-module';
import { aDescribe } from '../utils/aDescribe';
import { skipSettings } from '../utils/skip-settings';
import { NestExpressApplication } from '@nestjs/platform-express';
import { applyAppSettings } from '../../src/settings/apply-app-settings';
import { ConfigService } from '@nestjs/config';
import { ApiSettings } from '../../src/settings/env/api-settings';
import { HttpStatus } from '@nestjs/common';
import { Connection, DataSource } from 'typeorm';
import { getConnectionToken } from '@nestjs/typeorm';

aDescribe(skipSettings.for('usersTests'))('UsersController (e2e)', () => {
    let app: NestExpressApplication;
    let dataSource: DataSource;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            // .overrideProvider(UsersService) // для мока (передаем класс который хотим переопределить)
            // .useClass(UserSeviceMock) // моковый класс
            // useFactory используется если нужно передававть какие-то данные внутрь, если данные передававть не надо, то используется UseClass
            // .useFactory({
            //         factory: (usersRepo: UsersRepository) => {
            //             return new UserServiceMock(usersRepo, {
            //                 count: 50
            //             } )
            //         },
            //          inject: [UsersQueryRepository, UsersRepository] //последовательность важна
            //     })
            .compile();

        app = moduleFixture.createNestApplication();
        applyAppSettings(app);
        await app.init();

        dataSource = app.get<DataSource>(DataSource);
        await dataSource.query(`
            TRUNCATE 
                public.user`);
    });

    afterAll(async () => {
        await app.close();
    });

    it('should create user', async () => {
        const configService = app.get(ConfigService);
        const apiSettings = configService.get<ApiSettings>('apiSettings');
        const userName = apiSettings.ADMIN_USERNAME;
        const userPassword = apiSettings.ADMIN_PASSWORD;

        const buff = Buffer.from(`${userName}:${userPassword}`, 'utf-8');
        const decodedAuth = buff.toString('base64');

        const postResponse = await request(app.getHttpServer())
            .post('/sa/users')
            .set({ authorization: `Basic ${decodedAuth}` })
            .send({
                email: 'alexey@kapralov0.site',
                login: 'Aa1',
                password: '123456',
            })
            .expect(HttpStatus.CREATED);

        expect(postResponse.body).toEqual({
            id: expect.stringMatching(
                /^(?!00000000-0000-0000-0000-000000000000)([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/,
            ),
            email: 'alexey@kapralov0.site',
            login: 'Aa1',
            createdAt: expect.stringMatching(
                /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
            ),
        });
    });

    it('should create user2', async () => {
        const configService = app.get(ConfigService);
        const apiSettings = configService.get<ApiSettings>('apiSettings');
        const userName = apiSettings.ADMIN_USERNAME;
        const userPassword = apiSettings.ADMIN_PASSWORD;

        const buff = Buffer.from(`${userName}:${userPassword}`, 'utf-8');
        const decodedAuth = buff.toString('base64');

        const postResponse = await request(app.getHttpServer())
            .post('/sa/users')
            .set({ authorization: `Basic ${decodedAuth}` })
            .send({
                email: 'alexey@kapralov1.site',
                login: 'Aa2',
                password: '123456',
            })
            .expect(HttpStatus.CREATED);

        expect.setState({
            userId: postResponse.body.id,
        });

        expect(postResponse.body).toEqual({
            id: expect.stringMatching(
                /^(?!00000000-0000-0000-0000-000000000000)([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/,
            ),
            email: 'alexey@kapralov1.site',
            login: 'Aa2',
            createdAt: expect.stringMatching(
                /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
            ),
        });
    });

    it(`shouldn't create user2`, async () => {
        const configService = app.get(ConfigService);
        const apiSettings = configService.get<ApiSettings>('apiSettings');
        const userName = apiSettings.ADMIN_USERNAME;
        const userPassword = apiSettings.ADMIN_PASSWORD;

        const buff = Buffer.from(`${userName}:${userPassword}`, 'utf-8');
        const decodedAuth = buff.toString('base64');

        const postResponse2 = await request(app.getHttpServer())
            .post('/sa/users')
            .set({ authorization: `Basic ${decodedAuth}` })
            .send({
                email: 'alexey@kapralov0.site',
                login: 'Aa1',
                password: '123456',
            })
            .expect(HttpStatus.BAD_REQUEST);

        expect(postResponse2.body).toEqual({
            errorsMessages: expect.arrayContaining([
                {
                    message: expect.any(String),
                    field: expect.any(String),
                },
            ]),
        });
    });

    it('get all users', async () => {
        const configService = app.get(ConfigService);
        const apiSettings = configService.get<ApiSettings>('apiSettings');
        const userName = apiSettings.ADMIN_USERNAME;
        const userPassword = apiSettings.ADMIN_PASSWORD;

        const buff = Buffer.from(`${userName}:${userPassword}`, 'utf-8');
        const decodedAuth = buff.toString('base64');

        const postResponse2 = await request(app.getHttpServer())
            .get('/sa/users')
            .query({ pageSize: '1', pageNumber: '2' })
            .set({ authorization: `Basic ${decodedAuth}` })
            // .send({
            //     email: 'alexey@kapralov0.site',
            //     login: 'Aa1',
            //     password: '123456',
            // })
            .expect(HttpStatus.OK);

        expect(postResponse2.body).toEqual({
            pagesCount: 2,
            page: 2,
            pageSize: 1,
            totalCount: 2,
            items: expect.arrayContaining([
                {
                    id: expect.any(String),
                    login: expect.any(String),
                    email: expect.any(String),
                    createdAt: expect.stringMatching(
                        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                    ),
                },
            ]),
        });
    });

    it('should delete user by id', async () => {
        const configService = app.get(ConfigService);
        const apiSettings = configService.get<ApiSettings>('apiSettings');
        const userName = apiSettings.ADMIN_USERNAME;
        const userPassword = apiSettings.ADMIN_PASSWORD;

        const buff = Buffer.from(`${userName}:${userPassword}`, 'utf-8');
        const decodedAuth = buff.toString('base64');

        const { userId } = expect.getState();
        console.log(userId);
        const isDeleteUser = await request(app.getHttpServer())
            .delete(`/sa/users/${userId}`)
            .set({ authorization: `Basic ${decodedAuth}` })
            // .send({
            //     email: 'alexey@kapralov0.site',
            //     login: 'Aa1',
            //     password: '123456',
            // })
            .expect(HttpStatus.NO_CONTENT);

        let deletedUser = await dataSource.query(
            `
        SELECT * FROM public.user
        WHERE id = $1
        `,
            [userId],
        );

        expect(deletedUser[0].isDeleted).toBeTruthy();
    });
});
