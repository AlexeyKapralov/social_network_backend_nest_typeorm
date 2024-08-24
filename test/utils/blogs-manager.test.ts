import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiSettings } from '../../src/settings/env/api-settings';
import request from 'supertest';
import { BlogInputDto } from '../../src/features/blogs/api/dto/input/blog-input-dto';

export class BlogsManagerTest {
    constructor(protected readonly app: INestApplication) {}

    async createRandomBlog(): Promise<{ blogId: string }> {
        const configService = this.app.get(ConfigService);
        const apiSettings = configService.get<ApiSettings>('apiSettings');
        const userName = apiSettings.ADMIN_USERNAME;
        const userPassword = apiSettings.ADMIN_PASSWORD;

        const buff = Buffer.from(`${userName}:${userPassword}`, 'utf-8');
        const decodedAuth = buff.toString('base64');

        const expectedStatus: HttpStatus = HttpStatus.CREATED;
        const blogInputBody: BlogInputDto = {
            name:
                'name' + String(Math.floor(Math.random() * (100 - 1 + 1)) + 1),
            websiteUrl: 'https://example.com',
            description:
                'description' +
                String(Math.floor(Math.random() * (100 - 1 + 1)) + 1),
        };

        const blogResponse = await request(this.app.getHttpServer())
            .post('/sa/blogs')
            .set({ authorization: `Basic ${decodedAuth}` })
            .send(blogInputBody)
            .expect(expectedStatus);

        if (expectedStatus === HttpStatus.CREATED) {
            expect(blogResponse.body).toEqual({
                id: expect.stringMatching(
                    /^(?!00000000-0000-0000-0000-000000000000)([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/,
                ),
                name: blogInputBody.name,
                description: blogInputBody.description,
                websiteUrl: blogInputBody.websiteUrl,
                isMembership: true,
                createdAt: expect.stringMatching(
                    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                ),
            });
            return { blogId: blogResponse.body.id };
        }
        if (expectedStatus === HttpStatus.BAD_REQUEST) {
            expect(blogResponse.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    {
                        message: expect.any(String),
                        field: expect.any(String),
                    },
                ]),
            });
            return null;
        }
    }
}
