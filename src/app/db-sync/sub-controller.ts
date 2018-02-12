import { OrgMasterModel, IOrgMaster } from '../org-master/org-master.model';
import { SubService } from './sub-service';

export class SubController {
    private subscribers: Map<string, SubService>;
    private orgMasterModel: OrgMasterModel;

    constructor() {
        this.subscribers = new Map();
        this.orgMasterModel = new OrgMasterModel();
    }

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

    public getInstance(id: string) {
        if (this.subscribers[id]) {
            return this.subscribers[id];
        }
    }
}
