import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export enum SortDirection {
    ASC = 'asc',
    DESC = 'desc',
}

export class QueryDtoBase {
    @IsString()
    sortBy: string = 'createdAt';
    @Transform(({ value }: TransformFnParams) => {
        switch (value) {
            case SortDirection.ASC:
                return 1;
            case SortDirection.DESC:
                return -1;
        }
    })
    sortDirection: number = -1;
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
    searchEmailTerm: string = null;
    searchLoginTerm: string = null;
}

export class QueryDtoWithName extends QueryDtoBase {
    searchNameTerm: string = null;
}
