import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/auth/guards/jwt-auth-guard';
import { AccessTokenPayloadDto } from '../../../common/dto/access-token-payload-dto';
import { QuizService } from '../application/quiz.service';
import { QuestionInputDto } from './dto/input/question-input.dto';
import { BasicAuthGuard } from '../../auth/auth/guards/basic-auth-guard';
import { PublishInputDto } from './dto/input/publish-input.dto';
import { QueryDtoForQuiz } from '../../../common/dto/quiz-query-dto';
import { QueryBus } from '@nestjs/cqrs';
import { GetQuestionsPayload } from '../infrastructure/queries/get-questions.query';
import { InterlayerNotice } from '../../../base/models/interlayer';
import { PaginatorDto } from '../../../common/dto/paginator-dto';

@Controller('sa/quiz')
export class QuizSuperAdminController {
    constructor(
        private quizService: QuizService,
        private queryBus: QueryBus,
    ) {}

    @UseGuards(BasicAuthGuard)
    @Get('questions')
    async getQuestions(@Query() query: QueryDtoForQuiz) {
        const payload = new GetQuestionsPayload(query);

        const getQuestionsInterlayer = await this.queryBus.execute<
            GetQuestionsPayload,
            InterlayerNotice<PaginatorDto<QueryDtoForQuiz>>
        >(payload);

        if (getQuestionsInterlayer.hasError()) {
            throw new NotFoundException();
        }
        return getQuestionsInterlayer.data;
    }

    @UseGuards(BasicAuthGuard)
    @Post('questions')
    async createQuestion(
        @Req() req: any,
        @Body() questionInputDto: QuestionInputDto,
    ) {
        const createQuestionInterlayer =
            await this.quizService.createQuestion(questionInputDto);
        if (createQuestionInterlayer.hasError()) {
            throw new BadRequestException({
                message: createQuestionInterlayer.extensions[0].message,
                field: createQuestionInterlayer.extensions[0].key,
            });
        }

        return createQuestionInterlayer.data;
    }

    @UseGuards(BasicAuthGuard)
    @Delete('questions/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteQuestion(@Param('id', ParseUUIDPipe) id: string) {
        const deleteQuestionInterlayer =
            await this.quizService.deleteQuestion(id);
        if (deleteQuestionInterlayer.hasError()) {
            throw new NotFoundException();
        }
    }

    @UseGuards(BasicAuthGuard)
    @Put('questions/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateQuestion(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() questionInputDto: QuestionInputDto,
    ) {
        const deleteQuestionInterlayer = await this.quizService.updateQuestion(
            id,
            questionInputDto,
        );
        if (deleteQuestionInterlayer.hasError()) {
            throw new NotFoundException();
        }
    }

    @UseGuards(BasicAuthGuard)
    @Put('questions/:id/publish')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updatePublishedStatusQuestion(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() publishInputDto: PublishInputDto,
    ) {
        const updatePublishedStatusQuestionInterlayer =
            await this.quizService.updatePublishedStatusQuestion(
                id,
                publishInputDto,
            );
        if (updatePublishedStatusQuestionInterlayer.hasError()) {
            throw new NotFoundException();
        }
    }
}