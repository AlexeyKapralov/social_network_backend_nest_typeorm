export type PaginatorDto<T> = {
    pagesCount: number;
    page: number;
    pageSize: number;
    totalCount: number;
    items: Array<T>;
};
