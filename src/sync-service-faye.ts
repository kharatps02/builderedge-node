// import * as faye from "faye";
// import { Constants } from "./config/constants";
// import * as request from 'request';

// export class SyncService {
//     private client: any;
//     constructor() {
//         this.client = new faye.Client(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.URL);
//         this.addLogger();
//     }
//     private addLogger() {
//         this.client.addExtension({
//             incoming: (message, callback) => {
//                 console.log('incoming', message);
//                 callback(message);
//             },
//             outgoing: (message, callback) => {
//                 console.log('outgoing', message);
//                 callback(message);
//             },
//         });
//     }
//     /**
//      * publish
//      */
//     public publish(data?: any) {
//         this.authenticateAndRun((error, response) => {
//             if (error) {
//                 console.error(error);
//                 return;
//             }
//             console.log('Now publishing to the event ', Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT);
//             this.client.setHeader('Authorization', `OAuth ${response.toJSON().body.access_token}`);
//             // this.client.disable('websocket');
//             this.client.disable('autodisconnect');
//             const publication = this.client.publish(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT, { Data__c: "hello" });

//             publication.then(() => {
//                 console.log('Message received by server!');
//             }, (error1: any) => {
//                 console.log('There was a problem: ' + error1.message);
//             });
//             this.client.subscribe(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT, (data1) => {
//                 console.log('Got a message: ', data1);
//             });
//         });
//     }
//     /**
//      * listen
//      */
//     public listen() {
//         this.authenticateAndRun((error, response) => {
//             if (error) {
//                 console.error(error);
//                 return;
//             }
//             console.log('Now subscribing to the event ', Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT);
//             this.client.setHeader('Authorization', `OAuth ${response.toJSON().body.access_token}`);
//             // this.client.disable('websocket');
//             this.client.disable('autodisconnect');
//             this.client.subscribe(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT, (data) => {
//                 console.log('Got a message: ', data);
//             });
//         });
//     }
//     private authenticateAndRun(callback: (error: any, response: request.Response) => void) {
//         const serviceUserAuthConfig = {
//             grant_type: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.grant_type,
//             client_id: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_id,
//             client_secret: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_secret,
//             refresh_token: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.refresh_token,
//         };
//         const requestObj = {
//             url: 'https://ap5.salesforce.com/services/oauth2/token',
//             qs: serviceUserAuthConfig,
//             method: 'POST',
//             json: true,
//         };
//         console.log('In postRequestOnSalesforce requestObj - ', requestObj);
//         return request.post(requestObj, (error, response) => {
//             console.log('In postRequestOnSalesforce', error, response.body);
//             if (callback) {
//                 callback(error, response);
//             }
//         });
//     }
// }
