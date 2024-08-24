import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();

        switch (status) {
            case HttpStatus.BAD_REQUEST:
                const errorsResponse = [];
                const responseBody: any = exception.getResponse();

                if (Array.isArray(responseBody.message)) {
                    responseBody.message.forEach((e) => errorsResponse.push(e));
                } else if (typeof responseBody.message !== 'object') {
                    errorsResponse.push(responseBody);
                } else {
                    errorsResponse.push(responseBody.message);
                }

                response.status(status).send({
                    errorsMessages: errorsResponse,
                });
                break;

            case HttpStatus.UNAUTHORIZED:
            case HttpStatus.FORBIDDEN:
                response.status(status).send();
                break;
            case HttpStatus.NOT_FOUND:
                response.status(status).send('Not Found');
                break;

            default:
                response.status(status).send({
                    statusCode: status,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                });
        }
    }
}
