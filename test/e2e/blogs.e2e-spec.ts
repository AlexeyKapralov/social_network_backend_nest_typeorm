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
import { UsersManagerTest } from '../utils/users-manager.test';
import { BlogsManagerTest } from '../utils/blogs-manager.test';
import { Blog } from '../../src/features/blogs/domain/blog-entity';

aDescribe(skipSettings.for('blogsTests'))('BlogsSaController (e2e)', () => {
    let app: NestExpressApplication;
    let dataSource: DataSource;
    let blogsManagerTest: BlogsManagerTest;

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

        blogsManagerTest = new BlogsManagerTest(app);
    });

    afterAll(async () => {
        await app.close();
    });

    //создание блога
    it('should create blog', async () => {
        const blog = await blogsManagerTest.createRandomBlog();

        const blogs = await dataSource.getRepository(Blog).find();

        expect(blogs.length).toBe(1);
    });
});
