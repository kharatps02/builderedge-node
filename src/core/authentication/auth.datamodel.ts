import { OrgMaster, IOrgMaster } from './../models/org-master';
import { Client } from "pg";
import { Constants } from "../../config/constants";
import { IOAuthToken } from "./oauth-model";
import { utils } from "../../utils/utils";
import * as rp from 'request-promise';
import * as request from 'request';

export class AuthDataModel {
    constructor() {

    }
    /**
     * getAccessToken
     */
    public async getAccessToken(vanityKey: any): Promise<IOAuthToken> {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        try {
            pgClient.connect();
            const queryStr = "SELECT * FROM org_master WHERE vanity_id = $1";
            const result = await pgClient.query(queryStr, [vanityKey]);
            // if user is valid
            if (result.rows.length > 0) {
                const qRes = result.rows[0];
                const orgConfig: OrgMaster = new OrgMaster(qRes);
                // get access token from refresh token
                const token = await this.getOAuthToken(orgConfig.getRefreshToken());
                return token;
            } else {
                throw new Error("Not a valid user.");
            }
        } finally {
            await utils.endClient(pgClient);
        }
    }
    /**
     *
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
