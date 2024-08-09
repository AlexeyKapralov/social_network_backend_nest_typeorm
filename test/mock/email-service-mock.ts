import { EmailService } from '../../src/base/services/email-service';

export class EmailServiceMock extends EmailService {
    async sendEmail(email: string, subject: string, html: string) {
        console.log('email service mock was called');
        return Promise.resolve();
    }
}
