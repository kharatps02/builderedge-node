export class Constants {
    static POSTGRES_DB_CONFIG = {
        connectionString: 'postgres://mzjseajwunmjbi:2add0b650f12012c219677ce95c13b36379f3d0df8f9f569cd15ba5623423f50@ec2-54-83-204-230.compute-1.amazonaws.com:5432/dei96aqio25l8r',
        ssl: true
    };
    static API_END_POINTS = {
        GET_PROJECT_AND_TASK_DETAILS: 'https://ap5.salesforce.com/services/apexrest/ProductSerivce',
        UPDATE_PROJECT_OR_TASK_DETAILS: 'https://ap5.salesforce.com/services/data/v40.0/sobjects/ProjectTaskService__e'
    };
    static RESPONSE_STATUS = {
        SUCCESS: 'SUCCESS',
        ERROR: 'ERROR'
    };
    static MESSAGES = {
        SAVED: 'Data saved successfully',
        UPDATED: 'Data updated successfully',
        SOMETHING_WENT_WRONG: 'something went wrong',
        INVALID_SESSION_ID: 'Invalid session id'
    }

}