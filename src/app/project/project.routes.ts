import * as express from 'express';
import { ProjectController } from './project.controller';
import { Authentication } from '../../core/authentication/authentication';
import * as timeout from "connect-timeout";
import * as compression from 'compression';
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
        // POC: Update data in database and Salesforce from VF page or 3rd party client.
        router.post('/api/project/update', timeout('300s'), this.authentication.ensureAuthenticated,
            this.projectController.updateProjectOrTask.bind(this.projectController));

        // POC: Get all details for Gantt Chart. GET request.
        router.get('/api/project/getalldetails', timeout('3600s'), this.authentication.ensureAuthenticated,
            this.projectController.getProjectsForGantt.bind(this.projectController));
        // POC: Get all details for Gantt Chart. POST request.
        router.post('/api/project/getalldetails', timeout('3600s'), this.authentication.ensureAuthenticated,
            this.projectController.getProjectsForGantt.bind(this.projectController));

        // CR: Serve GZipped data from static JSON files.
        router.get('/api/project/data/:project', timeout('3600s'), this.authentication.ensureAuthenticated,
            this.projectController.getProtectedDataGZip.bind(this.projectController));

        // Test routes
        router.get('/project/test-zip', timeout('3600s'), this.authentication.ensureAuthenticated, this.projectController.testPage.bind(this.projectController));
        return router;
    }
}
