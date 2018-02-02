import * as express from "express";
import * as request from 'request';

import { ProjectModel, IProjectRequest, IProjectDetails, ITaskDetails } from './project.model';
import { Constants } from '../../config/constants';

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
    update(req: express.Request, res: express.Response, next: express.NextFunction) {

    }

    getalldetails(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {

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
                                res.send({ status: Constants.RESPONSE_STATUS.SUCCESS, message: '', projects: formatProjectDetails.call(this, projectArray) })
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

        function formatProjectDetails(projectArray) {
            let newProjectArray = [];
            projectArray.forEach(project => {
                let newProject = { series: [] };
                newProject['id'] = project['Id'];
                newProject['name'] = project['Name'] || '';
                newProject['description'] = project['Description__c'] || '';
                newProject['start'] = new Date(project['Start_Date__c']).getTime();
                newProject['end'] = new Date(project['End_Date__c']).getTime();
                newProject['completion_per'] = project['Completion_Percentage__c'];
                newProject['status'] = project['Status__c'];
                newProject['created_by'] = project['CreatedById'];
                newProject['updated_by'] = project['LastModifiedById'];
                newProject['created_at'] = project['CreatedDate'];
                newProject['updated_at'] = project['LastModifiedDate'];
                newProject['external_id'] = project['External_Id__c'];

                if (project.Project_Tasks__r && project.Project_Tasks__r.records && project.Project_Tasks__r.records.length > 0) {
                    project.Project_Tasks__r.records.forEach(task => {
                        let newTask = {};

                        newTask['id'] = task['Id'];
                        newTask['name'] = task['Name'] || '';
                        newTask['description'] = task['Description__c'] || '';
                        newTask['start'] = new Date(task['Start_Date__c']).getTime();
                        newTask['end'] = new Date(task['End_Date__c']).getTime();
                        newTask['completion_per'] = task['Completion_Percentage__c'];
                        newTask['status'] = task['Status__c'];
                        newTask['created_by'] = task['CreatedById'];
                        newTask['updated_by'] = task['LastModifiedById'];
                        newTask['created_at'] = task['CreatedDate'];
                        newTask['updated_at'] = task['LastModifiedDate'];
                        newTask['external_id'] = task['External_Id__c'];
                        newTask['project_ref_id'] = project['Id'];
                        newProject.series.push(newTask);
                    });
                }
                newProjectArray.push(newProject);
            });

            return newProjectArray;
        }
    }


}