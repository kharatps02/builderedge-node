import * as express from "express";
import * as request from 'request';
import * as async from 'async';

import { ProjectModel, IProjectRequest, IProjectDetails, ITaskDetails } from './project.model';
import { OrgMasterModel, IOrgMaster } from '../org-master/org-master.model';
import { formatProjectDetails, buildInsertStatements, formatSalesForceObject } from './project.helper';
import { Constants } from '../../config/constants';

export class ProjectController {
    private projectModel: ProjectModel;
    private orgMasterModel: OrgMasterModel;
    constructor() {
        this.projectModel = new ProjectModel();
        this.orgMasterModel = new OrgMasterModel();
    }

    public create(req: express.Request, res: express.Response, next: express.NextFunction) {
        let reqParams: IProjectRequest;
        try {
            reqParams = {
                name: req.body.name,
                start_date: req.body.start_date,
                end_date: req.body.end_date,
                completion_per: req.body.completion_per,
                created_by: req.body.created_by,
                updated_by: req.body.created_by,
            };

            this.projectModel.create(reqParams, (error, response) => {
                if (!error) {
                    res.send({ status: Constants.RESPONSE_STATUS.SUCCESS, message: Constants.MESSAGES.SAVED, results: response });
                } else {
                    res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: error });
                }
            });
        } catch (e) {
            res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.SOMETHING_WENT_WRONG });
        }
    }

    public getalldetails(req: express.Request, res: express.Response, next: express.NextFunction) {
        const that = this;
        try {
            if (req.body.session_id && req.body.user_id) {
                // Get project details from salesforce api
                const requestHeader = {
                    headers: {
                        'Authorization': 'Bearer ' + req.body.session_id,
                        'Content-Type': 'application/json',
                    },
                };
                const user_id = req.body.user_id;
                this.orgMasterModel.getOrgConfigByUserId(user_id, (error, config: IOrgMaster) => {
                    if (!error) {
                        request(config.api_base_url + '/services/apexrest/ProductSerivce', requestHeader, (error1, response) => {
                            if (!error1) {
                                if (response.statusCode === 401) {
                                    res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: response.body[0].message });
                                } else {
                                    if (response.body && response.body.length > 0) {
                                        let projectArray: IProjectDetails[] = response.body;
                                        if (typeof response.body === 'string') {
                                            projectArray = JSON.parse(response.body);
                                        }
                                        const formatedProjects = formatProjectDetails(projectArray);

                                        that.syncSalesforceUserDetails.call(that, req.body.session_id, formatedProjects);
                                        res.send({ status: Constants.RESPONSE_STATUS.SUCCESS, message: '', projects: formatedProjects });
                                    }
                                }
                            } else {
                                res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: error });
                            }
                        });
                    }
                });
            } else {
                res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.INVALID_REQUEST_PARAMS });
            }
        } catch (e) {
            console.log(e);
            res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.SOMETHING_WENT_WRONG });
        }
    }

    public updateProject(req: express.Request, res: express.Response, next: express.NextFunction) {
        this.updateProjectOrTask(req, res, true);
    }

    public updateTask(req: express.Request, res: express.Response, next: express.NextFunction) {
        this.updateProjectOrTask(req, res, false);
    }

    public updateProjectOrTask(req: express.Request, res: express.Response, isProjectRequest: boolean) {
        try {
            const sessionId = req.body.session_id;
            const userId = req.body.user_id;
            if (sessionId && userId) {
                const that = this;
                const asyncTasks = [];
                const records = req.body.records;

                that.projectModel.updateProjectsOrTasks(records, isProjectRequest, (error, results) => {
                    console.log(error, results);
                    if (!error) {
                        res.send({ status: Constants.RESPONSE_STATUS.SUCCESS, message: Constants.MESSAGES.UPDATED });

                        // Update salesforce data
                        if (results && results.length > 0) {
                            that.preparedRequestAndUpdateSalesforceDB.call(that, { user_id: userId, session_id: sessionId }, records, isProjectRequest);
                        }
                    } else {
                        res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: error });
                    }
                });
            } else {
                res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.INVALID_REQUEST_PARAMS });
            }
        } catch (error) {
            res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.SOMETHING_WENT_WRONG });
        }
    }

    public preparedRequestAndUpdateSalesforceDB(params: { user_id: string, session_id: string }, results: any[], isProjectRequest: boolean) {
        const data = { ProjectTasks: [], Projects: [] };
        if (isProjectRequest) {
            results.forEach((row) => {
                data.Projects.push(formatSalesForceObject(row));
            });
        } else {
            results.forEach((row) => {
                data.ProjectTasks.push(formatSalesForceObject(row));
            });
        }
        const requestData = {
            Data__c: JSON.stringify(data),
        };
        if (params.session_id) {
            this.postRequestOnSalesforce(params, requestData);
        }
    }

    // Following function sent post request on salesforce endpoints
    public postRequestOnSalesforce(params: { user_id: string, session_id: string }, data, callback?: (error: Error, results: any) => void) {
        this.orgMasterModel.getOrgConfigByUserId(params.user_id, (error, config: IOrgMaster) => {
            if (!error) {
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

    // Following function  insert all project and tasks into postgres database and
    //  call salesforce endpoints to updates salesforce record external_id with postgres record id
    public syncSalesforceUserDetails(params: { user_id: string, session_id: string }, salesforceResponseArray) {
        const that = this;
        try {
            let projectRecords = JSON.parse(JSON.stringify(salesforceResponseArray));

            // Filter newly added projects, those records which hasn't external_id
            projectRecords = projectRecords.filter((self) => {
                if (!self['external_id']) {
                    return true;
                }
            });

            if (projectRecords && projectRecords.length > 0) {
                const queryConfig = buildInsertStatements(projectRecords, ['_id', 'external_id'], true);
                // Insert Projects records
                that.projectModel.insertManyStatements(queryConfig, (error, projectResult) => {
                    if (!error) {
                        // console.log('In execMultipleStatment projectResult>>', projectResult);
                        const salesforceRequestObj = { ProjectTasks: [], Projects: [] };
                        const pksExternalPksMap = {};
                        const taskRecords = [];

                        // Prepared  object to update postgres id into salesforce databse
                        projectResult.rows.forEach((row) => {
                            pksExternalPksMap[row.external_id] = row._id;
                            salesforceRequestObj.Projects.push({ Id: row.external_id, External_Id__c: row._id });
                        });

                        salesforceResponseArray.forEach((projectRecord) => {
                            const projectId = pksExternalPksMap[projectRecord['id']] || projectRecord['external_id'];
                            if (projectRecord.series && projectRecord.series.length > 0 && projectId) {
                                projectRecord.series.forEach((taskRecord) => {
                                    taskRecord['project_ref_id'] = projectId;
                                    taskRecords.push(taskRecord);
                                });
                            }
                        });

                        if (taskRecords && taskRecords.length) {
                            const tasksQueryConfig = buildInsertStatements(taskRecords, ['_id', 'external_id'], false);
                            that.projectModel.insertManyStatements(tasksQueryConfig, (error1, taskResult) => {
                                if (!error1) {
                                    // console.log('In execMultipleStatment task taskResult>>', taskResult);

                                    // Prepared  object to update postgres id into salesforce databse
                                    taskResult.rows.forEach((row) => {
                                        salesforceRequestObj.ProjectTasks.push({ Id: row.external_id, External_Id__c: row._id });
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
}
