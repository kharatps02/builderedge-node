import { ISFResponse, SFResponse } from './../app/db-sync/sf-response';
import * as rp from 'request-promise';
import * as jsforce from 'jsforce';
import { StatusCodeError, RequestError, TransformError } from 'request-promise/errors';
import { OrgMasterModel } from '../app/org-master/org-master.model';
import { IOrgMaster } from './models/org-master';
import { Constants } from '../config/constants';
import { utils } from '../utils/utils';
import { AppError } from '../utils/errors';
export class SFQueryService {
    private orgMasterModel: OrgMasterModel;

    constructor() {
        this.orgMasterModel = new OrgMasterModel();
    }
    /**
     * getConnectionWithToken
     */
    public getConnectionWithToken(instanceUrl: string, accessToken?: string, refreshToken?: string) {
        return new jsforce.Connection({
            oauth2: {
                redirectUri: Constants.OAUTH.redirectUri,
                clientId: Constants.OAUTH.client_id,
                clientSecret: Constants.OAUTH.client_secret,
            },
            instanceUrl,
            refreshToken,
            accessToken
        });
    }
    /**
     * Gets connection object for specified org.
     * Pass either org id or vanity id.
     * @param orgId org Id 
     * @param vanityId vanity Id
     */
    public async getConnectionAsIntegUser(orgId?: string, vanityId?: string, callback?: (err?: Error, connection?: jsforce.Connection) => void): Promise<jsforce.Connection> {
        let orgConfig!: IOrgMaster;
        try {
            if (!(orgId || vanityId)) {
                throw new AppError("Could not locate the org.");
            }
            if (orgId) {
                orgConfig = await this.orgMasterModel.getOrgConfigByOrgIdAsync(orgId);
            } else if (vanityId) {
                orgConfig = await this.orgMasterModel.getOrgConfigByVanityId(vanityId);
            }
            const conn = this.getConnectionWithToken(orgConfig.api_base_url, orgConfig.access_token, orgConfig.refresh_token);
            if (callback) {
                callback(undefined, conn);
            }
            return conn;
        } catch (error) {
            if (callback) {
                callback(error);
            }
            throw error;
        }
    }

    /**
     * Gets all data using HTTP request
     * @param url URL with/without query string
     * @param accessToken
     * @param qs query string
     * @param body data to be included in the request body
     * @param method HTTP method
     */
    public async getDataUsingAccessToken<T>(
        url: string,
        accessToken: string,
        qs?: { [key: string]: any } | string,
        body?: string,
        method: 'post' | 'get' | 'update' | 'delete' | 'patch' = 'get'
    ): Promise<T> {
        const options = {
            uri: url,
            method,
            qs,
            body,
            headers: {
                "Authorization": "Bearer " + accessToken,
                "Content-Type": "application/json"
            },
            json: true // Automatically parses the JSON string in the response
        };
        try {
            const response = await rp(options);
            if (!response) {
                throw new AppError('No response');
            } else {
                return response as T;
            }
        } catch (error) {
            if (error instanceof StatusCodeError || error instanceof RequestError || error instanceof TransformError) {
                throw error.error || new AppError(error.message);
            }
            throw error;
        }
    }

    /**
     * Gets all data using HTTP request
     * @param url URL with/without query string
     * @param accessToken
     * @param appendRecords records to append to the given object. This is useful for pagination based responses.
     * @param qs query string
     * @param data data to be included in the request body
     * @param method HTTP method
     */
    public async getDataAppendRest<T>(
        url: string,
        accessToken: string,
        appendRecords?: T[],
        qs?: string,
        data?: string,
        method?: 'post' | 'get' | 'update' | 'delete' | 'patch'
    ): Promise<ISFResponse<T>> {
        try {
            const response = await this.getDataUsingAccessToken<ISFResponse<T>>(url, accessToken, qs, data, method);
            if (!response) {
                throw new AppError('No response');
            } else {
                if (appendRecords && appendRecords.length > 0) {
                    response.records.push(...appendRecords);
                }
                return response;
            }
        } catch (error) {
            throw error;
        }
    }
}
