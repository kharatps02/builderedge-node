import * as express from 'express';
import { ISseResponse, sse } from '@toverux/expresse';
import { SyncController } from './sync-controller';
import * as timeout from "connect-timeout";
/**
 * @description Project routs configuration.
 */
export class SyncRoutes {
    private syncController: SyncController;
    //  private authentication: Authentication;
    constructor() {
        this.syncController = new SyncController();
        //  this.authentication = new Authentication();
    }

    get routes() {
        const router = express.Router();
        // POC1
        router.get('/sync', this.syncController.index.bind(this.syncController));
        router.get('/events', sse, this.syncController.events.bind(this.syncController));

        // router.post('/sync/initial/:vanityKey', this.syncController.syncInitial.bind(this.syncController));
        router.post('/sync/initial/:vanityKey', timeout('100000s'), this.syncController.syncDataInitial.bind(this.syncController));

        return router;
    }
}
