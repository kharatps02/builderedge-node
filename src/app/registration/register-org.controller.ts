import * as express from 'express';
import * as jsforce from 'jsforce';
import * as pg from 'pg';
import { Constants } from '../../config/constants';
import { utils } from '../../utils/utils';
import { RegisterOrgDataModel } from './register-org.datamodel';

pg.defaults.ssl = true;
pg.defaults.poolSize = 20;
// var jsforce = require('jsforce'),
//     pg = require('pg'),
//     appUtility = require('../helpers/utilityMethods'),
//     CONSTANT = require('../config/constant').CONSTANT,
//     salesforceOauthModel = require('../models/salesforceOauthModel').SalesforceOauthModel,
//     salesforceDataModel = require('../models/salesforceDataModel').SalesforceDataModel;
export class RegisterOrgController {
    public dataModel: RegisterOrgDataModel;

    constructor() {
        this.dataModel = new RegisterOrgDataModel();
    }
    public index(request: express.Request, response: express.Response) {
        response.redirect("/register");
    }
    public registerIndex(request: express.Request, response: express.Response) {
        response.redirect("/register/false");
    }
    public register(request: express.Request, response: express.Response) {
        let isSandBoxUser = request.params.isSandBoxUser;
        if (isSandBoxUser !== "true") {
            isSandBoxUser = "false";
        }
        response.render('preRegisterUser', { isSandBoxUser });
    }
    // public registerUser(request: express.Request, response: express.Response) {
    //     const orgId = request.params.orgId;
    //     response.render('registerUser', { orgId });
    // }
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
    public oAuthCallback(request: express.Request, response: express.Response, next: express.NextFunction) {
        const conn = new jsforce.Connection({ oauth2: request.cookies.oauth2 });
        const appVersion = request.cookies.oauth2.appVersion; // return app version
        const code = request.query.code;
        conn.authorize(code, async (error, userInfo) => {
            if (error) {
                return next(error);
            }
            const encryptedRefreshToken = utils.encryptCipher(conn.refreshToken, process.env.TOKEN_ENCRIPTION_KEY);
            const encryptedORGID = utils.encryptCipher(userInfo.organizationId, process.env.ORGID_ENCRIPTION_KEY);
            const grantedUserId = userInfo.id;
            const issuedAt = new Date().getTime();
            const instanceUrl = conn.instanceUrl;
            let isSandBoxUser = 'false';
            if (userInfo.url.match('test.salesforce.com')) {
                isSandBoxUser = 'true';
            }
            try {
                const result = await this.dataModel.oAuthCallback(encryptedORGID, encryptedRefreshToken,
                    instanceUrl, grantedUserId, conn.accessToken);
                response.redirect('/registeredSuccessfully/' + result);

            } catch (error) {
                response.render('error', { title: 'Error', viewData: error });
            }
        });
    }
    public async registeredSuccessfully(request: express.Request, response: express.Response, next: express.NextFunction) {
        const vanityKey = request.params.vanityKey;
        try {
            const result = await this.dataModel.registeredSuccessfully(vanityKey);
            // All is good. Print the body

            // TODO: INITIATE THE PROCESS HERE
            // Start sync and pass the event.
            // Then Redirect to salesforce
            response.render('registeredSuccessfully', { accessToken: result.access_token, vanityKey, appUrl: `${result.api_base_url}/apex/GanttChart` });
            // response.redirect(`${result.api_base_url}/apex/GanttChart`);
        } catch (error) {
            response.render('error', { title: 'Error', viewData: error });
        }
    }
    // public async isRegisteredUser(request: express.Request, response: express.Response, next: express.NextFunction) {
    //     const orgId = request.body.orgId;
    //     if (!orgId) {
    //         response.send({ userRegistered: false });
    //         return;
    //     }
    //     const encryptedORGID = utils.encryptCipher(request.body.orgId, process.env.ORGID_ENCRIPTION_KEY);
    //     try {
    //         const result = await this.dataModel.isRegisteredUser(orgId);
    //         response.send(result);
    //     } catch (error) {
    //         response.send(error);
    //         // response.render('error', { title: 'Error', viewData: error });
    //     }
    // }
    // public async registerUserWithVanityText(request: express.Request, response: express.Response, next: express.NextFunction) {
    //     const customerName = request.body.customerName;
    //     const orgId = request.body.orgId;
    //     try {
    //         const result = await this.dataModel.registerUserWithVanityText(orgId, customerName);
    //         response.redirect('/registeredSuceessfully/' + customerName + '');
    //     } catch (error) {
    //         response.render('error', { title: 'Error', viewData: error });
    //     }
    // }
}
