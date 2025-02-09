import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { applyAppSettings } from '../../src/settings/apply-app-settings';
import { HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EmailService } from '../../src/base/services/email-service';
import { EmailServiceMock } from '../mock/email-service-mock';
import { JwtService } from '@nestjs/jwt';
import { aDescribe } from '../utils/aDescribe';
import { skipSettings } from '../utils/skip-settings';
import { User } from '../../src/features/users/domain/user-entity';

aDescribe(skipSettings.for('authTests'))('AuthController (e2e)', () => {
    // aDescribe(skipSettings.for('authTests'))('AuthController (e2e)', () => {
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

    it('should check clearing database', async () => {
        const users = await dataSource.getRepository(User).find();
        expect(users.length).toBe(0);
    });

    //регистрация
    it('should register user', async () => {
        await request(app.getHttpServer())
            .post(`/auth/registration`)
            .send({
                login: 'oK4SUBl_Af',
                password: 'string',
                email: 'example@example.com',
            })
            .expect(HttpStatus.NO_CONTENT);

        const confirmationCode = await dataSource.query(
            `
            SELECT "confirmationCode" FROM public.user
            WHERE email = $1
        `,
            ['example@example.com'],
        );

        expect.setState({
            confirmationCode: confirmationCode[0].confirmationCode,
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
                email: 'example@example.com',
            })
            .expect(HttpStatus.NO_CONTENT);

        const newConfirmationCode = await dataSource.query(`
            SELECT "confirmationCode" FROM public.user
            WHERE email = 'example@example.com'
        `);

        const { confirmationCode } = expect.getState();
        expect(newConfirmationCode[0].confirmationCode).not.toEqual(
            confirmationCode,
        );
    });

    it(`shouldn't resend email with incorrect data`, async () => {
        const isDeleteUser = await request(app.getHttpServer())
            .post(`/auth/registration-email-resending`)
            .send({
                email: 'example_no_exist@example.com',
            })
            .expect(HttpStatus.BAD_REQUEST);
    });

    //подтвердить код
    it(`shouldn't confirm code with incorrect code`, async () => {
        const isConfirmCode = await request(app.getHttpServer())
            .post(`/auth/registration-confirmation`)
            .send({
                code: 'incorrectCode',
            })
            .expect(HttpStatus.BAD_REQUEST);
    });

    it(`shouldn't confirm code with expired code`, async () => {
        await dataSource.query(
            `
            UPDATE public.user
            SET "createdAt" = $1
            WHERE email = 'example@example.com';
        `,
            [new Date(new Date().setDate(new Date().getDate() - 20))],
        );

        const isConfirmCode = await request(app.getHttpServer())
            .post(`/auth/registration-confirmation`)
            .send({
                code: 'incorrectCode',
            })
            .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should resend email`, async () => {
        const isDeleteUser = await request(app.getHttpServer())
            .post(`/auth/registration-email-resending`)
            .send({
                email: 'example@example.com',
            })
            .expect(HttpStatus.NO_CONTENT);

        const newConfirmationCode = await dataSource.query(`
            SELECT "confirmationCode" FROM public.user
            WHERE email = 'example@example.com'
        `);

        const { confirmationCode } = expect.getState();
        expect(newConfirmationCode[0].confirmationCode).not.toEqual(
            confirmationCode,
        );
    });

    it(`should confirm code`, async () => {
        const confirmationCodeArray = await dataSource.query(
            `
            SELECT "confirmationCode" FROM public.user
            WHERE email = 'example@example.com'
        `,
        );

        const isConfirmCode = await request(app.getHttpServer())
            .post(`/auth/registration-confirmation`)
            .send({
                code: confirmationCodeArray[0].confirmationCode,
            })
            .expect(HttpStatus.NO_CONTENT);
    });

    //отправить письмо восстановления
    it(`should send email with new confirmation code`, async () => {
        const oldUserDataArray = await dataSource.query(`
            SELECT "confirmationCode", "confirmationCodeExpireDate" FROM public.user
            WHERE email = 'example@example.com'
        `);

        await request(app.getHttpServer())
            .post(`/auth/password-recovery`)
            .send({
                email: 'example@example.com',
            })
            .expect(HttpStatus.NO_CONTENT);

        const newUserDataArray = await dataSource.query(`
            SELECT "confirmationCode", "confirmationCodeExpireDate" FROM public.user
            WHERE email = 'example@example.com'
        `);

        const {
            confirmationCode: oldConfirmationCode,
            confirmationCodeExpireDate: oldConfirmationCodeExpireDate,
        } = oldUserDataArray[0];
        const {
            confirmationCode: newConfirmationCode,
            confirmationCodeExpireDate: newConfirmationCodeExpireDate,
        } = newUserDataArray[0];

        expect(oldConfirmationCodeExpireDate).not.toEqual(
            newConfirmationCodeExpireDate,
        );
        expect(newConfirmationCode).not.toEqual(oldConfirmationCode);
    });
    it(`shouldn't send email with new confirmation code`, async () => {
        const oldUserDataArray = await dataSource.query(`
            SELECT "confirmationCode", "confirmationCodeExpireDate" FROM public.user
            WHERE email = 'example@example.com'
        `);

        await request(app.getHttpServer())
            .post(`/auth/password-recovery`)
            .send({
                email: 'incorrect_example@example.com',
            })
            .expect(HttpStatus.NO_CONTENT);

        const newUserDataArray = await dataSource.query(`
            SELECT "confirmationCode", "confirmationCodeExpireDate" FROM public.user
            WHERE email = 'example@example.com'
        `);

        const {
            confirmationCode: oldConfirmationCode,
            confirmationCodeExpireDate: oldConfirmationCodeExpireDate,
        } = oldUserDataArray[0];
        const {
            confirmationCode: newConfirmationCode,
            confirmationCodeExpireDate: newConfirmationCodeExpireDate,
        } = newUserDataArray[0];

        expect(oldConfirmationCodeExpireDate).toEqual(
            newConfirmationCodeExpireDate,
        );
        expect(newConfirmationCode).toEqual(oldConfirmationCode);

        expect.setState({ oldConfirmationCode: oldConfirmationCode });
    });

    //подтвердить восстановление пароля
    it(`should update password`, async () => {
        const { oldConfirmationCode } = expect.getState();
        const userArray = await dataSource.query(`
            SELECT "password" FROM public.user
        `);

        await request(app.getHttpServer())
            .post(`/auth/new-password`)
            .send({
                newPassword: 'string',
                recoveryCode: oldConfirmationCode,
            })
            .expect(HttpStatus.NO_CONTENT);

        const userArray2 = await dataSource.query(`
            SELECT "password" FROM public.user
        `);
        expect(userArray[0].password).not.toEqual(userArray2[0].password);
    });

    it(`shouldn't update password with invalid password`, async () => {
        const { oldConfirmationCode } = expect.getState();

        await request(app.getHttpServer())
            .post(`/auth/new-password`)
            .send({
                newPassword: 'a',
                recoveryCode: oldConfirmationCode,
            })
            .expect(HttpStatus.BAD_REQUEST);
    });

    it(`shouldn't update password with incorrect code`, async () => {
        await request(app.getHttpServer())
            .post(`/auth/new-password`)
            .send({
                newPassword: 'string',
                recoveryCode: 'incorrect Code',
            })
            .expect(HttpStatus.BAD_REQUEST);
    });

    it(`shouldn't update password with expired code`, async () => {
        await dataSource.query(
            `
            UPDATE public.user
            SET "confirmationCodeExpireDate" = $1
            WHERE email = 'example@example.com';
        `,
            [new Date(new Date().setDate(new Date().getDate() - 20))],
        );
        const { oldConfirmationCode } = expect.getState();

        await request(app.getHttpServer())
            .post(`/auth/new-password`)
            .send({
                newPassword: 'string',
                recoveryCode: oldConfirmationCode,
            })
            .expect(HttpStatus.BAD_REQUEST);
    });

    //логин
    it(`should login`, async () => {
        const loginResponse = await request(app.getHttpServer())
            .post(`/auth/login`)
            .set('User-Agent', 'device1')
            .send({
                loginOrEmail: 'example@example.com',
                password: 'string',
            })
            .expect(HttpStatus.OK);

        let rt = loginResponse.headers['set-cookie'][0];
        rt = loginResponse.headers['set-cookie'][0].slice(13, rt.indexOf(';'));
        expect.setState({
            refreshToken: rt,
        });
        expect.setState({
            accessToken: loginResponse.body.accessToken,
        });

        expect(
            loginResponse.headers['set-cookie'][0].startsWith('refreshToken'),
        ).toBeTruthy();
        expect(loginResponse.body.accessToken).toBeDefined();

        const device = await dataSource.query(
            `
            SELECT "deviceName" 
            FROM public.device
            WHERE "deviceName" = 'device1'
        `,
        );
        expect(device[0]['deviceName']).toBe('device1');
    });

    it(`shouldn't login user with no exist login`, async () => {
        const loginResponse = await request(app.getHttpServer())
            .post(`/auth/login`)
            .set('User-Agent', 'device1')
            .send({
                loginOrEmail: 'example-non-exist@example.com',
                password: 'string',
            })
            .expect(HttpStatus.UNAUTHORIZED);
    });

    //todo получить самого себя
    it(`should get info about user`, async () => {
        const { accessToken } = expect.getState();
        const jwtService = new JwtService();
        const payload = jwtService.decode(accessToken);

        const user = await dataSource.query(
            `
            SELECT "id", "email", "login"
            FROM public.user
            WHERE "id" = $1
        `,
            [payload.userId],
        );

        const authMeResponse = await request(app.getHttpServer())
            .get(`/auth/me`)
            .set('authorization', `Bearer ${accessToken}`)
            .expect(HttpStatus.OK);

        expect(authMeResponse.body).toEqual({
            email: user[0].email,
            login: user[0].login,
            userId: payload.userId,
        });
    });

    it(`shouldn't get info about user with incorrect bearer`, async () => {
        const authMeResponse = await request(app.getHttpServer())
            .get(`/auth/me`)
            .set('authorization', `Bearer unknown`)
            .expect(HttpStatus.UNAUTHORIZED);
    });

    // рефреш токен
    it(`should refresh tokens`, async () => {
        const { refreshToken } = expect.getState();

        const refreshTokensResponse = await request(app.getHttpServer())
            .post(`/auth/refresh-token`)
            .set('cookie', `refreshToken=${refreshToken}`)
            .expect(HttpStatus.CREATED);

        const newRefreshToken = refreshTokensResponse.headers[
            'set-cookie'
        ][0].slice(13, 205);

        const jwtService = new JwtService();
        const payload = jwtService.decode(newRefreshToken);

        const device = await dataSource.query(
            `
            SELECT "iat"
            FROM public.device
            WHERE "deviceName" = 'device1'
        `,
        );

        expect(payload.iat).not.toBe(device[0]['iat']);
        expect(refreshToken).not.toBe(newRefreshToken);
        expect(refreshTokensResponse.body.accessToken).toBeDefined();
    });

    //логаут
    it(`should logout`, async () => {
        const { refreshToken } = expect.getState();

        const refreshTokensResponse = await request(app.getHttpServer())
            .post(`/auth/logout`)
            .set('cookie', `refreshToken=${refreshToken}`)
            .expect(HttpStatus.NO_CONTENT);

        const jwtService = new JwtService();
        const payload = jwtService.decode(refreshToken);

        const device = await dataSource.query(
            `
            SELECT "iat", "exp"
            FROM public.device
            WHERE "deviceName" = 'device1'
        `,
        );

        expect(payload.iat).not.toBe(device[0]['iat']);
        expect(payload.exp).not.toBe(device[0]['exp']);
    });

    it(`shouldn't logout with incorrect jwt`, async () => {
        const { refreshToken } = expect.getState();

        const deviceBefore = await dataSource.query(
            `
            SELECT "iat", "exp"
            FROM public.device
            WHERE "deviceName" = 'device1'
        `,
        );

        const refreshTokensResponse = await request(app.getHttpServer())
            .post(`/auth/logout`)
            .set('cookie', `refreshToken=incorrectjwt`)
            .expect(HttpStatus.UNAUTHORIZED);

        const deviceAfter = await dataSource.query(
            `
            SELECT "iat", "exp"
            FROM public.device
            WHERE "deviceName" = 'device1'
        `,
        );

        expect(deviceBefore.iat).toBe(deviceAfter.iat);
        expect(deviceBefore.exp).toBe(deviceAfter.exp);
    });
});
