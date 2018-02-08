import { Constants } from './config/constants';
import * as lib from "cometd";
import * as cometDNode from 'cometd-nodejs-client';
import { OrgMasterModel, IOrgMaster } from './app/org-master/org-master.model';
import * as request from 'request';
import * as nforce from "nforce";

export class SyncService {
    private sessionId: any;
    private cometd: any;
    private orgMasterModel: OrgMasterModel;
    constructor() {
        cometDNode.adapt();
        this.cometd = new lib.CometD('Node endpoint');
        // this.orgMasterModel = new OrgMasterModel();
        // this.orgMasterModel.getAllOrgDetails((error1, results) => {
        //     if (!error1) {
        //         results.forEach((org) => {
        //             const event_endpoint_url = org.event_endpoint_url;
        //             console.log(event_endpoint_url);
        //         });
        //     } else {
        //         console.log(error1);
        //     }
        // });
    }
    /**
     * @description Subscribes the event at the salesforce side and performs actions based on the event triggerred.
     */
    public listen() {
        this.authenticateAndRun((error: any, response: request.Response) => {
            if (error) {
                console.log('Authentication failed', error);
                return;
            }
            this.sessionId = response.toJSON().body.access_token;
            // Configure the CometD object.
            this.cometd.configure({
                url: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.URL,
                logLevel: 'debug',
                requestHeaders: {
                    // Test data:
                    Authorization: 'OAuth ' + this.sessionId,
                },
            });

            // Handshake with the server.
            this.cometd.handshake((h: any) => {
                if (h.successful) {
                    let data1 = null;
                    data1 = { Data__c: "test" };
                    this.publish(data1);
                    // Subscribe to receive messages from the server.
                    this.cometd.subscribe(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT, (m: any) => {
                        const dataFromServer = m.data;
                        console.log('Response Received! :', dataFromServer);
                        // let data = JSON.parse(dataFromServer.payload.Data__c);
                        // data.Projects[0].Name = "test";
                        // const datastr = JSON.stringify(data);
                        // data = { Data__c: "data" };
                        // this.publish(data);
                        // this.publish("test123");
                        // Use dataFromServer here.
                    });
                } else {
                    console.log(h);
                }
            });
        });
    }
    public publishRest(data?: any) {

        const org = nforce.createConnection({
            clientId: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_id,
            clientSecret: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_secret,
            redirectUri: 'https://www.google.co.in/',
            // redirectUri: 'http://localhost:3000/oauth/_callback',
            apiVersion: 'v40.0',  // optional, defaults to current salesforce API version
            environment: 'sandbox',  // optional, salesforce 'sandbox' or 'production', production default
            mode: 'single', // optional, 'single' or 'multi' user mode, multi default
            grant_type: "refresh_token",
            refresh_token: '5Aep8613hy0tHCYdhwe9FB19lxxsD1U4lzJJTGz11pm4z6GL6nOSvZIW56wdCiEJIztVCqniYXkzYwCdkz2nfXY',
        });
        // multi user mode
        this.authenticateAndRun((error: any, response: request.Response) => {
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
        return;
        // org.authenticate({ username: 'builderedge.poc2@gmail.com', password: 'pocorg@123' }, (err) => {
        // org.authenticate((err, res) => {
        //     if (err) {
        //         console.error("Salesforce authentication error");
        //         console.error(err);
        //     } else {
        //         console.log("Salesforce authentication successful");
        //         console.log(org.oauth.instance_url);
        //         const event = nforce.createSObject(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT_NAME);
        //         event.set('Data__c', "HELLOOOO");
        //         org.insert({ sobject: event }, (err1: any) => {
        //             if (err1) {
        //                 console.error(err1);
        //             } else {
        //                 console.log(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT_NAME, " published");
        //             }
        //         });
        //     }
        // });

    }
    /**
     * @description Publishes an event to the Salesforce endpoint
     */
    public publish(data: any) {
        this.authenticateAndRun((error: any, response: request.Response) => {
            if (error) {
                console.log('Authentication failed', error);
                return;
            }
            this.sessionId = response.toJSON().body.access_token;
            // Configure the CometD object.
            this.cometd.configure({
                url: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.URL,
                logLevel: 'debug',
                requestHeaders: {
                    // Test data:
                    Authorization: 'OAuth ' + this.sessionId,
                },
            });
            this.cometd.handshake((h: any) => {
                if (h.successful) {
                    this.cometd.publish(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT, data, (publishAck) => {
                        if (publishAck.successful) {
                            // The message reached the server
                            console.log("success");
                        }
                    });
                }
            });
        });

    }
    private authenticateAndRun(callback: (error: any, response: request.Response) => void) {
        const serviceUserAuthConfig = {
            grant_type: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.grant_type,
            client_id: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_id,
            client_secret: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_secret,
            refresh_token: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.refresh_token,
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
