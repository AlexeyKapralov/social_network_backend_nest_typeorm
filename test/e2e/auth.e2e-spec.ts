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
import { UsersManagerTest } from '../utils/users-manager.test';
import { UsersService } from '../../src/features/users/application/users-service';
import { EmailService } from '../../src/base/services/email-service';
import { EmailServiceMock } from '../mock/email-service-mock';

aDescribe(skipSettings.for('authTests'))('AuthController (e2e)', () => {
    let app: NestExpressApplication;
    let dataSource: DataSource;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(EmailService) // для мока (передаем класс который хотим переопределить)
            .useClass(EmailServiceMock) // моковый класс
            // useFactory используется если нужно передававть какие-то данные внутрь, если данные передававть не надо, то используется UseClass
            // .useFactory({
            //         factory: (usersRepo: UsersRepository) => {
            //             return new EmailServiceMock(usersRepo, {
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
        await app.close();
    });

    //todo подтвердить код
    //todo отправить письмо восстановления
    //todo подтвердить восстановление
    //todo логин
    //todo рефреш токен
    //todo логаут
    //todo получить самого себя

    //регистрация
    it('should register user', async () => {
        const isDeleteUser = await request(app.getHttpServer())
            .post(`/auth/registration`)
            .send({
                login: 'oK4SUBl_Af',
                password: 'string',
                email: 'example@example.com',
            })
            .expect(HttpStatus.NO_CONTENT);
    });

    it(`shouldn't register user with existed login and email`, async () => {
        const isDeleteUser = await request(app.getHttpServer())
            .post(`/auth/registration`)
            .send({
                login: 'oK4SUBl_Af',
                password: 'string',
                email: 'example@example.com',
            })
            .expect(HttpStatus.BAD_REQUEST);

        expect(isDeleteUser.body).toEqual({
            errorsMessages: [
                {
                    message: 'login already exists',
                    field: 'login',
                },
                {
                    message: 'email already exists',
                    field: 'email',
                },
            ],
        });
    });

    it(`shouldn't register user with existed login and email`, async () => {
        const isDeleteUser = await request(app.getHttpServer())
            .post(`/auth/registration`)
            .send({
                login: 'oK4SUBl_Af',
                password: 'string',
                email: 'example@example.com',
            })
            .expect(HttpStatus.BAD_REQUEST);

        expect(isDeleteUser.body).toEqual({
            errorsMessages: [
                {
                    message: 'login already exists',
                    field: 'login',
                },
                {
                    message: 'email already exists',
                    field: 'email',
                },
            ],
        });
    });

    //ресенд письма
    it(`should resend email`, async () => {
        const isDeleteUser = await request(app.getHttpServer())
            .post(`/auth/registration-email-resending`)
            .send({
                email: 'oK4SUBl_Af',
            })
            .expect(HttpStatus.NO_CONTENT);
    });

    it(`shouldn't resend email with incorrect data`, async () => {
        const isDeleteUser = await request(app.getHttpServer())
            .post(`/auth/registration-email-resending`)
            .send({
                email: 'example@example.com',
            })
            .expect(HttpStatus.BAD_REQUEST);
    });
});
