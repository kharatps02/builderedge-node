export namespace Constants {
    export const POSTGRES_DB_CONFIG = {
        // tslint:disable-next-line:max-line-length
        connectionString: 'postgres://mzjseajwunmjbi:2add0b650f12012c219677ce95c13b36379f3d0df8f9f569cd15ba5623423f50@ec2-54-83-204-230.compute-1.amazonaws.com:5432/dei96aqio25l8r',
        ssl: true,
    };

    export const RESPONSE_STATUS = {
        SUCCESS: 'SUCCESS',
        ERROR: 'ERROR',
    };
    export const MESSAGES = {
        SAVED: 'Data saved successfully',
        UPDATED: 'Data updated successfully',
        SOMETHING_WENT_WRONG: 'something went wrong',
        INVALID_REQUEST_PARAMS: 'Invalid request params',
    };
    export const SALESFORCE_PLATFORM_EVENTS_CONFIG = {
        URL: 'https://ap5.salesforce.com/cometd/40.0/',
        EVENT: '/event/ProjectTaskService__e',
        EVENT_NAME: 'ProjectTaskService__e',
        SUB_EVENT_NAME: '/event/ProjectTaskService__e',
        //// ORG 1
        // OAUTH: {
        //     url: 'https://ap5.salesforce.com/services/oauth2/token',
        //     grant_type: "refresh_token",
        //     client_id: "3MVG9d8..z.hDcPJvS1kmRShyWMlrH2GkDXefwC.1dAylEi0bWd3yh6Q7xOlp3_9Ex9XAj_MJBiHPbtQ7YwKu",
        //     client_secret: "6637042274278747657",
        //     refresh_token: "5Aep8613hy0tHCYdhwfV72zcrObyt1SiQpoPS6OQCtnA8L_SxwRXduNgskPEK52EGDD_8E9U39ytarA0HsyyWwv",
        // },

        // ORG 2
        OAUTH: {
            url: 'https://ap5.salesforce.com/services/oauth2/token',
            grant_type: "refresh_token",
            client_id: "3MVG9d8..z.hDcPJvS1kmRShyWMlrH2GkDXefwC.1dAylEi0bWd3yh6Q7xOlp3_9Ex9XAj_MJBiHPbtQ7YwKu",
            client_secret: "6637042274278747657",
            refresh_token: "5Aep8613hy0tHCYdhwe9FB19lxxsD1U4lzJJTGz11pm4z6GL6nOSvZIW56wdCiEJIztVCqniYXkzYwCdkz2nfXY",
        },
    };
}
