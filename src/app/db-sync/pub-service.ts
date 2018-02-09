import { IOrgMaster, OrgMasterModel } from './../org-master/org-master.model';
import { CometD } from "cometd";
import * as nforce from "nforce";
import { Constants } from "../../config/constants";
import * as request from 'request';
/**
 * @description Publish service can be used to publish data to salesforce.
 */
export class PubService {
    private orgMasterModel: OrgMasterModel;

    constructor() {
        this.orgMasterModel = new OrgMasterModel();
    }

    private getUserOrgConfig(userId: string, callback: (orgUserDetails: IOrgMaster) => void) {
        return this.orgMasterModel.getUserOrgDetails(userId, (error1, results) => {
            if (error1) {
                return;
            }
            if (results && results.length === 1 && callback) {
                callback(results[0]);
            }
        });
    }
    /**
     *
     * @param userId User id
     * @param data Data to be published
     * @param callback callback
     */
    public publish(userId: string, data: any, callback?: (error, eventResponse) => void) {
        this.getUserOrgConfig(userId, (userOrgDetails) => {

            const org = nforce.createConnection({
                clientId: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_id,
                clientSecret: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_secret,
                redirectUri: 'https://www.google.co.in/',
                // redirectUri: 'http://localhost:3000/oauth/_callback',
                apiVersion: 'v40.0',  // optional, defaults to current salesforce API version
                environment: 'production',  // optional, salesforce 'sandbox' or 'production', production default
                mode: 'single', // optional, 'single' or 'multi' user mode, multi default
                grant_type: "refresh_token",
                refresh_token: userOrgDetails.refresh_token,
            });

            this.authenticateAndRun(userOrgDetails, (error: any, response: request.Response) => {
                org.oauth = response.toJSON().body;
                console.log(org.oauth.instance_url);
                const event = nforce.createSObject(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT_NAME);
                event.set('Data__c', data);
                org.insert({ sobject: event }, (err1: any, resp: any) => {
                    if (err1) {
                        console.error(err1);
                    } else {
                        console.log(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT_NAME, " published");
                    }
                    if (callback) {
                        callback(err1, resp);
                    }
                });
            });
        });

    }
    private authenticateAndRun(orgConfig: IOrgMaster, callback: (error: any, response: request.Response) => void) {
        const serviceUserAuthConfig = {
            grant_type: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.grant_type,
            client_id: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_id,
            client_secret: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_secret,
            refresh_token: orgConfig.refresh_token,
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
