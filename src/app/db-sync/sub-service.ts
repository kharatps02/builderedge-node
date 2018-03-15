import { IOrgMaster } from './../../core/models/org-master';
import { Authentication } from './../../core/authentication/authentication';
import * as request from 'request';
import * as lib from "cometd";
import { Constants } from '../../config/constants';
import * as cometDNode from 'cometd-nodejs-client';
import { OrgMasterModel } from '../org-master/org-master.model';
import { ProjectModel } from '../project/project.model';
import { ProjectController } from '../project/project.controller';
import { buildUpdateStatements, formatProjectDetails, formatTaskDetails, buildInsertStatements } from '../project/project.helper';
import { PubService } from './pub-service';
import { IOAuthToken } from '../../core/authentication/oauth-model';
import { AppError } from '../../utils/errors';

export class SubService {
    private authenticator: Authentication;
    private sessionId: any;
    private cometd: any;
    private orgMasterModel: OrgMasterModel;
    private projectModel: ProjectModel;
    constructor(orgConfig: IOrgMaster) {
        cometDNode.adapt();
        this.cometd = new lib.CometD(orgConfig.org_id);
        this.orgMasterModel = new OrgMasterModel();
        this.projectModel = new ProjectModel();
        this.authenticator = new Authentication();
        this.config(orgConfig);
    }

    /**
     * config
     * @description Subscribes the event at the salesforce side and performs actions based on the event triggerred.
     * @param orgConfig Org Configuration from the database.
     */
    public config(orgConfig: IOrgMaster) {
        this.authenticator.authenticateAndRun(orgConfig, (error: any, token?: IOAuthToken) => {
            if (error || !token) {
                console.log('Authentication failed', error, token);
                return;
            }
            this.sessionId = token.access_token;
            // Configure the CometD object.
            this.cometd.configure({
                url: orgConfig.event_endpoint_url,
                logLevel: Constants.COMETD.LOG_MODE,
                requestHeaders: { Authorization: 'OAuth ' + this.sessionId },
            });

            // Handshake with the server.
            this.cometd.handshake((h: any) => {
                if (h.successful) {
                    // Subscribe to receive messages from the server.
                    this.cometd.subscribe(Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.EVENT, (m: any) => {
                        const dataFromServer = m.data;
                        console.log('Response Received! :', dataFromServer);
                        if (dataFromServer && dataFromServer.payload && dataFromServer.payload.Action__c) {
                            // Use dataFromServer here to update database.
                            this.updateDB(dataFromServer.payload);
                        }
                    });
                } else {
                    console.log(h);
                }
            });
        });
    }
    /**
     * updateDB
     * @description Updates database from the data received from salesforce.
     * @param payload payload to update Database.
     */
    private async updateDB(payload: any) {
        const temp = true;
        let isProjectRequest = true;
        let records: any[] = [];
        let data = payload.Data__c;
        const orgId = payload.OrgId__c;
        const internalOrg = await this.orgMasterModel.getOrgConfigByOrgIdAsync(payload.OrgId__c);

        if (typeof payload.Data__c === 'string') {
            data = JSON.parse(data);
        }
        this.projectModel.getProjectExternalIdMap((projectMap) => {

            if (projectMap && projectMap.length > 0) {
                if (data.Projects !== null) {
                    records = data.Projects;
                    records = records.map((self) => {
                        // self = formatProjectDetails(self);
                        if (payload.Action__c === 'update') {
                            const externalId = self['External_Id__c'];
                            self['External_Id__c'] = self['Id'];
                            self['Id'] = externalId;
                        }
                        return self;
                    });
                } else if (data.ProjectTasks !== null) {
                    records = data.ProjectTasks;
                    records = records.map((self) => {
                        if (payload.Action__c === 'update') {
                            const externalId = self['External_Id__c'];
                            self['External_Id__c'] = self['Id'];
                            self['Id'] = externalId;
                        }
                        const IdMap = projectMap.find((p) => p.External_Id__c === self['Project__c']);
                        if (!IdMap) {
                            throw new AppError(`Couldn't find project mapping in the database`);
                        }
                        self['Project__c'] = IdMap.Id;
                        return self;
                    });
                    isProjectRequest = false;
                }

                if (records && records.length > 0) {
                    if (payload.Action__c === 'update') {
                        const queryConfigArray: any[] = [];
                        records.forEach((task) => {
                            const queryConfig = buildUpdateStatements(task, isProjectRequest);
                            queryConfigArray.push(queryConfig);
                        });

                        this.projectModel.updateProjectsAndTasksAsync(queryConfigArray).then((result) => {
                            console.log("Updated to the database from Subscribe (SPE).");
                        }).catch((err) => {
                            console.log("Problem updating the database from SPE.", err);
                        });
                    } else {
                        // Insert here
                        const queryConfig = buildInsertStatements(records, ['"Id"', '"External_Id__c"'], isProjectRequest, internalOrg!.vanity_id);

                        this.projectModel.insertManyStatements(queryConfig, (error, results) => {
                            console.log(error, results);
                            if (!error) {
                                console.log("Inserted to the database from Subscribe (SPE).");
                                if (results.rows && results.rows.length > 0) {
                                    const pubservice = new PubService();
                                    results.rows.forEach((r: any) => {
                                        const id = r['Id'];
                                        r['Id'] = r.External_Id__c;
                                        r['External_Id__c'] = id;
                                    });
                                    let pubData = null;
                                    if (isProjectRequest) {
                                        pubData = JSON.stringify({ Projects: results.rows });
                                    } else {
                                        pubData = JSON.stringify({ ProjectTasks: results.rows });
                                    }
                                    pubservice.publishWithOrgId(orgId, pubData);
                                    console.log("Published External ids to salesforce");
                                }
                            }
                        });
                    }
                }
            }
        });
    }
}
