export interface ISFEntity {
    Id: string;
    External_Id__c: string;
}
export namespace ISFEntity {
    export function swapSfId(item: { [key: string]: any }) {
        const externalId = item['External_Id__c'];
        item['External_Id__c'] = item['Id'];
        item['Id'] = externalId;
    }
}
