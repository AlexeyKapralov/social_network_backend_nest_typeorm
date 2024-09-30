import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { SortDirection } from './query-dto';
import { Trim } from '../decorators/transform/trim-decorator';

export enum PublishedStatus {
    all = 'all',
    published = 'published',
    notPublished = 'notPublished',
}

export class QueryDtoBase {
    @IsString()
    sortBy: string = 'createdAt';
    @Transform(({ value }: TransformFnParams) => {
        switch (value.toUpperCase()) {
            case SortDirection.ASC:
                return SortDirection.ASC;
            case SortDirection.DESC:
                return SortDirection.DESC;
            default:
                return 'DESC';
        }
    })
    sortDirection: SortDirection = SortDirection.DESC;
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageNumber: number = 1;
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize: number = 10;
}

export class QueryDtoWithEmailLogin extends QueryDtoBase {
    // @Transform(({ value }: TransformFnParams) => {
    //     value.toUpperCase();
    // })
    searchEmailTerm: string = null;
    // @Transform(({ value }: TransformFnParams) => {
    //     value.toUpperCase();
    // })
    searchLoginTerm: string = null;
}

export class QueryDtoWithName extends QueryDtoBase {
    // @Transform(({ value }: TransformFnParams) => {
    //     value.toUpperCase();
    // })
    searchNameTerm: string = null;
}

export class QueryDtoForQuiz extends QueryDtoBase {
    @Trim()
    bodySearchTerm: string = null;

    @IsEnum(PublishedStatus)
    publishedStatus: PublishedStatus = PublishedStatus.all;
}
