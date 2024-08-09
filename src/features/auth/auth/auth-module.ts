import { Module } from '@nestjs/common';
import { AuthController } from './api/auth-controller';
import { AuthService } from './application/auth-service';
import { EmailService } from '../../../base/services/email-service';
import { UsersModule } from '../../users/users-module';

@Module({
    imports: [UsersModule],
    providers: [AuthService, EmailService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
