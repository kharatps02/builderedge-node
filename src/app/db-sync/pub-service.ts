import * as jsforce from 'jsforce';
import { OrgMasterModel } from './../org-master/org-master.model';
import { Constants } from "../../config/constants";
import { SFQueryService } from '../../core/sf-query.service';

/**
 * @description Publish service can be used to publish data to salesforce.
 */
export class PubService {
    private sfQueryService: SFQueryService;
    private orgMasterModel: OrgMasterModel;

    constructor() {
        this.orgMasterModel = new OrgMasterModel();
        this.sfQueryService = new SFQueryService();
    }

    /**
     * Publishes data to salesforce Platform event using vanity Id
     * @param vanityId Vanity Id of the Org
     * @param data Data to be published. A stringified JSON.
     * @param callback callback function.
     */
    public async publishWithVanityId(vanityId: string, data: string, callback?: (error: Error, eventResponse: any) => void) {
        const conn = await this.sfQueryService.getConnectionAsIntegUser(undefined, vanityId);
        const config = await this.orgMasterModel.getOrgConfigByVanityId(vanityId);
        return this.publish(conn, config.org_id, data, callback);
    }

    /**
     * Publishes data to salesforce Platform event using Org Id
     * @param orgId Org Id of the Org
     * @param data Data to be published. A stringified JSON.
     * @param callback callback function.
     */
    public async publishWithOrgId(orgId: string, data: string, accessToken?: string, callback?: (error: Error, eventResponse: any) => void) {
        let conn: jsforce.Connection;
        if (accessToken) {
            const orgConfig = await this.orgMasterModel.getOrgConfigByOrgIdAsync(orgId);
            conn = await this.sfQueryService.getConnectionWithToken(orgConfig.api_base_url, accessToken);
        } else {
            conn = await this.sfQueryService.getConnectionAsIntegUser(orgId);
        }
        return this.publish(conn, orgId, data, callback);
    }
    /**
     *
     * @description Publishes the data to the Salesforce Platform Event.
     * @param orgId Org id
     * @param data Data to be published. It should be stringified JSON.
     * @param callback callback
     */
    private async publish(conn: jsforce.Connection, orgId: string, data: string, callback?: (error: Error, eventResponse: any) => void) {
        // event to check when the access token is refreshed.
        // We can save it if we want any per user logic.
        conn.on("refresh", (token: string, response: any) => {
            console.log(token);
            this.orgMasterModel.updateAccessToken(orgId, token);
        });
        const event = conn.sobject(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT_NAME);
        const result = await event.create({ Data__c: data }, (err, ret) => {
            if (err) {
                console.error(err);
            } else {
                console.log(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT_NAME, " published");
            }
            if (callback) {
                callback(err, ret);
            }
        });
        return result;
    }
}
