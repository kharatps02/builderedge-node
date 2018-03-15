import * as express from 'express';
import { sse } from '@toverux/expresse';
import { SyncController } from './sync-controller';
import * as timeout from "connect-timeout";
/**
 * @description Project routs configuration.
 */
export class SyncRoutes {
    private syncController: SyncController;
    constructor() {
        this.syncController = new SyncController();
    }

    get routes() {
        const router = express.Router();
        // POC3: SEE for the initial sync after successful registration.
        router.get('/events', sse({ flushAfterWrite: true }), this.syncController.events.bind(this.syncController));
        // POC3: Initial sync after successful registration.
        router.post('/sync/initial/:vanityKey', timeout('100000s'), this.syncController.syncDataInitial.bind(this.syncController));
        return router;
    }
}
