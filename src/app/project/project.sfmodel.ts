import { OrgMasterModel } from './../org-master/org-master.model';
import { IProjectDetails } from './project.model';
import { ISFResponse, SFResponse } from './../db-sync/sf-response';
import { Constants } from '../../config/constants';
import { SFQueryService } from '../../core/sf-query.service';
import { IOrgMaster } from '../../core/models/org-master';
export class ProjectSfModel {
    private sfQueryService: SFQueryService;
    private orgMasterModel: OrgMasterModel;

    constructor() {
        this.orgMasterModel = new OrgMasterModel();
        this.sfQueryService = new SFQueryService();
    }
    /**
     * getAllProjectsAndTasks
     */
    public async getAllProjectsAndTasks(
        accessToken: string,
        vanityKey?: string,
        orgId?: string
    ): Promise<ISFResponse<IProjectDetails>> {
        try {
            let config: IOrgMaster;
            if (vanityKey) {
                config = await this.orgMasterModel.getOrgConfigByVanityId(
                    vanityKey
                );
            } else if (orgId) {
                config = await this.orgMasterModel.getOrgConfigByOrgIdAsync(
                    orgId
                );
            }
            let sfResponsePerRequest: ISFResponse<IProjectDetails> = new SFResponse<
                IProjectDetails
                >();
            const url =
                sfResponsePerRequest.nextRecordsUrl ||
                config.api_base_url + Constants.SYNC_QUERIES.ALL;
            sfResponsePerRequest = await this.sfQueryService.getData<IProjectDetails>(
                url,
                accessToken,
                undefined,
                config.api_base_url
            );
            const loaded = (p: ISFResponse<IProjectDetails>) => {
                return p.done && p.records && p.records.map(m => m.Project_Tasks__r.done).reduce((b) => b);
            };
            do {
                for (const element of sfResponsePerRequest.records) {
                    // TODO: Fix:  StatusCodeError: 400 - "[{\"message\":\"invalid query locator\",\"errorCode\":\"INVALID_QUERY_LOCATOR\"}]"
                    while (!element.Project_Tasks__r.done) {
                        element.Project_Tasks__r = await this.sfQueryService.getData(
                            config.api_base_url + element.Project_Tasks__r.nextRecordsUrl!,
                            accessToken,
                            element.Project_Tasks__r.records,
                            config.api_base_url
                        );
                    }
                }
                if (!sfResponsePerRequest.done) {
                    sfResponsePerRequest = await this.sfQueryService.getData<IProjectDetails>(
                        config.api_base_url + sfResponsePerRequest.nextRecordsUrl!,
                        accessToken,
                        sfResponsePerRequest.records,
                        config.api_base_url
                    );
                }
            } while (!loaded(sfResponsePerRequest));
            return sfResponsePerRequest;
        } catch (error) {
            throw error;
        }
    }
}
