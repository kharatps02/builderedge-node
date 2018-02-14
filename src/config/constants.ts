/**
 * @description Access the constants from this namespace.
 */
export namespace Constants {
    export const POSTGRES_DB_CONFIG = {
        // tslint:disable-next-line:max-line-length
        connectionString: process.env.DATABASE_URL || 'postgres://mzjseajwunmjbi:2add0b650f12012c219677ce95c13b36379f3d0df8f9f569cd15ba5623423f50@ec2-54-83-204-230.compute-1.amazonaws.com:5432/dei96aqio25l8r',
        ssl: true,
    };

    export const MESSAGES = {
        SAVED: 'Data saved successfully',
        UPDATED: 'Data updated successfully',
        SOMETHING_WENT_WRONG: 'something went wrong',
        INVALID_REQUEST_PARAMS: 'Invalid request params',
    };
    export enum COMETD_LOG_MODES {
        ERROR = 'error',
        INFO = 'info',
        WARNING = 'warn',
        DEBUG = 'debug',
    }
    export const COMETD = {
        LOG_MODE: process.env.COMETD_LOG_MODE || COMETD_LOG_MODES.ERROR,
    };
    export const OAUTH = {
        url: process.env.OAUTH_URL || 'https://ap5.salesforce.com/services/oauth2/token',
        grant_type: process.env.OAUTH_GRANT_TYPE || "refresh_token",
        client_id: process.env.OAUTH_CLIENT_ID || "3MVG9d8..z.hDcPJvS1kmRShyWMlrH2GkDXefwC.1dAylEi0bWd3yh6Q7xOlp3_9Ex9XAj_MJBiHPbtQ7YwKu",
        client_secret: process.env.OAUTH_CLIENT_SECRET || "6637042274278747657",
        // This URI was set at Salesforce OAuth Configuration
        redirectUri: process.env.OAUTH_REDIRECT_URI || 'https://www.google.co.in/',
        method: process.env.OAUTH_METHOD || 'POST',
    };
    /**
     * Platform events configuration along with OAUTH config.
     */
    export const SALESFORCE_PLATFORM_EVENTS_CONFIG = {
        DATA_OBJ_KEY: process.env.SPE_DATA_OBJ_KEY || 'Data__c',
        URL: process.env.SPE_URL || 'https://ap5.salesforce.com/cometd/40.0/',
        EVENT: `/event/${process.env.SPE_EVENT || 'ProjectTaskService__e'}`,
        EVENT_NAME: process.env.SPE_EVENT || 'ProjectTaskService__e',
        API_VERSION: process.env.SPE_VERSION || 'v40.0',
        MODE: process.env.SPE_MODE || 'single',
        ENV: process.env.SPE_ENV || 'production',
        OAUTH: {
            url: process.env.SPE_OAUTH_URL || 'https://ap5.salesforce.com/services/oauth2/token',
            grant_type: process.env.SPE_OAUTH_GRANT_TYPE || "refresh_token",
            client_id: process.env.SPE_OAUTH_CLIENT_ID || "3MVG9d8..z.hDcPJvS1kmRShyWMlrH2GkDXefwC.1dAylEi0bWd3yh6Q7xOlp3_9Ex9XAj_MJBiHPbtQ7YwKu",
            client_secret: process.env.SPE_OAUTH_CLIENT_SECRET || "6637042274278747657",
            // This URI was set at Salesforce OAuth Configuration
            redirectUri: process.env.SPE_OAUTH_REDIRECT_URI || 'https://www.google.co.in/',
            method: process.env.SPE_OAUTH_METHOD || 'POST',
        },
    };
}
