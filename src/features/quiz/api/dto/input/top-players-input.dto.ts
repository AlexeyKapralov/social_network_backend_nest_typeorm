import {
    ArrayNotEmpty,
    IsArray,
    IsNumber,
    Min,
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

enum availableSortValues {
    sumScore = 'sumScore',
    avgScores = 'avgScores',
    gamesCount = 'gamesCount',
    winsCount = 'winsCount',
    lossesCount = 'lossesCount',
    drawsCount = 'drawsCount',
}

enum sortEnum {
    asc = 'asc',
    desc = 'desc',
}

// Создайте пользовательский валидатор
@ValidatorConstraint({ async: false })
class IsValidSort implements ValidatorConstraintInterface {
    validate(sort: string[][], args: ValidationArguments) {
        return sort.every((item) => {
            const [first, second] = item;
            return first in availableSortValues && second in sortEnum;
        });
    }

    defaultMessage(args: ValidationArguments) {
        return `Each item in the sort array must have the first value in [sumScore, avgScores, gamesCount, winsCount, lossesCount, drawsCount and the second value in [desc, asc]`;
    }
}

// Регистрируйте пользовательский валидатор
function IsValidSortArray(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidSort,
        });
    };
}

export class TopPlayersInputDto {
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return [value];
        }
        return value;
    })
    @Transform(({ value }) => {
        return value.map((i) => {
            return i.trim().split(' ');
        });
    })
    @ArrayNotEmpty()
    @IsArray({ each: true })
    @IsValidSortArray()
    sort: string[][] = [
        ['avgScores', 'desc'],
        ['sumScore', 'desc'],
    ];
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageNumber: number = 1;
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize: number = 10;
}
