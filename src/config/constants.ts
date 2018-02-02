export class Constants {
    static DB_CONNECTION_STRING: string = 'postgres://mzjseajwunmjbi:2add0b650f12012c219677ce95c13b36379f3d0df8f9f569cd15ba5623423f50@ec2-54-83-204-230.compute-1.amazonaws.com:5432/dei96aqio25l8r';
    static API_END_POINTS = {
        GET_PROJECT_AND_TASK_DETAILS: 'https://ap5.salesforce.com/services/apexrest/ProductSerivce'
    };
    static RESPONSE_STATUS = {
        SUCCESS: 'SUCCESS',
        ERROR: 'ERROR'
    };

}