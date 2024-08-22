import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { AppModule } from '../app-module';
import cookieParser from 'cookie-parser';
import {
    BadRequestException,
    ClassSerializerInterceptor,
    ValidationPipe,
} from '@nestjs/common';
import { HttpExceptionFilter } from '../common/exception-filters/http-exception-filter';
import { Reflector } from '@nestjs/core';

export const applyAppSettings = (app: NestExpressApplication) => {
    app.enableCors();
    app.set('trust proxy', true);

    // Для внедрения зависимостей в validator constraint
    // {fallbackOnErrors: true} требуется, поскольку Nest генерирует исключение,
    // когда DI не имеет необходимого класса.
    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            stopAtFirstError: true, //не работает с асинхронными декораторами
            exceptionFactory: (errors) => {
                const errorsForResponse = [];

                errors.forEach((e) => {
                    const constrainsKeys = Object.keys(e.constraints);
                    constrainsKeys.forEach((ckey) => {
                        errorsForResponse.push({
                            message: e.constraints[ckey],
                            field: e.property,
                        });
                    });
                });

                throw new BadRequestException(errorsForResponse);
            },
        }),
    );
    //для сериализации
    //todo почему-то в тестах не работает (нужно к методам в контроллере interceptor делать)
    app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
};
