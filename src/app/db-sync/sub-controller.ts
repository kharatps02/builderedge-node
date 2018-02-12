import { OrgMasterModel, IOrgMaster } from '../org-master/org-master.model';
import { SubService } from './sub-service';
/**
 * @description It gets all orgs and its integration user OAuth Token to be used for the subscription.
 */
export class SubController {
    private subscribers: Map<string, SubService>;
    private orgMasterModel: OrgMasterModel;

    constructor() {
        this.subscribers = new Map();
        this.orgMasterModel = new OrgMasterModel();
    }
    /**
     * @description Initializes the SubService instances for all the registered orgs.
     */
    public init() {
        this.orgMasterModel.getAllOrgDetails((error1, results) => {
            if (error1) {
                return;
            }
            results.forEach((org) => {
                this.subscribers[org.org_id] = new SubService(org);
            });
        });
    }
    /**
     * @description Retrives the specific instance of SubService when needed.
     * @param id OrgId
     */
    public getInstance(id: string) {
        if (this.subscribers[id]) {
            return this.subscribers[id];
        }
    }
}
