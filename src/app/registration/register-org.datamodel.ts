import { ConnectionError, OrgError } from './../../utils/errors';
import { Client } from "pg";
import { Constants } from "../../config/constants";
import { Enums } from "../../config/enums";
import { utils } from '../../utils/utils';
import { Authentication } from '../../core/authentication/authentication';
import { IOrgMaster } from '../../core/models/org-master';

export class RegisterOrgDataModel {
    private auth: Authentication;

    constructor() {
        this.auth = new Authentication();
    }
    /**
     * oAuthCallback
     * @description Inserts/updates the org details to org_master along with Oauth details.
     * @param orgId Salesforce Org Id.
     * @param refreshToken Refresh token for the Integ User.
     * @param instanceUrl Instance URL for the org.
     * @param grantedUserId Granted User Id for the Integ User.
     * @param accessToken Access token for the Integ User.
     */
    public async registerOrg(orgId: string, refreshToken: string, instanceUrl: string, grantedUserId: string, accessToken: string): Promise<IOrgMaster> {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        try {
            const encryptedRefreshToken = utils.encryptCipher(refreshToken, Constants.ENCRYPTION.TOKEN_ENCRYPTION_KEY);
            const encryptedOrgId = utils.encryptCipher(orgId, Constants.ENCRYPTION.ORG_ID_ENCRYPTION_KEY);

            pgClient.connect();
            // Check if the org record already exists.
            const outerQueryStr = "SELECT vanity_id FROM org_master WHERE org_id = $1 limit 1";
            const result = await pgClient.query(outerQueryStr, [encryptedOrgId]);

            // let webFormLink = '';
            if (result.rows.length === 0) {
                // If the org record doesn't exist, then insert it.
                // tslint:disable-next-line:max-line-length
                const queryStr = "INSERT INTO org_master(org_id, refresh_token, api_base_url, user_id, event_endpoint_url, access_token) values($1, $2, $3, $4, $5, $6) RETURNING vanity_id";
                const queryRes = await pgClient.query(queryStr, [encryptedOrgId, encryptedRefreshToken, instanceUrl, grantedUserId, instanceUrl + '/cometd/40.0', accessToken]);
                return queryRes.rows[0];
            } else {
                // If the org record exists, then update it.
                const queryStr = "UPDATE org_master SET refresh_token = $1 WHERE org_id = $2 RETURNING vanity_id";
                const queryRes = await pgClient.query(queryStr, [encryptedRefreshToken, encryptedOrgId]);
                return queryRes.rows[0];
            }
        } finally {
            try {
                await pgClient.end();
            } finally { }
        }

    }
    /**
     * registeredSuccessfully
     * @description Validates the registered org.
     * @param vanityKey Vanity Key
     */
    public async registeredSuccessfully(vanityKey: any): Promise<IOrgMaster> {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        try {
            pgClient.connect();

            const queryStr = "SELECT * FROM org_master WHERE vanity_id = $1";
            const result = await pgClient.query(queryStr, [vanityKey]);
            // if org/user is valid
            if (result.rows.length > 0) {
                return result.rows[0];
            } else {
                throw new OrgError("Not a valid org.");
            }
        } finally {
            try {
                await pgClient.end();
            } finally { }
        }
    }
}
