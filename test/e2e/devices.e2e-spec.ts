import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app-module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { applyAppSettings } from '../../src/settings/apply-app-settings';
import { HttpStatus } from '@nestjs/common';
import { DataSource, MoreThan } from 'typeorm';
import { EmailService } from '../../src/base/services/email-service';
import { EmailServiceMock } from '../mock/email-service-mock';
import { JwtService } from '@nestjs/jwt';
import { aDescribe } from '../utils/aDescribe';
import { skipSettings } from '../utils/skip-settings';
import { Device } from '../../src/features/auth/devices/domain/device-entity';
import { v4 as uuid } from 'uuid';
import { AuthService } from '../../src/features/auth/auth/application/auth-service';
import { IsString } from 'class-validator';
import { User } from '../../src/features/users/domain/user-entity';
import { LoginInputDto } from '../../src/features/auth/auth/api/dto/input/login-input-dto';
import { CryptoService } from '../../src/base/services/crypto-service';

aDescribe(skipSettings.for('devicesTests'))('DeviceController (e2e)', () => {
    let app: NestExpressApplication;
    let dataSource: DataSource;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            // .overrideProvider(EmailService) // для мока (передаем класс который хотим переопределить)
            // .useClass(EmailServiceMock) // моковый класс
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

    //получение всех девайсов
    it('should create all devices and user', async () => {
        const devicesOld = await dataSource.query(`
        SELECT * FROM public.device`);
        expect(devicesOld).toHaveLength(0);

        const deviceRepo = dataSource.getRepository(Device);
        const userRepo = dataSource.getRepository(User);

        const cryptoService = app.get<CryptoService>(CryptoService);
        const passHash = await cryptoService.createPasswordHash('124');

        const user = new User();
        user.confirmationCode = uuid();
        user.login = 'login';
        user.createdAt = new Date();
        user.email = 'email';
        user.password = passHash;
        user.confirmationCodeExpireDate = new Date();
        user.confirmationCode = uuid();
        user.id = uuid();
        user.isDeleted = false;
        user.isConfirmed = true;
        await userRepo.save(user);

        expect.setState({
            user: user,
        });

        let iat = new Date(Math.trunc(Date.now() / 1000) * 1000);
        let exp = new Date(Math.trunc(Date.now() / 1000) * 1000);
        iat.setDate(new Date().getDate() + 1);
        exp.setDate(new Date().getDate() + 2);

        const device = new Device();
        device.id = uuid();
        device.ip = '1234';
        device.iat = iat;
        device.exp = exp;
        device.userId = user.id;
        device.deviceName = 'device Name';
        await deviceRepo.save(device);

        let iat2 = new Date(Math.trunc(Date.now() / 1000) * 1000);
        let exp2 = new Date(Math.trunc(Date.now() / 1000) * 1000);
        iat2.setDate(new Date().getDate() + 2);
        exp2.setDate(new Date().getDate() + 3);
        const device2 = new Device();
        device2.id = uuid();
        device2.ip = '12342';
        device2.iat = iat2;
        device2.exp = exp2;
        device2.userId = user.id;
        device2.deviceName = 'device Name2';
        await deviceRepo.save(device2);

        let iat3 = new Date(Math.trunc(Date.now() / 1000) * 1000);
        let exp3 = new Date(Math.trunc(Date.now() / 1000) * 1000);
        iat3.setDate(new Date().getDate() + 3);
        exp3.setDate(new Date().getDate() + 4);
        const device3 = new Device();
        device3.id = uuid();
        device3.ip = '123423';
        device3.iat = iat3;
        device3.exp = exp3;
        device3.userId = user.id;
        device3.deviceName = 'device Name3';
        await deviceRepo.save(device3);

        expect.setState({
            device: device3,
            device2: device2,
        });

        const devices = await dataSource.query(`
        SELECT * FROM public.device`);

        expect(devices).toHaveLength(3);
    });

    //удаление одного девайса
    it(`should terminate specific device and shouldn't with unknown id`, async () => {
        const { device } = expect.getState();
        const { user } = expect.getState();

        const loginInputDto = {
            loginOrEmail: user.login,
            password: '124',
        };

        const authService = app.get<AuthService>(AuthService);
        const tokens = await authService.login(
            loginInputDto,
            '124.1234.1241254',
            'iphone',
        );

        await request(app.getHttpServer())
            .delete(`/security/devices/${device.id}`)
            .set('cookie', `refreshToken=${tokens.data.refreshToken}`)
            .expect(HttpStatus.NO_CONTENT);

        await request(app.getHttpServer())
            .delete(`/security/devices/00000000-0000-0000-0000-000000000000`)
            .set('cookie', `refreshToken=${tokens.data.refreshToken}`)
            .expect(HttpStatus.NOT_FOUND);
    });

    //получение всех девайсов
    it('should get all devices for user', async () => {
        const { user } = expect.getState();
        const { device } = expect.getState();

        const loginInputDto: LoginInputDto = {
            loginOrEmail: user.login,
            password: '124',
        };

        const authService = app.get<AuthService>(AuthService);
        const tokens = await authService.login(
            loginInputDto,
            '124.1234.1241254',
            'iphone',
        );

        const devicesResponse = await request(app.getHttpServer())
            .get(`/security/devices`)
            .set('cookie', `refreshToken=${tokens.data.refreshToken}`)
            .expect(HttpStatus.OK);

        expect(devicesResponse.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    ip: expect.any(String),
                    title: expect.any(String),
                    lastActiveDate: expect.any(String),
                    deviceId: expect.any(String),
                }),
            ]),
        );
        expect(devicesResponse.body).toHaveLength(3);
    });

    it(`should with no token`, async () => {
        await request(app.getHttpServer())
            .delete(`/security/devices/00000000-0000-0000-0000-000000000000`)
            .set('cookie', `refreshToken=123`)
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`shouldn't terminate specific device from user no owner`, async () => {
        const { device2 } = expect.getState();

        const userRepo = dataSource.getRepository(User);

        const cryptoService = app.get<CryptoService>(CryptoService);
        const passHash = await cryptoService.createPasswordHash('12456');

        const user = new User();
        user.confirmationCode = uuid();
        user.login = 'login2';
        user.createdAt = new Date();
        user.email = 'email2';
        user.password = passHash;
        user.confirmationCodeExpireDate = new Date();
        user.confirmationCode = uuid();
        user.id = uuid();
        user.isDeleted = false;
        user.isConfirmed = true;
        await userRepo.save(user);

        const loginInputDto = {
            loginOrEmail: user.login,
            password: '12456',
        };

        const authService = app.get<AuthService>(AuthService);
        const tokens = await authService.login(
            loginInputDto,
            'samsung ip',
            'samsung',
        );

        await request(app.getHttpServer())
            .delete(`/security/devices/${device2.id}`)
            .set('cookie', `refreshToken=${tokens.data.refreshToken}`)
            .expect(HttpStatus.FORBIDDEN);
    });
});
