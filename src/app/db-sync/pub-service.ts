import { IOrgMaster } from './../org-master/org-master.model';
import { CometD } from "cometd";
import * as nforce from "nforce";
import { Constants } from "../../config/constants";
import * as request from 'request';

export class PubService {
    constructor(private orgConfig: IOrgMaster) {

    }
    // /**
    //  * @description publish via cometD
    //  */
    // public publish(channel: string, data: any, callback?: (publishAck?: any) => void) {
    //     this.client.publish(channel, data, (publishAck) => {
    //         if (publishAck.successful) {
    //             // The message reached the server
    //             if (callback) {
    //                 callback(publishAck);
    //             }
    //         }
    //     });
    // }
    public publish(data?: any) {
        const org = nforce.createConnection({
            clientId: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_id,
            clientSecret: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_secret,
            redirectUri: 'https://www.google.co.in/',
            // redirectUri: 'http://localhost:3000/oauth/_callback',
            apiVersion: 'v40.0',  // optional, defaults to current salesforce API version
            environment: 'production',  // optional, salesforce 'sandbox' or 'production', production default
            mode: 'single', // optional, 'single' or 'multi' user mode, multi default
            grant_type: "refresh_token",
            refresh_token: this.orgConfig.refresh_token,
        });
        // multi user mode
        this.authenticateAndRun(this.orgConfig, (error: any, response: request.Response) => {
            org.oauth = response.toJSON().body;
            console.log(org.oauth.instance_url);
            const event = nforce.createSObject(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT_NAME);
            event.set('Data__c', "HELLOOOO");
            org.insert({ sobject: event }, (err1: any) => {
                if (err1) {
                    console.error(err1);
                } else {
                    console.log(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT_NAME, " published");
                }
            });
        });

    }
    private authenticateAndRun(orgConfig: IOrgMaster, callback: (error: any, response: request.Response) => void) {
        const serviceUserAuthConfig = {
            grant_type: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.grant_type,
            client_id: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_id,
            client_secret: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_secret,
            refresh_token: this.orgConfig.refresh_token,
        };
        const requestObj = {
            url: 'https://ap5.salesforce.com/services/oauth2/token',
            qs: serviceUserAuthConfig,
            method: 'POST',
            json: true,
        };
        console.log('In postRequestOnSalesforce requestObj - ', requestObj);
        return request.post(requestObj, (error, response) => {
            console.log('In postRequestOnSalesforce', error, response.body);
            if (callback) {
                callback(error, response);
            }
        });
    }
}
