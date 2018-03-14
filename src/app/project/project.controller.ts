
import { IOrgMaster } from './../../core/models/org-master';
import * as express from "express";
import * as request from 'request';
import * as path from 'path';
import * as fs from 'fs';


import { ProjectModel, IProjectDetails, ITaskDetails } from './project.model';
import { OrgMasterModel } from '../org-master/org-master.model';
import { formatProjectAndTaskDetails, buildInsertStatements, buildUpdateStatements, swapSfId } from './project.helper';
import { Constants } from '../../config/constants';
import { PubService } from "../db-sync/pub-service";
import { forEach } from "async";
import { Enums } from "../../config/enums";
import { ProjectSfModel } from './project.sfmodel';
import { AppError, InvalidRequestError, UnauthorizedError, NotFoundError } from '../../utils/errors';
import { QueryConfig } from 'pg';
/**
 * Handles the requests related to project object.
 */
export class ProjectController {
    private pubService: PubService;
    private projectSfModel: ProjectSfModel;
    private projectModel: ProjectModel;
    private orgMasterModel: OrgMasterModel;
    constructor() {
        this.projectModel = new ProjectModel();
        this.orgMasterModel = new OrgMasterModel();
        this.projectSfModel = new ProjectSfModel();
        this.pubService = new PubService();
    }
    /**
     * testPage
     */
    public async testPage(req: express.Request, res: express.Response, next: express.NextFunction) {
        res.render('test-page');
    }
    /**
     * getProjectsForGantt
     * @description
     * Get Projects and tasks to be used with the Gantt.
     * Gets projects for the given project ids if user is authorized to access them.
     * If no project ids are passed, it gets all projects the user is authorized to access.
     * @param req expressjs request
     * @param res expressjs response
     * @param next expressjs next function
     * @author Rushikesh K
     */
    public async getProjectsForGantt(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const sessionId = req.headers['session-id'] as string;
            const orgId = req.headers['org-id'] as string;
            let receivedProjectIds: string[] | string = req.query.p || req.body;
            let projectIds: string[];
            if (receivedProjectIds && typeof receivedProjectIds === 'string') {
                projectIds = receivedProjectIds.split(',');
            } else {
                projectIds = receivedProjectIds as string[];
            }
            if (!sessionId || !orgId) {
                throw "Unauthorized request";
            }
            // Get org config based on the passed org id.
            const orgConfig = await this.orgMasterModel.getOrgConfigByOrgIdAsync(orgId);
            // Get authorized project ids first.
            const authorizedProjectIds: string[] = await this.projectSfModel.getAuthorizedProjectIds(receivedProjectIds, orgConfig.api_base_url, sessionId);
            let unauthorizedProjectIds: string[] = [];
            if (projectIds) {
                unauthorizedProjectIds = projectIds.filter((v, i, a) => {
                    return !(authorizedProjectIds.indexOf(v) > -1);
                });
            }
            // Get the projects and tasks formatted for Gantt by passing the authorized project ids for the current user.
            const data = await this.projectModel.getAllProjectsAsync(authorizedProjectIds);
            if (!data || data.length === 0) {
                throw new AppError('You do not have any project authorized to you.')
            }
            res.send({ status: Enums.RESPONSE_STATUS.SUCCESS, message: '', projects: data, error: { unauthorized: unauthorizedProjectIds } });
        } catch (err) {
            this.handleError(err, res);
        }
    }

    /**
     * getProtectedData
     */
    public async getProtectedDataGZip(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const path1 = path.join(__dirname, '../../../data')
            const staticMiddlewarePrivate = express.static(path1);
            let projectId: string = req.params.project;
            if (!projectId || typeof projectId !== 'string') {
                throw new InvalidRequestError('Invalid project id.')
            }

            if (Constants.ALLOW_UNAUTHORIZED) {
                console.log('**** Serving Protected Data Unauthorized ****');
                const filePath = path.join(path1, '/protected/', projectId + '.json');
                if (fs.existsSync(filePath)) {
                    // res.set('Content-Encoding', 'gzip');
                    // res.download(filePath, projectId);
                    res.sendFile(filePath);
                } else {
                    throw new NotFoundError();
                }
                return;
            } else {
                const orgId = req.headers['org-id'] as string;
                const sessionId = req.headers['session-id'] as string;

                if (!sessionId || !orgId) {
                    throw new UnauthorizedError("Unauthorized request");
                }
                // Get org config based on the passed org id.
                const orgConfig = await this.orgMasterModel.getOrgConfigByOrgIdAsync(orgId);
                // Get authorized project ids first.
                const authorizedProjectIds: string[] = await this.projectSfModel.getAuthorizedProjectIds(projectId, orgConfig.api_base_url, sessionId);
                let unauthorizedProjectIds: string[] = [];
                if (projectId) {
                    unauthorizedProjectIds = [projectId].filter((v, i, a) => {
                        return !(authorizedProjectIds.indexOf(v) > -1);
                    });
                }
                // Get the projects and tasks formatted for Gantt by passing the authorized project ids for the current user.

                if (!authorizedProjectIds || authorizedProjectIds.length === 0) {
                    throw new UnauthorizedError('You do not have any project authorized to you.');
                }
                console.log('**** Protected Data Authorized ****');
                const filePath = path.join(path1, '/protected/', projectId + '.json');
                if (fs.existsSync(filePath)) {
                    // res.set('Content-Encoding', 'gzip');
                    // res.download(filePath, projectId);
                    res.sendFile(filePath);
                } else {
                    throw new NotFoundError();
                }

            }
        } catch (err) {
            this.handleError(err, res);
        }
    }

    /**
     * updateProjectOrTask
     * @description Function to updates Projects or Tasks
     * @param req With org id and session id (optional) in headers or body. 
     * #### e.g. 
     * - In Headers:    `{'org-id':'<Salesforce-Org-Id>', 'session-id':'<Some-session-id-here>'}`
     * OR
     * - In Body:   `{org_id:'<Salesforce-Org-Id>', session_id:'<Some-session-id-here>'}`
     * @param res
     * @author Rushikesh K
     */
    public async updateProjectOrTask(req: express.Request, res: express.Response) {
        try {
            const sessionId = req.headers['session-id'] as string || req.body.session_id;
            const orgId = req.headers['org-id'] as string || req.body.org_id;
            if (orgId) {
                const asyncTasks = [];
                const data = req.body.Data__c;
                console.log("data received from SF", data);
                const queryConfigArray: QueryConfig[] = [];

                if (data.Projects && data.Projects.length > 0) {
                    data.Projects.forEach((project: IProjectDetails) => {
                        const queryConfig = buildUpdateStatements(project, true);
                        queryConfigArray.push(queryConfig);
                    });
                }

                if (data.ProjectTasks && data.ProjectTasks.length > 0) {
                    data.ProjectTasks.forEach((task: ITaskDetails) => {
                        const queryConfig = buildUpdateStatements(task, false);
                        queryConfigArray.push(queryConfig);
                    });
                }
                try {
                    const results = await this.projectModel.updateProjectsAndTasksAsync(queryConfigArray);
                    console.log(results);
                    if (!results || results.length === 0) {
                        throw new InvalidRequestError(Constants.MESSAGES.INVALID_REQUEST_PARAMS);
                    }
                    if (results && results.length > 0) {
                        const updated = results.filter(r => r.rowCount > 0);
                        if (!updated || updated.length <= 0) {
                            throw new InvalidRequestError(Constants.MESSAGES.INVALID_REQUEST_PARAMS);
                        }
                    }
                    // Update salesforce data
                    if (results && results.length > 0) {
                        if (data.Projects) {
                            data.Projects.forEach(swapSfId);
                        }
                        if (data.ProjectTasks) {
                            data.ProjectTasks.forEach(swapSfId);
                        }
                        if (sessionId) {
                            // If the session id is passed, this request will use it to update it on salesforce.
                            const publishResult = this.pubService.publishWithOrgId(orgId, JSON.stringify(data), sessionId);
                            // respond that the update was successful.
                            res.send({ status: Enums.RESPONSE_STATUS.SUCCESS, message: Constants.MESSAGES.UPDATED });
                        } else {
                            // Else, it will use the integration user to update the data.
                            const publishResult = this.pubService.publishWithOrgId(orgId, JSON.stringify(data));
                            // respond that the update was successful.
                            res.send({ status: Enums.RESPONSE_STATUS.SUCCESS, message: Constants.MESSAGES.UPDATED });
                        }
                    }
                } catch (error) {
                    this.handleError(error, res);
                }
            } else {
                throw new InvalidRequestError(Constants.MESSAGES.INVALID_REQUEST_PARAMS);
            }
        } catch (error) {
            this.handleError(error, res);
        }
    }
    /**
     * handleError
     * @description Handles error responses.
     * @param error Error
     * @param res Express response object
     * @author Rushikesh K
     */
    private handleError(error: any, res: express.Response) {
        if (error instanceof AppError) {
            res.status(error.getCode() || 500).send(error);
        } else {
            res.status(500).send({ status: Enums.RESPONSE_STATUS.ERROR, message: error ? error.message ? error.message : error : Constants.MESSAGES.SOMETHING_WENT_WRONG });
        }
    }
}
