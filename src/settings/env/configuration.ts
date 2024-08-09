import { ValidateNested, validateSync } from 'class-validator';
import { ApiSettings } from './api-settings';
import { DatabaseSettings } from './database-settings';
import { EnvironmentSettings, EnvironmentVariable } from './env-settings';

export type ConfigurationType = Configuration;

export class Configuration {
    @ValidateNested() //не игнорировать вложенную валидацию
    apiSettings: ApiSettings;
    @ValidateNested()
    databaseSettings: DatabaseSettings;
    @ValidateNested()
    environmentSettings: EnvironmentSettings;

    private constructor(configuration: Configuration) {
        Object.assign(this, configuration);
    }

    static createConfig(
        environmentVariables: Record<string, string>,
    ): Configuration {
        return new this({
            apiSettings: new ApiSettings(environmentVariables),
            databaseSettings: new DatabaseSettings(environmentVariables),
            environmentSettings: new EnvironmentSettings(environmentVariables),
        });
    }
}

export function validate(environmentVariable: Record<string, string>) {
    const config = Configuration.createConfig(environmentVariable);
    const errors = validateSync(config, { skipMissingProperties: false });
    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return config;
}

export default () => {
    const environmentVariables = process.env as EnvironmentVariable;
    console.log('(Configuration): process.env.ENV =', environmentVariables.ENV);
    return Configuration.createConfig(environmentVariables);
};
