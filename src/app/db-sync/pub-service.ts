import { Authentication } from './../../core/authentication/authentication';
import { IOrgMaster, OrgMasterModel } from './../org-master/org-master.model';
import { CometD } from "cometd";
import * as nforce from "nforce";
import { Constants } from "../../config/constants";
import * as request from 'request';

/**
 * @description Publish service can be used to publish data to salesforce.
 */
export class PubService {
    private authenticator: Authentication;
    private orgMasterModel: OrgMasterModel;

    constructor() {
        this.orgMasterModel = new OrgMasterModel();
        this.authenticator = new Authentication();
    }
    /**
     * @description Gets Org config for the given org Id.
     * @param orgId Org Id of the Org to fetch config of.
     * @param callback Callback
     */
    private getUserOrgConfig(orgId: string, callback: (orgUserDetails: IOrgMaster) => void) {
        return this.orgMasterModel.getOrgConfigByOrgId(orgId, (error1, result) => {
            if (error1) {
                return;
            }
            if (result && callback) {
                callback(result);
            }
        });
    }
    /**
     *
     * @description Publishes the data to the Salesforce Platform Event.
     * @param orgId Org id
     * @param data Data to be published
     * @param callback callback
     */
    public publish(orgId: string, data: any, callback?: (error, eventResponse) => void) {
        this.getUserOrgConfig(orgId, (userOrgDetails) => {

            const org = nforce.createConnection({
                clientId: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_id,
                clientSecret: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_secret,
                redirectUri: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.redirectUri,
                // redirectUri: 'http://localhost:3000/oauth/_callback',
                apiVersion: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.API_VERSION,  // optional, defaults to current salesforce API version
                environment: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.ENV,  // optional, salesforce 'sandbox' or 'production', production default
                mode: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.MODE, // optional, 'single' or 'multi' user mode, multi default
                grant_type: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.grant_type,
                refresh_token: userOrgDetails.refresh_token,
            });

            this.authenticator.authenticateAndRun(userOrgDetails, (error: any, response: request.Response) => {
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
}
