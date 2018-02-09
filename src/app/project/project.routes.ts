import * as express from 'express';
import { ProjectController } from './project.controller';
import { Authentication } from '../../core/authentication/authentication';
export class ProjectRoutes {
    private routers: express.Router;
    private projectController: ProjectController;
    private authentication: Authentication;
    constructor() {
        this.projectController = new ProjectController();
        this.authentication = new Authentication();
    }

    get routes() {
        const router = express.Router();
        // POC1
        router.post('/api/project/create', this.authentication.ensureAuthorized, this.projectController.create.bind(this.projectController));
        router.post('/api/project/update', this.authentication.ensureAuthorized, this.projectController.updateProject.bind(this.projectController));
        router.post('/api/task/update', this.authentication.ensureAuthorized, this.projectController.updateTask.bind(this.projectController));
        router.post('/api/project/findbyid', this.authentication.ensureAuthorized, this.projectController.getalldetails.bind(this.projectController));
        router.post('/api/project/getalldetails', this.authentication.ensureAuthorized, this.projectController.getalldetails.bind(this.projectController));

        // POC2
        router.post('/api/external/project/update', this.authentication.ensureAuthorized, this.projectController.updateProjectPOC2.bind(this.projectController));
        router.post('/api/external/task/update', this.authentication.ensureAuthorized, this.projectController.updateTaskPOC2.bind(this.projectController));
        return router;
    }
}
