import { OrgMaster, IOrgMaster } from './../models/org-master';
import { Client } from "pg";
import { Constants } from "../../config/constants";
import { IOAuthToken } from "./oauth-model";
import { utils } from "../../utils/utils";
import * as rp from 'request-promise';
import * as request from 'request';
import { OrgError } from '../../utils/errors';

export class AuthDataModel {
    constructor() {

    }
    /**
     *getAccessTokenByRefreshToken
     * @param decryptedRefreshToken
     */
    public async getAccessTokenByRefreshToken(decryptedRefreshToken: string): Promise<IOAuthToken> {
        return await this.getOAuthToken(decryptedRefreshToken);
    }
    private async getOAuthToken(refreshToken: string): Promise<IOAuthToken> {
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
        // console.log('In getOAuthToken - ', requestObj);
        const token = await rp.post(requestObj)
        const parsed = token as IOAuthToken;
        return parsed;
    }
}
