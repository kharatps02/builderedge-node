/**
 *  This middleware class for authorization of request
 */
import * as express from 'express';

export class Authentication {
    constructor() {
    }

    ensureAuthorized(req: express.Request, res: express.Response, next: express.NextFunction): void {
        next();
    }
}