import { OrgMasterModel } from './../org-master/org-master.model';
import { IProjectDetails } from './project.model';
import * as jsforce from 'jsforce';
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
     * Gets project ids of the projects that user is authorized to access.
     * Accepts project ids to validate user access.
     * 
     * @param receviedProjectIds array of project ids
     * @param baseUrl base url/instance url
     * @param accessToken access token. Required if
     * @param refreshToken refresh token
     */
    public async getAuthorizedProjectIds(receviedProjectIds: string[] | string, baseUrl: string, accessToken?: string, refreshToken?: string): Promise<string[]> {
        if (!(accessToken || refreshToken)) {
            throw Error('User could not be authentication. Please pass authentication information.')
        }
        const conn = new jsforce.Connection({
            oauth2: {
                redirectUri: Constants.OAUTH.redirectUri,
                clientId: Constants.OAUTH.client_id,
                clientSecret: Constants.OAUTH.client_secret,
            },
            refreshToken,
            accessToken,
            instanceUrl: baseUrl
        });
        if (receviedProjectIds && (Array.isArray(receviedProjectIds) || typeof receviedProjectIds === 'string')) {
            if (Array.isArray(receviedProjectIds)) {
                const q = receviedProjectIds.join(',');
                const options = { qs: { id: q } };
                return await conn.requestGet<string[]>(`${Constants.SF_REST.GET_AUTHORIZED_PROJECT_IDS}?id=${q}`);
            } else {
                const q = receviedProjectIds;
                const options = { qs: { id: q } };
                return await conn.requestGet<string[]>(`${Constants.SF_REST.GET_AUTHORIZED_PROJECT_IDS}?id=${q}`);
            }
        } else {
            return await conn.requestGet<string[]>(Constants.SF_REST.GET_AUTHORIZED_PROJECT_IDS);
        }
    }

    /**
     * getAllProjectsAndTasks
     * @param accessToken 
     * @param vanityKey 
     * @param orgId 
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
            } else {
                throw Error('Please provide vanity id or org id');
            }
            let sfResponsePerRequest: ISFResponse<IProjectDetails> = new SFResponse<
                IProjectDetails
                >();
            const url =
                sfResponsePerRequest.nextRecordsUrl ||
                config.api_base_url + Constants.SYNC_QUERIES.ALL;
            sfResponsePerRequest = await this.sfQueryService.getDataAppendRest<IProjectDetails>(
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
                        element.Project_Tasks__r = await this.sfQueryService.getDataAppendRest(
                            config.api_base_url + element.Project_Tasks__r.nextRecordsUrl!,
                            accessToken,
                            element.Project_Tasks__r.records,
                            config.api_base_url
                        );
                    }
                }
                if (!sfResponsePerRequest.done) {
                    sfResponsePerRequest = await this.sfQueryService.getDataAppendRest<IProjectDetails>(
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
