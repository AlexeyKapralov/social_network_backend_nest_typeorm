import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiSettings } from '../../settings/env/api-settings';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    constructor(private readonly configService: ConfigService) {}

    async sendEmail(email: string, subject: string, html: string) {
        const apiSettings = this.configService.get<ApiSettings>('apiSettings', {
            infer: true,
        });
        const userPassword = apiSettings.USER_EMAIL_PASSWORD;
        const userLogin = apiSettings.USER_EMAIL_LOGIN;
        let transport = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: userLogin,
                pass: userPassword,
            },
        });
        transport
            .sendMail({
                from: `"Alexey" <alewka24@gmail.com>`,
                to: email,
                subject,
                html,
            })
            .then(console.info)
            .catch(console.error);
    }
}
