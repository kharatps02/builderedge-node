import { Client } from 'pg';
import { Constants } from '../../config/constants';
import { error } from 'util';
export class OrgMasterModel {

    constructor() {

    }

    public getAllOrgDetails(callback: (error: Error, results: IOrgMaster[]) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        const queryString = 'SELECT * FROM ORG_MASTER';
        const orgConfigMap = new Map<string, any>();

        pgClient.query(queryString, (error1, results) => {
            // console.log(results);
            // results.rows.forEach((row) => {
            //     orgConfigMap[row.vanity_id] = row;
            // });
            //  Constants.ORG_CONFIG_MAP = orgConfigMap;
            pgClient.end();
            callback(error1, results.rows);
        });
    }

    public getOrgConfigByUserId(userId: string, callback: (error: Error, config: IOrgMaster) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        const queryString = 'SELECT * FROM ORG_MASTER WHERE USER_ID=$1';
        const orgConfigMap = new Map<string, any>();
        pgClient.query(queryString, [userId], (error1, results) => {
            pgClient.end();
            console.log(results.rows[0]);
            callback(error1, results.rows[0]);
        });
    }
}
export interface IOrgMaster {
    vanity_id: string;
    api_base_url: string;
    access_token: string;
    user_id: string;
    refresh_token: string;
    event_endpoint_url: string;
    org_id?: string;
}
