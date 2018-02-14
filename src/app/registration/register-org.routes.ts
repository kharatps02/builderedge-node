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
        // POC1
        router.get('/', this.registerOrgController.index);
        router.get('/register', this.registerOrgController.registerIndex);
        router.get('/register/:isSandBoxUser', this.registerOrgController.register);
        // router.get('/registerUser/:orgid', this.registerOrgController.registerUser);
        router.get('/authorizeUser', this.registerOrgController.authorizeUser);
        router.get('/oauth/callback', this.registerOrgController.oAuthCallback);
        router.get('/registeredSuceessfully/:vanityurltext', this.registerOrgController.registeredSuccessfully);
        // router.get('/isRegisteredUser', this.registerOrgController.isRegisteredUser);
        // router.get('/registerUserWithVanityText', this.registerOrgController.registerUserWithVanityText);

        return router;
    }
}
