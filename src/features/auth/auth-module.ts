import { Module } from '@nestjs/common';
import { BasicStrategy } from './auth/strategies/basic-strategy';
import { AuthController } from './auth/api/auth-controller';
import { AuthService } from './auth/application/auth-service';
import { UsersModule } from '../users/users-module';
import { EmailService } from '../../base/services/email-service';

@Module({
    imports: [UsersModule],
    controllers: [AuthController],
    providers: [BasicStrategy, AuthService, EmailService],
    exports: [AuthService],
})
export class AuthModule {}
