import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app-module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { applyAppSettings } from '../../src/settings/apply-app-settings';
import { DataSource } from 'typeorm';
import { Device } from '../../src/features/auth/devices/domain/device-entity';
import { v4 as uuid } from 'uuid';
import { DeviceService } from '../../src/features/auth/devices/application/device-service';

describe('DeviceService (integration)', () => {
    // aDescribe(skipSettings.for('authTests'))('AuthController (e2e)', () => {
    let app: NestExpressApplication;
    let deviceService: DeviceService;
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

        deviceService = app.get<DeviceService>(DeviceService);
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

    it('should check device in db', async () => {
        const deviceRepo = dataSource.getRepository(Device);

        let iat = new Date();
        let exp = new Date();
        exp.setDate(new Date().getDate() + 3);

        const device = new Device();
        device.id = uuid();
        device.ip = '1234';
        device.iat = iat;
        device.exp = exp;
        device.userId = 'user Id';
        device.deviceName = 'device Name';

        await deviceRepo.save(device);

        const isDeviceExpInterlayer = await deviceService.checkDeviceExpiration(
            device.id,
            device.iat,
        );

        expect(isDeviceExpInterlayer.hasError()).toBeFalsy();
    });
});
