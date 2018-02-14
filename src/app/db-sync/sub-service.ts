import { Authentication } from './../../core/authentication/authentication';
import * as request from 'request';
import * as lib from "cometd";
import { Constants } from '../../config/constants';
import * as cometDNode from 'cometd-nodejs-client';
import { OrgMasterModel, IOrgMaster } from '../org-master/org-master.model';
import { ProjectModel } from '../project/project.model';
import { ProjectController } from '../project/project.controller';
import { buildUpdateStatements, formatProjectDetails, formatTaskDetails, buildInsertStatements } from '../project/project.helper';
import { PubService } from './pub-service';

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
     * @description Subscribes the event at the salesforce side and performs actions based on the event triggerred.
     */
    public config(orgConfig: IOrgMaster) {
        this.authenticator.authenticateAndRun(orgConfig, (error: any, response: request.Response) => {
            if (error || !response) {
                console.log('Authentication failed', error, response);
                return;
            }
            this.sessionId = response.toJSON().body.access_token;
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
                            this.updateDB(dataFromServer.payload);
                        }

                        // Use dataFromServer here.
                    });
                } else {
                    console.log(h);
                }
            });
        });
    }

    private updateDB(payload) {
        const temp = true;
        let isProjectRequest = true;
        let records = [];
        let data = payload.Data__c;
        const orgId = payload.OrgId__c;

        if (typeof payload.Data__c === 'string') {
            data = JSON.parse(data);
        }
        this.projectModel.getProjectExternalIdMap((projectMap) => {
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
                    // self = formatTaskDetails(self);
                    if (payload.Action__c === 'update') {
                        const externalId = self['External_Id__c'];
                        self['External_Id__c'] = self['Id'];
                        self['Id'] = externalId;
                    }
                    self['Project__c'] = projectMap.find((p) => p.External_Id__c === self['Project__c']).Id;
                    return self;
                });
                isProjectRequest = false;
            }

            if (records && records.length > 0) {
                if (payload.Action__c === 'update') {
                    const queryConfigArray = [];
                    records.forEach((task) => {
                        const queryConfig = buildUpdateStatements(task, isProjectRequest);
                        queryConfigArray.push(queryConfig);
                    });

                    this.projectModel.updateProjectsOrTasks(queryConfigArray, (error, results) => {
                        console.log(error, results);
                        if (!error) {
                            console.log("Updated to the database from Subscribe (SPE).");
                        }
                    });
                } else {
                    // Insert here
                    const queryConfig = buildInsertStatements(records, ['"Id"', '"External_Id__c"'], isProjectRequest);

                    this.projectModel.insertManyStatements(queryConfig, (error, results) => {
                        console.log(error, results);
                        if (!error) {
                            console.log("Inserted to the database from Subscribe (SPE).");
                            if (results.rows && results.rows.length > 0) {
                                const pubservice = new PubService();
                                results.rows.forEach((r) => {
                                    r['Id'] = r.External_Id__c;
                                    r['External_Id__c'] = r.Id;
                                    delete r.Id;
                                    delete r.External_Id__c;
                                });
                                let pubData = null;
                                if (isProjectRequest) {
                                    pubData = JSON.stringify({ Projects: results.rows });
                                } else {
                                    pubData = JSON.stringify({ ProjectTasks: results.rows });
                                }
                                pubservice.publish(orgId, pubData);
                                console.log("Published External ids to salesforce");
                            }
                        }
                    });
                }
            }
        });
    }
}
