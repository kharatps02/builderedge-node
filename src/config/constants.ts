import { Enums } from "./enums";

/**
 * @description Access the constants from this namespace.
 */
export namespace Constants {
    // TESTING PURPOSE ONLY!! allows unauthorized data by skipping auth check.
    export const ALLOW_UNAUTHORIZED = (process.env.ALLOW_UNAUTHORIZED === 'true') || false;
    export const POSTGRES_DB_CONFIG = {
        // tslint:disable-next-line:max-line-length
        connectionString: process.env.DATABASE_URL || 'postgres://mzjseajwunmjbi:2add0b650f12012c219677ce95c13b36379f3d0df8f9f569cd15ba5623423f50@ec2-54-83-204-230.compute-1.amazonaws.com:5432/dei96aqio25l8r',
        ssl: true,
    };
    export namespace ENCRYPTION {
        export const TOKEN_ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || '';
        export const ORG_ID_ENCRYPTION_KEY = process.env.ORG_ID_ENCRYPTION_KEY || '';
    }
    export namespace SF_REST {
        export const GET_AUTHORIZED_PROJECT_IDS = '/services/apexrest/UserProjectPermission';
    }
    export const SYNC_QUERIES = {
        // tslint:disable-next-line:max-line-length
        ALL: '/services/data/v41.0/query?q=SELECT+Completion_Percentage__c,CreatedById,CreatedDate,Description__c,End_Date__c,External_Id__c,Id,LastModifiedById,LastModifiedDate,Name,Start_Date__c,Status__c,SystemModstamp,(SELECT+Completion_Percentage__c,CreatedById,CreatedDate,Description__c,End_Date__c,External_Id__c,Id,LastModifiedById,LastModifiedDate,Name,Project__c,Start_Date__c,Status__c,SystemModstamp+FROM+Project_Tasks__r)+FROM+Project__c',
        // Add more queries here:
    };
    export namespace MESSAGES {
        export const SAVED = 'Data saved successfully';
        export const UPDATED = 'Data updated successfully';
        export const SOMETHING_WENT_WRONG = 'something went wrong';
        export const INVALID_REQUEST_PARAMS = 'Invalid request params';
    }

    export const COMETD = {
        LOG_MODE: process.env.COMETD_LOG_MODE || Enums.COMETD_LOG_MODES.ERROR,
    };
    export const OAUTH = {
        url: process.env.OAUTH_URL || 'https://ap5.salesforce.com/services/oauth2/token',
        grant_type: process.env.OAUTH_GRANT_TYPE || "refresh_token",
        client_id: process.env.OAUTH_CLIENT_ID || "3MVG9d8..z.hDcPJvS1kmRShyWMlrH2GkDXefwC.1dAylEi0bWd3yh6Q7xOlp3_9Ex9XAj_MJBiHPbtQ7YwKu",
        client_secret: process.env.OAUTH_CLIENT_SECRET || "6637042274278747657",
        redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:4300/oauth/callback',
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
    };
}
