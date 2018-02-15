import { RegisterOrgController } from './register-org.controller';
import * as express from 'express';
/**
 * @description Project routs configuration.
 */
export class RegisterOrgRoutes {
    private routers: express.Router;
    private registerOrgController: RegisterOrgController;
    //  private authentication: Authentication;
    constructor() {
        this.registerOrgController = new RegisterOrgController();
        //  this.authentication = new Authentication();
    }

    get routes() {
        const router = express.Router();
        // router.get('/', this.registerOrgController.index);
        router.get('/register', this.registerOrgController.registerIndex.bind(this.registerOrgController));
        router.get('/register/:isSandBoxUser', this.registerOrgController.register.bind(this.registerOrgController));
        // router.get('/registerUser/:orgid', this.registerOrgController.registerUser);
        router.get('/authorizeUser', this.registerOrgController.authorizeUser.bind(this.registerOrgController));
        router.get('/oauth/callback', this.registerOrgController.oAuthCallback.bind(this.registerOrgController));
        router.get('/registeredSuccessfully/:vanityKey', this.registerOrgController.registeredSuccessfully.bind(this.registerOrgController));
        // router.get('/isRegisteredUser', this.registerOrgController.isRegisteredUser);
        // router.get('/registerUserWithVanityText', this.registerOrgController.registerUserWithVanityText);

        return router;
    }
}
