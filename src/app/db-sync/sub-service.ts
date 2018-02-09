import * as request from 'request';
import * as lib from "cometd";
import { Constants } from '../../config/constants';
import * as cometDNode from 'cometd-nodejs-client';
import { OrgMasterModel, IOrgMaster } from '../org-master/org-master.model';
import { ProjectModel } from '../project/project.model';
import { ProjectController } from '../project/project.controller';
import { buildUpdateStatements, formatProjectDetails, formatTaskDetails, buildInsertStatements } from '../project/project.helper';

export class SubService {
    private sessionId: any;
    private cometd: any;
    private orgMasterModel: OrgMasterModel;
    private projectModel: ProjectModel;
    //     private projectController: ProjectController;
    constructor(orgConfig: IOrgMaster) {
        cometDNode.adapt();
        this.cometd = new lib.CometD(orgConfig.org_id);
        this.orgMasterModel = new OrgMasterModel();
        this.projectModel = new ProjectModel();
        // this.projectController = new ProjectController();
        this.config(orgConfig);
    }

    /**
     * @description Subscribes the event at the salesforce side and performs actions based on the event triggerred.
     */
    public config(orgConfig: IOrgMaster) {
        const that = this;
        this.authenticateAndRun(orgConfig, (error: any, response: request.Response) => {
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
                        if (dataFromServer && dataFromServer.payload) {
                            that.updateDB.call(that, dataFromServer.payload);
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

        let isProjectRequest = true;
        let records = [];
        let data = payload.Data__c;
        const userId = payload.User__c;

        if (typeof payload.Data__c === 'string') {
            data = JSON.parse(data);
        }
        if (data.Projects !== null) {
            records = data.Projects;
            records = records.map((self) => {
                self = formatProjectDetails(self);
                const externalId = self['external_id'];
                self['external_id'] = self['id'];
                self['id'] = payload.Action__c === 'update' ? +externalId : undefined;
                return self;
            });
        } else if (data.ProjectTasks !== null) {
            records = data.ProjectTasks;
            records = records.map((self) => {
                self = formatTaskDetails(self);
                const externalId = self['external_id'];
                self['external_id'] = self['id'];
                self['id'] = payload.Action__c === 'update' ? +externalId : undefined;
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

                this.projectModel.updateProjectsOrTasks(queryConfigArray, isProjectRequest, (error, results) => {
                    console.log(error, results);
                    if (!error) {
                        console.log("Updated to the database from Subscribe (SPE).");
                    }
                });
            } else {
                // Insert here
                // const queryConfig = buildInsertStatements(records, ['_id', 'external_id'], isProjectRequest);
                // // const queryConfigArray = [];
                // // records.forEach((task) => {
                // //     queryConfigArray.push(queryConfig);
                // // });

                // this.projectModel.insertManyStatements(queryConfig, (error, results) => {
                //     console.log(error, results);
                //     if (!error) {
                //         console.log("Inserted to the database from Subscribe (SPE).");
                //     }
                // });
            }
        }
    }
    private authenticateAndRun(orgConfig: IOrgMaster, callback: (error: any, response: request.Response) => void) {
        const serviceUserAuthConfig = {
            grant_type: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.grant_type,
            client_id: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_id,
            client_secret: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_secret,
            refresh_token: orgConfig.refresh_token,
        };
        const requestObj = {
            url: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.url,
            qs: serviceUserAuthConfig,
            method: 'POST',
            json: true,
        };

        console.log('In postRequestOnSalesforce requestObj - ', requestObj);
        return request.post(requestObj, (error, response) => {
            console.log('In postRequestOnSalesforce', error, response || response.body);
            if (callback) {
                callback(error, response);
            }
        });
    }
}
