import * as express from "express";
import * as request from 'request';
import * as async from 'async';

import { ProjectModel, IProjectRequest, IProjectDetails, ITaskDetails } from './project.model';
import { OrgMasterModel, IOrgMaster } from '../org-master/org-master.model';
import { formatProjectAndTaskDetails, buildInsertStatements, buildUpdateStatements, swapSfId } from './project.helper';
import { Constants } from '../../config/constants';
import { PubService } from "../db-sync/pub-service";
import { forEach } from "async";
import { Enums } from "../../config/enums";

export class ProjectController {
    private projectModel: ProjectModel;
    private orgMasterModel: OrgMasterModel;
    constructor() {
        this.projectModel = new ProjectModel();
        this.orgMasterModel = new OrgMasterModel();
    }

    //#region POC1
    public getAllDetails(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            if (req.body.session_id && req.body.org_id) {
                // Get project details from salesforce api
                const requestHeader = {
                    headers: {
                        'Authorization': 'Bearer ' + req.body.session_id,
                        'Content-Type': 'application/json',
                    },
                };
                const orgId = req.body.org_id;
                this.orgMasterModel.getOrgConfigByOrgId(orgId, (error, config: IOrgMaster) => {
                    if (!error && config) {
                        request(config.api_base_url + '/services/apexrest/ProductService', requestHeader, (error1, response) => {
                            if (!error1) {
                                if (response.statusCode === 401) {
                                    res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: response.body[0].message });
                                } else {
                                    if (response.body && response.body.length > 0) {
                                        let projectArray: IProjectDetails[] = response.body;
                                        if (typeof response.body === 'string') {
                                            projectArray = JSON.parse(response.body);
                                        }
                                        const formatedProjects = formatProjectAndTaskDetails(projectArray);
                                        formatedProjects.map((self) => {
                                            self['OrgMaster_Ref_Id'] = config.vanity_id;
                                        });
                                        this.syncSalesforceUserDetails(
                                            { org_id: req.body.session_id, session_id: req.body.session_id }, formatedProjects);
                                        res.send({ status: Enums.RESPONSE_STATUS.SUCCESS, message: '', projects: formatedProjects });
                                    }
                                }
                            } else {
                                res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: error1 });
                            }
                        });
                    } else {
                        res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: error });
                    }
                });
            } else {
                res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.INVALID_REQUEST_PARAMS });
            }
        } catch (e) {
            console.log(e);
            res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.SOMETHING_WENT_WRONG });
        }
    }

    /**
     * @description Function to updates Projects or Tasks
     * @param req
     * @param res
     * @param isProjectRequest
     */
    public updateProjectOrTask(req: express.Request, res: express.Response) {
        try {
            const sessionId = req.body.session_id;
            const orgId = req.body.org_id;
            if (sessionId && orgId) {
                const asyncTasks = [];
                const data = req.body.Data__c;
                console.log("data received from SF", data);
                const queryConfigArray = [];

                if (data.Projects && data.Projects.length > 0) {
                    data.Projects.forEach((project) => {
                        const queryConfig = buildUpdateStatements(project, true);
                        queryConfigArray.push(queryConfig);
                    });
                }

                if (data.ProjectTasks && data.ProjectTasks.length > 0) {
                    data.ProjectTasks.forEach((task) => {
                        const queryConfig = buildUpdateStatements(task, false);
                        queryConfigArray.push(queryConfig);
                    });
                }

                this.projectModel.updateProjectsOrTasks(queryConfigArray, (error, results) => {
                    console.log(error, results);
                    if (!error) {
                        res.send({ status: Enums.RESPONSE_STATUS.SUCCESS, message: Constants.MESSAGES.UPDATED });

                        // Update salesforce data
                        if (results && results.length > 0) {
                            // that.updateProjectsOrTasksOnSalesforce.call(that, { org_id: orgId, session_id: sessionId }, data);
                            if (sessionId) {

                                if (data.Projects) {
                                    data.Projects.forEach(swapSfId);
                                }
                                if (data.ProjectTasks) {
                                    data.ProjectTasks.forEach(swapSfId);
                                }

                                this.postRequestOnSalesforce({ org_id: orgId, session_id: sessionId }, { Data__c: JSON.stringify(data) });
                            }
                        }
                    } else {
                        res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: error });
                    }
                });
            } else {
                res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.INVALID_REQUEST_PARAMS });
            }
        } catch (error) {
            res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.SOMETHING_WENT_WRONG });
        }
    }

    // public updateProjectsOrTasksOnSalesforce(params: { org_id: string, session_id: string }, data: { ProjectTasks: IProjectDetails[], Projects: IProjectDetails[] }) {
    //     const requestData = { ProjectTasks: [], Projects: [] };
    //     // if (data.Projects && data.Projects.length > 0) {
    //     //     data.Projects.forEach((row) => {
    //     //         requestData.Projects.push(formatSalesForceObject(row));
    //     //     });
    //     // }
    //     // if (data.ProjectTasks && data.ProjectTasks.length > 0) {
    //     //     data.ProjectTasks.forEach((row) => {
    //     //         requestData.ProjectTasks.push(formatSalesForceObject(row));
    //     //     });
    //     // }

    //     if (params.session_id) {
    //         this.postRequestOnSalesforce(params, { Data__c: JSON.stringify(requestData) });
    //     }
    // }

    /**
     * @description Sent post request on salesforce endpoints
     * @param params
     * @param data
     * @param callback
     */
    public postRequestOnSalesforce(params: { org_id: string, session_id: string }, data, callback?: (error: Error, results: any) => void) {
        this.orgMasterModel.getOrgConfigByOrgId(params.org_id, (error, config: IOrgMaster) => {
            if (!error && config) {
                const requestObj = {
                    url: config.api_base_url + '/services/data/v40.0/sobjects/ProjectTaskService__e',
                    headers: {
                        'Authorization': 'Bearer ' + params.session_id,
                        'Content-Type': 'application/json',
                    },
                    json: true,
                    body: data,
                };
                console.log('In postRequestOnSalesforce requestObj - ', requestObj);

                request.post(requestObj, (error1, response) => {
                    console.log('In postRequestOnSalesforce', error1, response.body);
                    if (callback) {
                        callback(error1, response);
                    }
                });
            }
        });
    }

    /**
     * @description Insert all project and tasks into postgres database and
     * call salesforce endpoints to updates salesforce record external_id__c with postgres record id
     * @param params
     * @param salesforceResponseArray
     */
    public syncSalesforceUserDetails(params: { org_id: string, session_id: string }, salesforceResponseArray) {
        const that = this;
        try {
            const projectRecords = JSON.parse(JSON.stringify(salesforceResponseArray));

            // Filter newly added projects, those records which hasn't external_id__c
            // projectRecords = projectRecords.filter((self) => {
            //     if (!self['External_Id__c']) {
            //         return true;
            //     }
            // });

            if (projectRecords && projectRecords.length > 0) {
                const queryConfig = buildInsertStatements(projectRecords, ['"Id"', '"External_Id__c"'], true);
                console.log("query statement", queryConfig);
                // Insert Projects records
                that.projectModel.insertManyStatements(queryConfig, (error, projectResult) => {
                    if (!error) {
                        // console.log('In execMultipleStatment projectResult>>', projectResult);
                        const salesforceRequestObj = { ProjectTasks: [], Projects: [] };
                        const pksExternalPksMap = {};
                        const taskRecords = [];

                        // Prepared  object to update postgres id into salesforce databse
                        projectResult.rows.forEach((row) => {
                            pksExternalPksMap[row.External_Id__c] = row.Id;
                            salesforceRequestObj.Projects.push({ Id: row.External_Id__c, External_Id__c: row.Id });
                        });

                        salesforceResponseArray.forEach((projectRecord) => {
                            const projectId = pksExternalPksMap[projectRecord['Id']] || projectRecord['External_Id__c'];
                            if (projectRecord.series && projectRecord.series.length > 0 && projectId) {
                                projectRecord.series.forEach((taskRecord) => {
                                    taskRecord['Project__c'] = projectId;
                                    taskRecords.push(taskRecord);
                                });
                            }
                        });

                        if (taskRecords && taskRecords.length) {
                            const tasksQueryConfig = buildInsertStatements(taskRecords, ['"Id"', '"External_Id__c"'], false);
                            that.projectModel.insertManyStatements(tasksQueryConfig, (error1, taskResult) => {
                                if (!error1) {
                                    // console.log('In execMultipleStatment task taskResult>>', taskResult);

                                    // Prepared  object to update postgres id into salesforce databse
                                    taskResult.rows.forEach((row) => {
                                        salesforceRequestObj.ProjectTasks.push({ Id: row.External_Id__c, External_Id__c: row.Id });
                                    });
                                } else {
                                    console.log('In execMultipleStatment task error>>', error1);
                                }

                                // call salesforce endpoints to update postgres id into salesforce databse
                                if (salesforceRequestObj.Projects && salesforceRequestObj.Projects.length > 0 ||
                                    salesforceRequestObj.ProjectTasks && salesforceRequestObj.ProjectTasks.length > 0) {
                                    const requestData = {
                                        Data__c: JSON.stringify(salesforceRequestObj),
                                    };
                                    if (params.session_id) {
                                        that.postRequestOnSalesforce(params, requestData);
                                    }
                                }
                            });
                        } else {
                            // call salesforce endpoints to update postgres id into salesforce databse
                            if (salesforceRequestObj.Projects && salesforceRequestObj.Projects.length > 0) {
                                const requestData = {
                                    Data__c: JSON.stringify(salesforceRequestObj),
                                };
                                if (params.session_id) {
                                    that.postRequestOnSalesforce(params, requestData);
                                }
                            }
                        }
                    } else {
                        console.log('In execMultipleStatment error>>', error);
                    }
                });
            } else {
                console.log('Nothing to sync..');
            }
        } catch (e) {
            console.log(e);
        }

    }
    //#endregion
    // #region POC2 Publish
    public updateProjectPOC2(req: express.Request, res: express.Response, next: express.NextFunction) {
        this.updateProjectOrTaskPOC2(req, res, true);
    }

    public updateTaskPOC2(req: express.Request, res: express.Response, next: express.NextFunction) {
        this.updateProjectOrTaskPOC2(req, res, false);
    }

    public updateProjectOrTaskPOC2(req: express.Request, res: express.Response, isProjectRequest: boolean) {
        try {
            const orgId = req.body.org_id;
            if (orgId) {
                const asyncTasks = [];
                const records = req.body.records;
                const queryConfigArray = [];
                records.forEach((task) => {
                    const queryConfig = buildUpdateStatements(task, isProjectRequest);
                    queryConfigArray.push(queryConfig);
                });
                this.projectModel.updateProjectsOrTasks(queryConfigArray, (error, results) => {
                    console.log(error, results);
                    if (!error) {

                        // Update salesforce data
                        if (results && results.length > 0) {
                            this.preparedRequestAndUpdateSalesforceDBPOC2(orgId, records, isProjectRequest, (err, resp) => {
                                res.send({ status: Enums.RESPONSE_STATUS.SUCCESS, message: Constants.MESSAGES.UPDATED, response: resp, error: err });
                            });
                        } else {
                            res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: 'No response from the database' });
                        }
                    } else {
                        res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: error });
                    }
                });
            } else {
                res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.INVALID_REQUEST_PARAMS });
            }
        } catch (error) {
            res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.SOMETHING_WENT_WRONG });
        }
    }

    public preparedRequestAndUpdateSalesforceDBPOC2(orgId: string, results: any[], isProjectRequest: boolean, callback: (error, eventResponse) => void) {
        const data = { ProjectTasks: [], Projects: [] };
        if (isProjectRequest) {
            data.Projects = results;
            if (data.Projects) {
                data.Projects.forEach(swapSfId);
            }
        } else {
            data.ProjectTasks = results;
            if (data.ProjectTasks) {
                data.ProjectTasks.forEach(swapSfId);
            }
        }
        // const requestData = {
        //     Data__c: JSON.stringify(data),
        // };

        if (orgId) {
            const pubService = new PubService();
            pubService.publish(orgId, JSON.stringify(data), (error, eventResponse) => {
                console.log("Updat to salesforce result: ", eventResponse);
                if (callback) {
                    callback(error, eventResponse);
                }
            });
        }
    }
    // #endregion
}
