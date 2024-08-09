import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiSettings } from '../../src/settings/env/api-settings';
import * as request from 'supertest';
import { UserInputDto } from '../../src/features/users/api/dto/input/user-input-dto';

export class UsersManagerTest {
    constructor(protected readonly app: INestApplication) {}

    async createUser(
        userInputBody: UserInputDto,
        expectedStatus: HttpStatus = HttpStatus.CREATED,
    ): Promise<{ userId: string }> {
        const configService = this.app.get(ConfigService);
        const apiSettings = configService.get<ApiSettings>('apiSettings');
        const userName = apiSettings.ADMIN_USERNAME;
        const userPassword = apiSettings.ADMIN_PASSWORD;

        const buff = Buffer.from(`${userName}:${userPassword}`, 'utf-8');
        const decodedAuth = buff.toString('base64');

        const postResponse = await request(this.app.getHttpServer())
            .post('/sa/users')
            .set({ authorization: `Basic ${decodedAuth}` })
            .send(userInputBody)
            .expect(expectedStatus);

        if (expectedStatus === HttpStatus.CREATED) {
            expect(postResponse.body).toEqual({
                id: expect.stringMatching(
                    /^(?!00000000-0000-0000-0000-000000000000)([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/,
                ),
                email: userInputBody.email,
                login: userInputBody.login,
                createdAt: expect.stringMatching(
                    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                ),
            });
            return { userId: postResponse.body.id };
        }
        if (expectedStatus === HttpStatus.BAD_REQUEST) {
            expect(postResponse.body).toEqual({
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
