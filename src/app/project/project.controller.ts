import * as express from "express";
import * as request from 'request';

import { ProjectModel, IProjectRequest } from './project.model';
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
        if (req.body.session_id) {
            let requestHeader = {
                headers: {
                    Authorization : 'Bearer ' + req.body.session_id
                }
            };
            request(Constants.API_END_POINTS.GET_PROJECT_AND_TASK_DETAILS, requestHeader, function (error, response, body) {

                if (error) {
                    res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: error })
                } else {
                    if (response.statusCode === 401) {
                        res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: '', results: response.body[0].message })
                    } else {







                        
                        res.send({ status: Constants.RESPONSE_STATUS.SUCCESS, message: '', results: response.body })
                    }

                }
            });
        } else {
            res.send({ status: Constants.RESPONSE_STATUS.ERROR, message: 'Invalid session_id' });
        }
    }
}