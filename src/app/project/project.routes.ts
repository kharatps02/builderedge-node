import * as express from 'express';
import { ProjectController } from './project.controller';
import { Authentication } from '../../core/authentication/authentication';
import * as timeout from "connect-timeout";

/**
 * @description Project routs configuration.
 */
export class ProjectRoutes {
    private projectController: ProjectController;
    private authentication: Authentication;
    constructor() {
        this.projectController = new ProjectController();
        this.authentication = new Authentication();
    }

    get routes() {
        const router = express.Router();
        // Setting timeout to 1 hour for really huge data, especially for getalldata.
        router.post('/api/project/update', timeout('300s'), this.authentication.ensureAuthorized, this.projectController.updateProjectOrTask.bind(this.projectController));
        router.get('/api/project/getalldetails', timeout('3600s'), this.authentication.ensureAuthorized, this.projectController.getProjectsForGantt.bind(this.projectController));
        router.post('/api/project/getalldetails', timeout('3600s'), this.authentication.ensureAuthorized, this.projectController.getProjectsForGantt.bind(this.projectController));
        // router.get('/api/project/data/*/:file', timeout('3600s'), this.authentication.ensureAuthenticated, this.projectController.getProtectedData.bind(this.projectController));
        router.get('/api/project/data', timeout('3600s'), this.authentication.ensureAuthenticated, this.projectController.getProtectedData.bind(this.projectController));
        return router;
    }
}
