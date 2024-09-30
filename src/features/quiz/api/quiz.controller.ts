import {
    Body,
    Controller,
    ForbiddenException,
    Post,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/auth/guards/jwt-auth-guard';
import { AccessTokenPayloadDto } from '../../../common/dto/access-token-payload-dto';
import { QuizService } from '../application/quiz.service';
import { AnswerInputDto } from './dto/input/answer-input.dto';
import { CreateAnswerCommand } from '../application/usecases/create-answer.command';
import { CommandBus } from '@nestjs/cqrs';
import { InterlayerNotice } from '../../../base/models/interlayer';
import { AnswerViewDto } from './dto/output/answer-view.dto';

@Controller('pair-game-quiz/pairs')
export class QuizController {
    constructor(
        private quizService: QuizService,
        private readonly commandBus: CommandBus,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('connection')
    async connection(@Req() req: any) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }
        const createConnectionInterlayer =
            await this.quizService.createConnection(accessTokenPayload.userId);
        if (createConnectionInterlayer.hasError()) {
            throw new ForbiddenException();
        }

        return createConnectionInterlayer.data;
    }

    @UseGuards(JwtAuthGuard)
    @Post('my-current/answers')
    async createAnswer(
        @Req() req: any,
        @Body() answerInputDto: AnswerInputDto,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const command = new CreateAnswerCommand(
            accessTokenPayload.userId,
            answerInputDto,
        );
        const createAnswerResult = await this.commandBus.execute<
            CreateAnswerCommand,
            InterlayerNotice<AnswerViewDto>
        >(command);

        if (createAnswerResult.hasError()) {
            throw new ForbiddenException();
        }

        return createAnswerResult.data;
    }
}
