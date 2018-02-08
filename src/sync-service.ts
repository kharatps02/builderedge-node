import { Constants } from './config/constants';
import * as lib from "cometd";
import * as cometDNode from 'cometd-nodejs-client';
import * as request from 'request';

export class SyncService {
    private sessionId: any;
    private cometd: any;
    constructor() {
        cometDNode.adapt();
        this.cometd = new lib.CometD('Node endpoint');
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
                    // tslint:disable-next-line:max-line-length
                    // Authorization: 'Bearer 00D7F000004e6Pi!AQ4AQCAdgGyYogsKJu7MxjicqqmpPt5bAqKEd_f9NOde5tR9NKBxvAN.XtpNoFOSYFAVnJJjSpT1rd2MED86qRLNKoNf_l3J', //  + this.sessionId,
                    // Authorization: 'OAuth 00D7F000004e6Pi!AQ4AQColcJS.xT84v.862dSO85P3UVVTL7Lqqt01b91FSaPTDOTLdgpGHrR5y_3h9pkfY.shmR7XLrNtm7TXXAJimWYr0VKC', //  + this.sessionId,
                    Authorization: 'OAuth ' + this.sessionId,
                },
            });

            // Handshake with the server.
            this.cometd.handshake((h: any) => {
                if (h.successful) {
                    // Subscribe to receive messages from the server.
                    this.cometd.subscribe(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT, (m: any) => {
                        const dataFromServer = m.data;
                        console.log(dataFromServer);
                        // Use dataFromServer here.
                    });
                } else {
                    console.log(h);
                }
            });
        });
    }
    /**
     * @description Publishes an event to the Salesforce endpoint
     */
    public publish() {

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
