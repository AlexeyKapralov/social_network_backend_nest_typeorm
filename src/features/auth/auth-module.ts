import { Module } from '@nestjs/common';
import { BasicStrategy } from './auth/strategies/basic-strategy';

@Module({
    imports: [],
    controllers: [],
    providers: [ BasicStrategy ],
    exports: [],
})
export class AuthModule {}
