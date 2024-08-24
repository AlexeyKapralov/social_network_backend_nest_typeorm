import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app-module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { applyAppSettings } from '../../src/settings/apply-app-settings';
import { HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { aDescribe } from '../utils/aDescribe';
import { skipSettings } from '../utils/skip-settings';
import { BlogsManagerTest } from '../utils/blogs-manager.test';
import { ConfigService } from '@nestjs/config';
import { ApiSettings } from '../../src/settings/env/api-settings';
import { Blog } from '../../src/features/blogs/blogs/domain/blog-entity';
import { BlogInputDto } from '../../src/features/blogs/blogs/api/dto/input/blog-input-dto';

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
    let blog;
    it('should create blog', async () => {
        blog = await blogsManagerTest.createRandomBlog();

        const blogs = await dataSource.getRepository(Blog).find();

        expect(blogs.length).toBe(1);
    });

    //обновление блога
    it('should update blog', async () => {
        const configService = app.get(ConfigService);
        const apiSettings = configService.get<ApiSettings>('apiSettings');
        const userName = apiSettings.ADMIN_USERNAME;
        const userPassword = apiSettings.ADMIN_PASSWORD;

        const buff = Buffer.from(`${userName}:${userPassword}`, 'utf-8');
        const decodedAuth = buff.toString('base64');

        const blogInputBody: BlogInputDto = {
            name: 'newName',
            description: 'newDescription',
            websiteUrl: 'https://someurl.com',
        };

        await request(app.getHttpServer())
            .put(`/sa/blogs/${blog.blogId}`)
            .set({ authorization: `Basic ${decodedAuth}` })
            .send(blogInputBody)
            .expect(HttpStatus.NO_CONTENT);

        const blogs = await dataSource.getRepository(Blog).find();

        expect(blogs[0].id).toBe(blog.blogId);
        expect(blogs[0].name).toBe(blogInputBody.name);
        expect(blogs[0].description).toBe(blogInputBody.description);
        expect(blogs[0].websiteUrl).toBe(blogInputBody.websiteUrl);
    });
});
