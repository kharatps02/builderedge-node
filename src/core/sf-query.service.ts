import { ISFResponse, SFResponse } from './../app/db-sync/sf-response';
import * as rp from 'request-promise';
export class SFQueryService {

    public async getData<T>(
        url: string,
        accessToken: string,
        appendRecords?: T[],
        baseUrl?: string
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
