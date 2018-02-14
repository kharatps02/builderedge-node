import { IHasToken, IOAuthToken } from './oauth-model';
import * as express from 'express';
import * as rp from 'request-promise';
import { Constants } from '../../config/constants';

/**
 *  This middleware class for authorization of request
 */
export class Authentication {
    constructor() {
    }

    public ensureAuthorized(req: express.Request, res: express.Response, next: express.NextFunction): void {
        next();
    }
    public async getOAuthToken(refreshToken: string, isSandBoxUser = false): Promise<IOAuthToken> {

        const serviceUserAuthConfig = {
            grant_type: Constants.OAUTH.grant_type,
            client_id: Constants.OAUTH.client_id,
            client_secret: Constants.OAUTH.client_secret,
            refresh_token: refreshToken,
        };
        const requestObj = {
            url: Constants.OAUTH.url,
            qs: serviceUserAuthConfig,
            method: 'POST',
            json: true,
        };

        console.log('In postRequestOnSalesforce requestObj - ', requestObj);
        return await rp.post(requestObj);
    }
    public authenticateAndRun(orgConfig: IHasToken, callback: (error: any, response: request.Response) => void) {
        const serviceUserAuthConfig = {
            grant_type: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.grant_type,
            client_id: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_id,
            client_secret: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.client_secret,
            refresh_token: orgConfig.refresh_token,
        };
        const requestObj = {
            url: Constants.SALESFORCE_PLATFORM_EVENTS_CONFIG.OAUTH.url,
            qs: serviceUserAuthConfig,
            method: 'POST',
            json: true,
        };

        console.log('In postRequestOnSalesforce requestObj - ', requestObj);
        return request.post(requestObj, (error, response) => {
            console.log('In postRequestOnSalesforce', error, response || response.body);
            if (callback) {
                callback(error, response);
            }
        });
    }
}
