import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
    PublishedStatus,
    QueryDtoForQuiz,
} from '../../../../common/dto/quiz-query-dto';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { PaginatorDto } from '../../../../common/dto/paginator-dto';
import { QuestionViewDto } from '../../api/dto/output/question-view.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../../domain/question.entity';
import { Repository } from 'typeorm';
import { LikeStatus } from '../../../blogs/likes/api/dto/output/likes-view.dto';
import { questionViewMapper } from '../../../../base/mappers/question-view-mapper';

export class GetQuestionsPayload implements IQuery {
    constructor(public queryDtoForQuiz: QueryDtoForQuiz) {}
}

@QueryHandler(GetQuestionsPayload)
export class GetQuestionsQuery
    implements
        IQueryHandler<
            GetQuestionsPayload,
            InterlayerNotice<GetQuestionsResultType>
        >
{
    constructor(
        @InjectRepository(Question) private questionRepo: Repository<Question>,
    ) {}

    async execute(
        query: GetQuestionsPayload,
    ): Promise<InterlayerNotice<GetQuestionsResultType>> {
        const notice = new InterlayerNotice<GetQuestionsResultType>();

        const questionsQuery = this.questionRepo
            .createQueryBuilder('q')
            .select([
                'q.id',
                'q.body',
                'q.answers',
                'q.published',
                'q.createdAt',
                'q.updatedAt',
            ])
            .orderBy(
                `"${query.queryDtoForQuiz.sortBy === 'createdAt' ? `q"."createdAt` : query.queryDtoForQuiz.sortBy}"`,
                query.queryDtoForQuiz.sortDirection,
            );

        //фильтр для поля published
        if (
            query.queryDtoForQuiz.publishedStatus === PublishedStatus.published
        ) {
            questionsQuery.andWhere('q."published" = :publishedStatus', {
                publishedStatus: true,
            });
        }
        if (
            query.queryDtoForQuiz.publishedStatus ===
            PublishedStatus.notPublished
        ) {
            questionsQuery.andWhere('q.published = :publishedStatus', {
                publishedStatus: false,
            });
        }

        //обработка для bodySearchTerm
        if (query.queryDtoForQuiz.bodySearchTerm) {
            questionsQuery.andWhere('q.body like :body', {
                body: `%${query.queryDtoForQuiz.bodySearchTerm}%`,
            });
        }

        //пагинация
        const countQuestions = await questionsQuery.getCount();
        questionsQuery.take(query.queryDtoForQuiz.pageSize);
        questionsQuery.skip(
            (query.queryDtoForQuiz.pageNumber - 1) *
                query.queryDtoForQuiz.pageSize,
        );

        const questions = await questionsQuery.getMany();
        const mappedQuestions: QuestionViewDto[] = [];
        questions.map((q) => {
            mappedQuestions.push(questionViewMapper(q));
        });

        const result: PaginatorDto<QuestionViewDto> = {
            pagesCount: Math.ceil(
                countQuestions / query.queryDtoForQuiz.pageSize,
            ),
            pageSize: query.queryDtoForQuiz.pageSize,
            page: query.queryDtoForQuiz.pageNumber,
            totalCount: countQuestions,
            items: mappedQuestions,
        };

        notice.addData(result);
        return notice;
    }
}

export type GetQuestionsResultType = PaginatorDto<QuestionViewDto>;
