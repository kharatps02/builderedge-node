import { RegisterOrgController } from './register-org.controller';
import * as express from 'express';
/**
 * @description Project routs configuration.
 */
export class RegisterOrgRoutes {
    private registerOrgController: RegisterOrgController;
    constructor() {
        this.registerOrgController = new RegisterOrgController();
    }

    get routes() {
        const router = express.Router();
        router.get('/register', this.registerOrgController.registerIndex.bind(this.registerOrgController));
        // Use the following route to initiate registration from node side.
        router.get('/register/:isSandBoxUser?', this.registerOrgController.register.bind(this.registerOrgController));
        router.get('/authorizeUser', this.registerOrgController.authorizeUser.bind(this.registerOrgController));
        router.get('/oauth/callback', this.registerOrgController.oAuthCallback.bind(this.registerOrgController));
        router.get('/registeredSuccessfully/:vanityKey', this.registerOrgController.registeredSuccessfully.bind(this.registerOrgController));
        return router;
    }
}
