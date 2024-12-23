import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/auth/guards/jwt-auth-guard';
import { AccessTokenPayloadDto } from '../../../common/dto/access-token-payload-dto';
import { QuizService } from '../application/quiz.service';
import { AnswerInputDto } from './dto/input/answer-input.dto';
import { CreateAnswerCommand } from '../application/usecases/create-answer.command';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../base/models/interlayer';
import { AnswerViewDto } from './dto/output/answer-view.dto';
import {
    GetGamePayload,
    GetGameResultType,
} from '../infrastructure/queries/get-game.query';
import {
    GetStatisticPayload,
    GetStatisticResultType,
} from '../infrastructure/queries/get-my-statistic.query';
import {
    GetAllMyGamesPayload,
    GetMyAllGamesResultType,
} from '../infrastructure/queries/get-all-my-games.query';
import { QueryDtoForGetAllGames } from '../../../common/dto/query-dto';

const PREFIX_PAIRS = 'pairs';
const PREFIX_USERS = 'users';

@Controller(`pair-game-quiz`)
export class QuizController {
    constructor(
        private quizService: QuizService,
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Get(`${PREFIX_PAIRS}/my`)
    async getAllMyGames(
        @Req() req: any,
        @Query() query: QueryDtoForGetAllGames,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const queryPayload = new GetAllMyGamesPayload(
            query,
            accessTokenPayload.userId,
        );

        const allGamesInterlayer = await this.queryBus.execute<
            GetAllMyGamesPayload,
            InterlayerNotice<GetMyAllGamesResultType>
        >(queryPayload);

        if (allGamesInterlayer.hasError()) {
            switch (allGamesInterlayer.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN:
                    throw new ForbiddenException();
                case InterlayerStatuses.NOT_FOUND:
                    throw new NotFoundException();
            }
        }

        return allGamesInterlayer.data;
    }

    @UseGuards(JwtAuthGuard)
    @Post(`${PREFIX_PAIRS}/connection`)
    @HttpCode(HttpStatus.OK)
    async connection(@Req() req: any) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }
        const createConnectionInterlayer =
            await this.quizService.createConnection(accessTokenPayload.userId);

        if (createConnectionInterlayer.hasError()) {
            console.log(
                'createConnectionInterlayer.extensions[0].message',
                createConnectionInterlayer.extensions[0].message,
            );
            throw new ForbiddenException();
        }

        return createConnectionInterlayer.data;
    }

    @UseGuards(JwtAuthGuard)
    @Post(`${PREFIX_PAIRS}/my-current/answers`)
    @HttpCode(HttpStatus.OK)
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

    @UseGuards(JwtAuthGuard)
    @Get(`${PREFIX_PAIRS}/my-current`)
    async getCurrentUnfinishedGame(@Req() req: any) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const currentGameInterlayer =
            await this.quizService.getActiveGameByUserId(
                accessTokenPayload.userId,
            );
        if (currentGameInterlayer.hasError()) {
            throw new NotFoundException();
        }

        const queryPayload = new GetGamePayload(
            currentGameInterlayer.data.id,
            accessTokenPayload.userId,
        );
        const gameInterlayer = await this.queryBus.execute<
            GetGamePayload,
            InterlayerNotice<GetGameResultType>
        >(queryPayload);
        if (gameInterlayer.hasError()) {
            throw new NotFoundException();
        }

        return gameInterlayer.data;
    }

    @UseGuards(JwtAuthGuard)
    @Get(`${PREFIX_PAIRS}/:gameId`)
    async getGameById(
        @Param('gameId', ParseUUIDPipe) gameId: string,
        @Req() req: any,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const queryPayload = new GetGamePayload(
            gameId,
            accessTokenPayload.userId,
        );

        const gameInterlayer = await this.queryBus.execute<
            GetGamePayload,
            InterlayerNotice<GetGameResultType>
        >(queryPayload);

        if (gameInterlayer.hasError()) {
            switch (gameInterlayer.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN:
                    throw new ForbiddenException();
                case InterlayerStatuses.NOT_FOUND:
                    throw new NotFoundException();
            }
        }

        return gameInterlayer.data;
    }

    @UseGuards(JwtAuthGuard)
    @Get(`${PREFIX_USERS}/my-statistic`)
    async getMyStatistic(@Req() req: any) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const queryPayload = new GetStatisticPayload(accessTokenPayload);

        const gameInterlayer = await this.queryBus.execute<
            GetStatisticPayload,
            InterlayerNotice<GetStatisticResultType>
        >(queryPayload);

        if (gameInterlayer.hasError()) {
            switch (gameInterlayer.extensions[0].code) {
                case InterlayerStatuses.FORBIDDEN:
                    throw new ForbiddenException();
                case InterlayerStatuses.NOT_FOUND:
                    throw new NotFoundException();
            }
        }

        return gameInterlayer.data;
    }
}
