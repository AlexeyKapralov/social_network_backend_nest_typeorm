export class InterlayerNotice<D = null> {
    public data: D | null = null;
    public extensions: InterlayerExtensions[];
    public code = 0;

    constructor(data: D | null = null) {
        this.data = data;
        this.extensions = [];
    }

    public addData(data: D): void {
        this.data = data;
    }
    public addError(
        message: string,
        key: string | null = null,
        code: InterlayerStatuses | null = null,
    ): void {
        this.code = code ?? 1;
        this.extensions.push(new InterlayerExtensions(message, key, code));
    }
    public hasError(): boolean {
        return this.code !== 0;
    }
}

export class InterlayerExtensions {
    public readonly message: string;
    public readonly key: string | null;
    public readonly code: InterlayerStatuses | null;

    constructor(
        message: string,
        key: string | null = null,
        code: InterlayerStatuses | null,
    ) {
        this.message = message;
        this.key = key;
        this.code = code;
    }
}

export enum InterlayerStatuses {
    //Начало с 2, т.к. 1 занят untitled ошибкой
    NOT_FOUND = 2,
    FORBIDDEN = 3,
    BAD_REQUEST = 3,
}
