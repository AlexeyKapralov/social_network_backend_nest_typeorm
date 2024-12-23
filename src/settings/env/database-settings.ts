import { EnvironmentVariable } from './env-settings';
import { IsString } from 'class-validator';

export class DatabaseSettings {
    constructor(private environmentVariable: EnvironmentVariable) {}

    @IsString()
    POSTGRESQL_TEST_DB_NAME = this.environmentVariable.POSTGRESQL_TEST_DB_NAME;
    @IsString()
    POSTGRES_DB_NAME = this.environmentVariable.POSTGRES_DB_NAME;
    @IsString()
    POSTGRES_USER = this.environmentVariable.POSTGRES_USER;
    @IsString()
    POSTGRES_PASSWORD = this.environmentVariable.POSTGRES_PASSWORD;
}
