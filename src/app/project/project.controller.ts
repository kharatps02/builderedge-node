import * as express from "express";
import * as request from 'request';

import { ProjectModel, IProjectRequest, IProjectDetails, ITaskDetails } from './project.model';
import { formatProjectDetails, buildProjectStatement, buildProjectTasksStatement } from './project.helper';
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
                            res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: '', results: response.body[0].message })
                        } else {
                            if (response.body && response.body.length > 0) {
                                let projectArray: Array<IProjectDetails> = response.body;
                                if (typeof response.body === 'string') {
                                    projectArray = JSON.parse(response.body);
                                }
                                let projects = formatProjectDetails(projectArray);
                                that.syncUserDetails.call(that, projects);
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

                this.projectModel.updateProjectOrTask(updatParams, isProjectRequest, (error, result) => {
                    if (!error) {
                        res.send({ status: Constants.RESPONSE_STATUS.SUCCESS, message: 'Updated data successfully.' });
                      //  this.updateOnSalesforce(req, res, updatParams)
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

    updateOnSalesforce(req: express.Request, res: express.Response, updatParams) {
        let requestHeader = {
            headers: {
                'Authorization' : 'Bearer ' + req.body.session_id,
                'Content-Type': 'application/json'
            },
            body: updatParams
        };
        request(Constants.API_END_POINTS.UPDATE_PROJECT_OR_TASK_DETAILS, requestHeader, (error, response) => {
            if (!error) {
                if (response.statusCode === 401) {
                    res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: '', results: response.body[0].message })
                } else {
                    if (response.body && response.body.length > 0) {
                        res.send({ status: Constants.RESPONSE_STATUS.SUCCESS, message: '' });
                    }
                }
            } else {
                res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: error })
            }
        });
    }

    syncUserDetails(projects) {
        let that = this;
        let queryConfig = buildProjectStatement(projects, ['_id', 'external_id']);
        console.log(queryConfig);
        that.projectModel.execMultipleStatment(queryConfig, (error, result) => {
            if (!error) {
                console.log('In execMultipleStatment result>>', result);

                // update external id at salesfore side 
                let pksExternalPksMap = {};
                result.rows.forEach((row) => {
                    pksExternalPksMap[row.external_id] = row._id;
                });
                let tasks = [];
                projects.forEach(element => {
                    let projectId = pksExternalPksMap[element['id']] || element['external_id'];
                    if (element.series && element.series.length > 0 && projectId) {
                        element.series.forEach((task) => {
                            task['project_ref_id'] = projectId;
                            tasks.push(task);
                        });
                    }
                });

                if (tasks && tasks.length) {
                    let tasksQueryConfig = buildProjectTasksStatement(tasks, ['_id', 'external_id']);
                    console.log(tasksQueryConfig);
                    that.projectModel.execMultipleStatment(tasksQueryConfig, (error, result) => {
                        if (!error) {
                            console.log('In execMultipleStatment task result>>', result);
                        } else {
                            console.log('In execMultipleStatment task error>>', error);
                        }
                    });
                }
            } else {
                console.log('In execMultipleStatment error>>', error);
            }
        });
    }
}