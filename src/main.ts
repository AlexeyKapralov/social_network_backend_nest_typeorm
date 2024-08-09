import { NestFactory } from '@nestjs/core';
import { AppModule } from './app-module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { applyAppSettings } from './settings/apply-app-settings';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from './settings/env/configuration';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    applyAppSettings(app);

    const configService = app.get(ConfigService<ConfigurationType, true>);
    const apiSettings = configService.get('apiSettings', { infer: true });
    const environmentSettings = configService.get('environmentSettings', {
        infer: true,
    });

    const port = apiSettings.PORT;

    await app.listen(port, () => {
        console.log('App starting listen port: ', port);
        console.log('ENV: ', environmentSettings.currentEnv);
    });
}
bootstrap();
