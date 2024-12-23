import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

export enum SortDirection {
    ASC = 'ASC',
    DESC = 'DESC',
}

export enum SortField {
    id = 'id',
    status = 'status',
    pairCreatedDate = 'pairCreatedDate',
    startGameDate = 'startGameDate',
    finishGameDate = 'finishGameDate',
}

export class QueryDtoBase {
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

export class QueryDto extends QueryDtoBase {
    @IsString()
    sortBy: string = 'createdAt';
}

export class QueryDtoForGetAllGames extends QueryDtoBase {
    @IsString()
    @IsEnum(SortField)
    sortBy: SortField = SortField.pairCreatedDate;
}

export class QueryDtoWithEmailLogin extends QueryDto {
    // @Transform(({ value }: TransformFnParams) => {
    //     value.toUpperCase();
    // })
    searchEmailTerm: string = null;
    // @Transform(({ value }: TransformFnParams) => {
    //     value.toUpperCase();
    // })
    searchLoginTerm: string = null;
}

export class QueryDtoWithName extends QueryDto {
    // @Transform(({ value }: TransformFnParams) => {
    //     value.toUpperCase();
    // })
    searchNameTerm: string = null;
}
