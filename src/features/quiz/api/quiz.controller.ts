import {
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

@Controller('pair-game-quiz/pairs')
export class QuizController {
    constructor(private quizService: QuizService) {}

    @UseGuards(JwtAuthGuard)
    @Post('connection')
    async connection(@Req() req: any) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        console.log(accessTokenPayload);
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
}
