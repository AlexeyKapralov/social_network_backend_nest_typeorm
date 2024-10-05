import { Transform, TransformFnParams } from 'class-transformer';

// Custom decorator (в библиотеке class-transformer по умолчанию нету декоратора trim)
// не забываем установить transform: true в глобальном ValidationPipe
export const Trim = () =>
    Transform(({ value }: TransformFnParams) => {
        if (Array.isArray(value)) {
            return value.map((item) => item.trim());
        }
        return value
            ?.split(',')
            .map((i) => i.trim())
            .join(',');
    });
