import { Client } from 'pg';
import { Constants } from '../../config/constants';
import { error } from 'util';

/**
 * @description Handles all database functions for OrgMaster table
 */
export class OrgMasterModel {

    constructor() {

    }
    /**
     * @description Gets the details of all the registered orgs.
     * @param callback callback function
     */
    public getAllOrgDetails(callback: (error: Error, results: IOrgMaster[]) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        // const queryString = 'SELECT DISTINCT ON (user_id) * FROM ORG_MASTER';
        const queryString = 'SELECT DISTINCT ON (org_id) * FROM ORG_MASTER';
        const orgConfigMap = new Map<string, any>();

        pgClient.query(queryString, (error1, results) => {
            pgClient.end();
            callback(error1, results.rows);
        });
    }
    public getOrgConfigByVanityId(vanityId: string, callback: (error: Error, config: IOrgMaster) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        const queryString = "SELECT * FROM ORG_MASTER WHERE $1 like vanity_id || '%'";
        const orgConfigMap = new Map<string, any>();
        pgClient.query(queryString, [vanityId], (error1, results) => {
            pgClient.end();
            // console.log(results.rows[0]);
            if (!error1 && results && results.rows.length > 0) {
                callback(error1, results.rows[0]);
            } else {
                callback(error1, null);
            }
        });
    }
    public getOrgConfigByOrgId(orgId: string, callback: (error: Error, config: IOrgMaster) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        const queryString = "SELECT * FROM ORG_MASTER WHERE $1 like ORG_ID || '%'";
        const orgConfigMap = new Map<string, any>();
        pgClient.query(queryString, [orgId], (error1, results) => {
            pgClient.end();
            // console.log(results.rows[0]);
            if (!error1 && results && results.rows.length > 0) {
                callback(error1, results.rows[0]);
            } else {
                callback(error1, null);
            }
        });
    }
}
export interface IOrgMaster {
    vanity_id: string;
    api_base_url: string;
    access_token: string;
    user_id?: string;
    refresh_token: string;
    event_endpoint_url: string;
    org_id: string;
}
