import { EnvironmentVariable } from './env-settings';
import { IsString } from 'class-validator';

export class ApiSettings {
    constructor(private environmentVariable: EnvironmentVariable) {}

    @IsString()
    SECRET = this.environmentVariable.SECRET;
    @IsString()
    PORT = this.environmentVariable.PORT;
    @IsString()
    ADMIN_USERNAME = this.environmentVariable.ADMIN_USERNAME;
    @IsString()
    ADMIN_PASSWORD = this.environmentVariable.ADMIN_PASSWORD;
}
