export const aDescribe = (skip: boolean): jest.Describe => {
    if (skip) {
        return describe.skip;
    }
    return describe;
};
