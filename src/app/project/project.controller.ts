import * as express from "express";
import * as request from 'request';

import { ProjectModel, IProjectRequest, IProjectDetails, ITaskDetails } from './project.model';
import { formatProjectDetails, buildProjectStatement, buildProjectTasksStatement, formatSalesForceObject } from './project.helper';
import { Constants } from '../../config/constants';
import { error } from "util";

export class ProjectController {
    private projectModel: ProjectModel;
    constructor() {
        this.projectModel = new ProjectModel();
    }

    create(req: express.Request, res: express.Response, next: express.NextFunction) {

        console.log(req.body)
        let reqParams: IProjectRequest;
        reqParams = {
            name: req.body.name,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            completion_per: req.body.completion_per,
            created_by: req.body.created_by,
            updated_by: req.body.created_by,
        };

        this.projectModel.create(reqParams, (erro, result) => {

        });

    }

    getalldetails(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            console.log(req.body);
            if (req.body.session_id) {
                let reqParams: IProjectRequest = {
                    name: req.body.name,
                    start_date: req.body.start_date,
                    end_date: req.body.end_date,
                    completion_per: req.body.completion_per,
                    created_by: req.body.created_by,
                    updated_by: req.body.created_by,
                };
                let requestHeader = {
                    headers: {
                        'Authorization' : 'Bearer ' + req.body.session_id,
                        'Content-Type': 'application/json'
                    }
                };
                let that = this;
                // Get project details from salesforce 
                request(Constants.API_END_POINTS.GET_PROJECT_AND_TASK_DETAILS, requestHeader, (error, response) => {

                    if (!error) {
                        if (response.statusCode === 401) {
                            res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: '401', results: response.body[0].message })
                        } else {
                            if (response.body && response.body.length > 0) {
                                let projectArray: Array<IProjectDetails> = response.body;
                                if (typeof response.body === 'string') {
                                    projectArray = JSON.parse(response.body);
                                }
                                let projects = formatProjectDetails(projectArray);
                                that.syncUserDetails.call(that, req.body.session_id, projects);
                                res.send({ status: Constants.RESPONSE_STATUS.SUCCESS, message: '', projects: projects });

                            }
                        }
                    } else {
                        res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: error })
                    }
                });
            } else {
                res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: 'Invalid session_id' });
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    updateProject(req: express.Request, res: express.Response, next: express.NextFunction) {
        this.updateProjectOrTask(req, res, true)
    }

    updateTask(req: express.Request, res: express.Response, next: express.NextFunction) {
        this.updateProjectOrTask(req, res, false)
    }

    updateProjectOrTask(req: express.Request, res: express.Response, isProjectRequest: boolean) {
        try {
            console.log(req.body);
            if (req.body.session_id) {
                let updatParams: IProjectDetails = {
                    name: req.body.name,
                    start_date: req.body.start_date,
                    end_date: req.body.end_date,
                    completion_per: req.body.completion_per,
                    created_by: req.body.created_by,
                    updated_by: req.body.updated_by,
                    status: req.body.status,
                    external_id: req.body.external_id,
                    project_ref_id: req.body.project_ref_id,
                    id: req.body.id,
                };
                let that = this;
                that.projectModel.updateProjectOrTask(updatParams, isProjectRequest, (error, result) => {
                    if (!error) {
                        res.send({ status: Constants.RESPONSE_STATUS.SUCCESS, message: 'Updated data successfully.' });

                        let requestData = { ProjectTasks: [], Projects: [] };
                        if (isProjectRequest) {
                            requestData.Projects.push(formatSalesForceObject(updatParams))
                        } else {
                            requestData.ProjectTasks.push(formatSalesForceObject(updatParams))
                        }
                        let requestData1 = {
                            Data__c: JSON.stringify(requestData)
                        }
                        that.updateOnSalesforce(req.body.session_id, requestData);
                    } else {
                        res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: error });
                    }
                });
            } else {
                res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: 'Invalid session_id' });
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    updateOnSalesforce(sessionId, requestData) {
        let requestObj = {
            url: Constants.API_END_POINTS.UPDATE_PROJECT_OR_TASK_DETAILS,
            headers: {
                'Authorization' : 'Bearer ' + sessionId,
                'Content-Type': 'application/json'
            },
            json: true,
            body: requestData
        };
        console.log(requestObj);
        request.post(requestObj, (error, response) => {
            if (!error) {
                if (response.statusCode === 401) {
                } else {
                    if (response.body && response.body.length > 0) {
                    }
                }
            }
            console.log(error);
            console.log(response.body);
        });
    }

    syncUserDetails(sessionId: string, salesforceResponseArray) {
        let that = this;
        let queryConfig = buildProjectStatement(salesforceResponseArray, ['_id', 'external_id']);
        that.projectModel.execMultipleStatment(queryConfig, (error, result) => {
            if (!error) {
                console.log('In execMultipleStatment result>>', result);

                let salesforceRequestObj = { ProjectTasks: [], Projects: [] };
                let pksExternalPksMap = {}, taskRecords = [];
                result.rows.forEach((row) => {
                    pksExternalPksMap[row.external_id] = row._id;
                    salesforceRequestObj.Projects.push({ Id: row.external_id, External_Id__c: row._id });
                });

                salesforceResponseArray.forEach(projectRecord => {
                    let projectId = pksExternalPksMap[projectRecord['id']] || projectRecord['external_id'];
                    if (projectRecord.series && projectRecord.series.length > 0 && projectId) {
                        projectRecord.series.forEach((taskRecord) => {
                            taskRecord['project_ref_id'] = projectId;
                            taskRecords.push(taskRecord);
                        });
                    }
                });

                if (taskRecords && taskRecords.length) {
                    let tasksQueryConfig = buildProjectTasksStatement(taskRecords, ['_id', 'external_id']);
                    console.log(tasksQueryConfig);
                    that.projectModel.execMultipleStatment(tasksQueryConfig, (error, result1) => {
                        if (!error) {
                            console.log('In execMultipleStatment task result>>', result1);
                            result1.rows.forEach((row) => {
                                salesforceRequestObj.ProjectTasks.push({ Id: row.external_id, External_Id__c: row._id });
                            });
                        } else {
                            console.log('In execMultipleStatment task error>>', error);
                        }
                        if (salesforceRequestObj.Projects && salesforceRequestObj.Projects.length > 0 ||
                            salesforceRequestObj.ProjectTasks && salesforceRequestObj.ProjectTasks.length > 0) {
                            let requestData = {
                                Data__c: JSON.stringify(salesforceRequestObj)
                            }
                            that.updateOnSalesforce(sessionId, requestData);
                        }
                    });
                } else {
                    if (salesforceRequestObj.Projects && salesforceRequestObj.Projects.length > 0) {
                        let requestData = {
                            Data__c: JSON.stringify(salesforceRequestObj)
                        };
                        that.updateOnSalesforce(sessionId, requestData);
                    }
                }
            } else {
                console.log('In execMultipleStatment error>>', error);
            }
        });
    }
}