export const skipSettings = {
    //будут ли запускаться все тесты?
    run_all_tests: false,

    //что пропустить
    appTests: true,
    usersTests: true,
    authTests: true,
    devicesTests: true,
    blogsTests: false,

    for(testName: TestsNames) {
        // If we need run all tests without skip
        if (this.run_all_tests) {
            return false;
        }

        // if test setting exist we need return his setting
        if (typeof this[testName] === 'boolean') {
            return this[testName];
        }

        return false;
    },
};

export type TestsNames =
    | 'appTests'
    | 'usersTests'
    | 'authTests'
    | 'devicesTests'
    | 'blogsTests';
