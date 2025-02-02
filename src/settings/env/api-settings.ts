import { EnvironmentVariable } from './env-settings';
import { IsString, Matches } from 'class-validator';

export class ApiSettings {
    constructor(private readonly environmentVariable: EnvironmentVariable) {}

    @IsString()
    SECRET = this.environmentVariable.SECRET;
    @IsString()
    PORT = this.environmentVariable.PORT;
    @IsString()
    ADMIN_USERNAME = this.environmentVariable.ADMIN_USERNAME;
    @IsString()
    ADMIN_PASSWORD = this.environmentVariable.ADMIN_PASSWORD;
    @IsString()
    USER_EMAIL_LOGIN = this.environmentVariable.USER_EMAIL_LOGIN;
    @IsString()
    USER_EMAIL_PASSWORD = this.environmentVariable.USER_EMAIL_PASSWORD;
    @Matches('\\d+(?: days|m|s)')
    ACCESS_TOKEN_EXPIRATION_LIVE =
        this.environmentVariable.ACCESS_TOKEN_EXPIRATION_LIVE;
    @Matches('\\d+(?: days|m|s)')
    REFRESH_TOKEN_EXPIRATION_LIVE =
        this.environmentVariable.REFRESH_TOKEN_EXPIRATION_LIVE;
    @IsString()
    YANDEX_S3_KEY_ID = this.environmentVariable.YANDEX_S3_KEY_ID;
    @IsString()
    YANDEX_S3_SECRET_KEY = this.environmentVariable.YANDEX_S3_SECRET_KEY;
    @IsString()
    YANDEX_S3_ENDPOINT = this.environmentVariable.YANDEX_S3_ENDPOINT;
    @IsString()
    YANDEX_S3_BUCKET_NAME = this.environmentVariable.YANDEX_S3_BUCKET_NAME;
}
