import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { TestingService } from './testing-service';

@Controller()
export class TestingController {
    constructor(private readonly testingService: TestingService) {}

    @Delete('testing/all-data')
    @HttpCode(HttpStatus.NO_CONTENT)
    async clearAll() {
        await this.testingService.clearAll();
    }
}
