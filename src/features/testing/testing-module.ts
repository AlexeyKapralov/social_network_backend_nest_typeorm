import { DynamicModule, Module } from '@nestjs/common';
import { TestingController } from './testing-controller';
import { TestingService } from './testing-service';

@Module({})
export class TestingModule {
    static register(env): DynamicModule {
        if (process.env.ENV !== 'PRODUCTION') {
            return {
                module: TestingModule,
                imports: [],
                controllers: [TestingController],
                providers: [TestingService],
                exports: [TestingService],
            };
        }

        return {
            module: TestingModule,
            imports: [],
            controllers: [],
            providers: [],
        };
    }
}
