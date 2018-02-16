import { ConnectionError } from './../../utils/errors';
import { ServerResponse } from './../../core/server-response';
import { Client } from "pg";
import { Constants } from "../../config/constants";
import { Enums } from "../../config/enums";
import { utils } from '../../utils/utils';
import { Authentication } from '../../core/authentication/authentication';

export class RegisterOrgDataModel {
    private auth: Authentication;

    constructor() {
        this.auth = new Authentication();
    }
    /**
     * oAuthCallback
     */
    public async oAuthCallback(encryptedORGID: string, encryptedRefreshToken: string, instanceUrl: string, grantedUserId: string, accessToken: string) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        try {
            pgClient.connect();
            // await utils.connectClient(pgClient);
            const outerQueryStr = "SELECT vanity_id FROM org_master WHERE org_id = $1 limit 1";
            const result = await pgClient.query(outerQueryStr, [encryptedORGID]);

            // let webFormLink = '';
            if (result.rows.length === 0) {
                // SQL Query > Insert Data
                // tslint:disable-next-line:max-line-length
                const queryStr = "INSERT INTO org_master(org_id, refresh_token, api_base_url, user_id, event_endpoint_url, access_token) values($1, $2, $3, $4, $5, $6) RETURNING vanity_id";
                const queryRes = await pgClient.query(queryStr, [encryptedORGID, encryptedRefreshToken, instanceUrl, grantedUserId, instanceUrl + '/cometd/40.0', accessToken]);
                return queryRes.rows[0].vanity_id;
                // query.on('end', function() {
                //     done();
                //     if (appVersion) {
                //         response.redirect('/' + appVersion + '/registerUser/' + encryptedORGID);
                //     } else {
                //         response.redirect('/registerUser/' + encryptedORGID);
                //     }
                // });
            } else {
                const queryStr = "UPDATE org_master SET refresh_token = $1 WHERE org_id = $2 RETURNING vanity_id";
                const queryRes = await pgClient.query(queryStr, [encryptedRefreshToken, encryptedORGID]);
                return queryRes.rows[0].vanity_id;
                // query.on('end', function() {
                //     done();
                //     if (appVersion) {
                //         response.redirect('/' + appVersion + '/registerUser/' + encryptedORGID);
                //     } else {
                //         response.redirect('/registerUser/' + encryptedORGID);
                //     }
                // });
            }
        } finally {
            await utils.endClient(pgClient);
        }

    }
    /**
     * registeredSuccessfully
     */
    public async registeredSuccessfully(vanityKey: any): Promise<any> {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        try {
            pgClient.connect();
            // await utils.connectClient(pgClient);
            const queryStr = "SELECT * FROM org_master WHERE vanity_id = $1";
            const result = await pgClient.query(queryStr, [vanityKey]);
            // if user is valid
            if (result.rows.length > 0) {
                const refreshToken = utils.decryptCipher(result.rows[0].refresh_token, '' + process.env.TOKEN_ENCRIPTION_KEY);
                const instanceurl = result.rows[0].api_base_url;
                // const isSandBoxUser = result.rows[0].issandboxuser.trim();

                // get access token from refresh token
                // const token = await this.auth.getOAuthToken(refreshToken);

                return result.rows[0];
            } else {
                throw new Error("Not a valid user.");
            }
        } finally {
            await utils.endClient(pgClient);
        }
    }
    // /**
    //  * registerUserWithVanityText
    //  */
    // public async registerUserWithVanityText(orgId, customerName): Promise<ServerResponse> {
    //     const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
    //     try {
    //         // await pgClient.connect((err) => { throw new ConnectionError('Could not connect to database', err); });
    //         await utils.connectClient(pgClient);
    //         const outerQueryStr = "SELECT user_id FROM CUSTOMER WHERE org_id = $1 limit 1";
    //         const result = await pgClient.query(outerQueryStr, [orgId]);
    //         if (result.rows.length === 0) {
    //             throw Error('No records found.');
    //         } else {
    //             // const queryStr = "UPDATE CUSTOMER SET VANITYURLTEXT = $1 WHERE orgID = $2";
    //             // const queryStr = "UPDATE org_id SET VANITYURLTEXT = $1 WHERE orgID = $2";
    //             // const updateResult = await pgClient.query(queryStr, [customerName, orgId]);
    //             return ServerResponse.success('Updated successfully', customerName);
    //         }
    //     } finally {
    //         await utils.endClient(pgClient);
    //     }
    // }
    // public async isRegisteredUser(orgId): Promise<any> {
    //     const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
    //     try {
    //         await utils.connectClient(pgClient);
    //         // await pgClient.connect((err) => { throw new ConnectionError('Could not connect to database', err); });
    //         const queryStr = "SELECT VANITYURLTEXT FROM CUSTOMER WHERE ORGID = $1";
    //         const result = await pgClient.query(queryStr, [orgId]);
    //         if (result.rows.length > 0) {
    //             return { userRegistered: true, uniquekey: result.rows[0].vanityurltext };
    //         } else {
    //             return { userRegistered: false };
    //         }
    //     } finally {
    //         await utils.endClient(pgClient);
    //         // pgClient.end((err) => console.error('At End pgClient', err));
    //     }
    // }
}
