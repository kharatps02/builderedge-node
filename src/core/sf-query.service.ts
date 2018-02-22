import { ISFResponse, SFResponse } from './../app/db-sync/sf-response';
import * as rp from 'request-promise';
import * as jsforce from 'jsforce';
export class SFQueryService {

    /**
     * Get data using SOQL using jsforce from salesforce.
     * @param url Base URL for the org
     * @param accessToken
     * @param query query if any. SOQL
     */
    public async getDataAync<T>(url: string, accessToken: string, query: string) {
        const conn = new jsforce.Connection({
            instanceUrl: url,
            accessToken
        });
        // TODO: Add logoc to get data using jsforce here.
    }
    /**
     * Gets all data using HTTP request
     * @param url URL with/without query string
     * @param accessToken
     * @param appendRecords records to append to the given object. This is useful for pagination based responses.
     * @param baseUrl Base url for the salesforce org
     * @param qs query string
     * @param data data to be included in the request body
     * @param method HTTP method
     */
    public async getData<T>(
        url: string,
        accessToken: string,
        appendRecords?: T[],
        baseUrl?: string,
        qs?: string,
        data?: string,
        method?: 'post' | 'get' | 'update' | 'delete' | 'patch'
    ): Promise<ISFResponse<T>> {
        const options = {
            uri: url,
            headers: {
                "Authorization": "Bearer " + accessToken,
                "Content-Type": "application/json"
            },
            json: true // Automatically parses the JSON string in the response
        };
        try {
            let partialData = new SFResponse<T>();
            const response = await rp.get(options);
            if (!response) {
                throw new Error('No response');
            } else {
                if (typeof response === "string") {
                    partialData = JSON.parse(response) as ISFResponse<T>;
                } else {
                    partialData = response as ISFResponse<T>;
                }
                if (appendRecords && appendRecords.length > 0) {
                    partialData.records.push(...appendRecords);
                }
                return partialData;
            }
        } catch (error) {
            throw error;
        }
    }
}
