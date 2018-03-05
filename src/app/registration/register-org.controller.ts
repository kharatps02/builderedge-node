import * as express from 'express';
import * as jsforce from 'jsforce';
import { Constants } from '../../config/constants';
import { utils } from '../../utils/utils';
import { RegisterOrgDataModel } from './register-org.datamodel';
import { UserInfo } from 'jsforce/connection';
import { AppError } from '../../utils/errors';

export class RegisterOrgController {
    public dataModel: RegisterOrgDataModel;

    constructor() {
        this.dataModel = new RegisterOrgDataModel();
    }
    /**
     * Fallback landing page for registration. Will by default consider the Org to be Non-sandbox org.
     * @param request 
     * @param response 
     */
    public registerIndex(request: express.Request, response: express.Response) {
        const origin = request.query.origin;
        response.cookie("experience", origin);
        // Tells the app that it's not a Sandbox org.
        response.redirect("/register/false");
    }
    /**
     * The landing page for Org registration.
     * @param request 
     * @param response 
     */
    public register(request: express.Request, response: express.Response) {
        let isSandBoxUser = request.params.isSandBoxUser;
        const origin = request.query.origin;
        if (origin) {
            response.cookie("experience", origin);
        }
        if (isSandBoxUser !== "true") {
            isSandBoxUser = "false";
        }
        response.render('preRegisterUser', { isSandBoxUser });
    }
    /**
     * authorizeUser
     * @description Identifies org type and sends the authentication request to salesforce.
     * @param request 
     * @param response 
     */
    public authorizeUser(request: express.Request, response: express.Response) {
        const isSandBoxUser = request.query.isSandBoxUser;
        if (isSandBoxUser === "true") {
            const oauth2 = new jsforce.OAuth2({
                loginUrl: 'https://test.salesforce.com',
                clientId: Constants.OAUTH.client_id,
                clientSecret: Constants.OAUTH.client_secret,
                redirectUri: Constants.OAUTH.redirectUri,
            });
            const uri = oauth2.getAuthorizationUrl({
                scope: 'api refresh_token',
            });
            response.cookie('oauth2', oauth2);
            response.redirect(uri);
        } else {
            const oauth2 = new jsforce.OAuth2({
                loginUrl: 'https://login.salesforce.com',
                clientId: Constants.OAUTH.client_id,
                clientSecret: Constants.OAUTH.client_secret,
                redirectUri: Constants.OAUTH.redirectUri,
            });
            const uri = oauth2.getAuthorizationUrl({
                scope: 'api refresh_token',
            });
            response.cookie('oauth2', oauth2);
            response.redirect(uri);
        }
    }
    /**
     * oAuthCallback
     * @description Handles OAuth response from salesforce and generates the desired tokens.
     * @param request 
     * @param response 
     * @param next 
     */
    public async oAuthCallback(request: express.Request, response: express.Response, next: express.NextFunction) {
        const conn = new jsforce.Connection({ oauth2: request.cookies.oauth2 });
        const appVersion = request.cookies.oauth2.appVersion; // return app version
        const code = request.query.code;
        conn.authorize(code, async (error: Error, userInfo: UserInfo) => {
            if (error) {
                return next(error);
            }
            const grantedUserId = userInfo.id;
            const issuedAt = new Date().getTime();
            const instanceUrl = conn.instanceUrl;
            let isSandBoxUser = 'false';
            if (userInfo.url.match('test.salesforce.com')) {
                isSandBoxUser = 'true';
            }
            try {
                const result = await this.dataModel.registerOrg(userInfo.organizationId, conn.refreshToken,
                    instanceUrl, grantedUserId, conn.accessToken);
                response.cookie('vanity-id', result.vanity_id);
                response.redirect('/registeredSuccessfully/' + result.vanity_id);

            } catch (error) {
                response.render('error', { title: 'Error', viewData: error });
            }
        });
    }
    /**
     * registeredSuccessfully
     * @description Registration successful handler. This tells the user that the org is registered and s/he can do initial sync by going next.
     * @param request 
     * @param response 
     * @param next 
     */
    public async registeredSuccessfully(request: express.Request, response: express.Response, next: express.NextFunction) {
        const vanityKey = request.params.vanityKey;
        try {
            // Read Encrypted Access Token and clear it from cookies.
            const vanityId = request.cookies['vanity-id'];
            // Clear access-token cookie
            response.clearCookie('vanity-id');
            const experience = request.cookies.experience;

            const result = await this.dataModel.registeredSuccessfully(vanityKey);

            // If the access token doesn't match with the one stored, throw error.
            if (!vanityId || (result.vanity_id !== vanityId)) {
                throw new AppError('Unauthorized');
            }

            const appUrl = `${result.api_base_url}${experience === 'lightning' ? '/one/one.app?source=aloha#/n/Gantt_Chart' : '/apex/GanttChart'}`;
            // All is good. Print the body
            // Ask user to sync the data for the first time.
            response.render('registeredSuccessfully', { accessToken: result.access_token, vanityKey, appUrl });
        } catch (error) {
            response.render('error', { title: 'Error', viewData: error });
        }
    }
}
