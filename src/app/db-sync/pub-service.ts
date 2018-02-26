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
     *
     * @description Publishes the data to the Salesforce Platform Event.
     * @param orgId Org id
     * @param data Data to be published
     * @param callback callback
     */
    public async publish(orgId: string, data: any, callback?: (error: Error, eventResponse: any) => void) {
        const conn = await this.sfQueryService.getConnectionAsIntegUser(orgId);
        // event to check when the access token is refreshed.
        // We can save it if we want any per user logic.
        conn.on("refresh", (token: string, response: any) => {
            console.log(token);
            this.orgMasterModel.updateAccessToken(orgId, token);
        });
        //// Manually refreshes the access token using refresh token
        // conn.oauth2.refreshToken('5Aep8613hy0tHCYdhwfV72zcrObyt1SiQpoPS6OQCtnA8L_SxzVeSMEA6VgyW4nVKw.t6iwjPnxPRxLHAU3HEO1',
        //     (err: any, results: any) => {
        //         console.log(err, results);
        //     });

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
    }
}
