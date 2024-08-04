import { EnvironmentVariable } from './env-settings';
import { IsNumber, IsString } from 'class-validator';

export class DatabaseSettings {
    constructor( private environmentVariable: EnvironmentVariable ) {}

    @IsString()
    DB_PASSWORD = this.environmentVariable.DB_PASSWORD
    @IsString()
    POSTGRESQL_TEST_DB_NAME= this.environmentVariable.POSTGRESQL_TEST_DB_NAME
    @IsString()
    POSTGRESQL_DB_NAME = this.environmentVariable.POSTGRESQL_DB_NAME
}