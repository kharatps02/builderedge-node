import { ConnectionOptions, Connection as Conn } from 'jsforce/connection';
import { CoreOptions, RequestCallback } from 'request';
export { Date } from 'jsforce/date-enum';
export { Record } from 'jsforce/record';
export { RecordResult } from 'jsforce/record-result';
export { SObject } from 'jsforce/salesforce-object';
export { SalesforceId } from 'jsforce/salesforce-id';
declare module 'jsforce' {
    export interface OAuth2Options {
        loginUrl?: string;
        clientId?: string;
        clientSecret?: string;
        redirectUri?: string;
    }
    export interface TokenResponse {
        access_token: string;
        refresh_token: string;
    }
    export class OAuth2 {
        constructor(options: OAuth2Options)
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        authzServiceUrl: string;
        tokenServiceUrl: string;
        revokeServiceUrl: string;
        loginUrl: string;
        public getAuthorizationUrl(params: { scope?: string, response_type?: string, client_id?: string, redirect_uri?: string }): string;
        public refreshToken(refreshToken: string, callback: (err: any, res: any) => void): Promise<TokenResponse>;
        public requestToken(code: string, callback: (err: any, res: any) => void): Promise<TokenResponse>;
        public authenticate(username: string, password: string, callback: (err: any, res: any) => void): Promise<TokenResponse>;
        public revokeToken(accessToken: string, callback: (err: any, res: any) => void): Promise<any>;
    }
    export class Connection extends Conn {
        constructor(params: ConnectionOptions);
        public refreshToken: string;
        public accessToken: string;
        public instanceUrl: string;
        public oauth2: OAuth2;
        public authorize(code: string, callback?: (error: Error, userInfo: any) => void): Promise<TokenResponse>;
        public requestGet<T>(url: string, options?: CoreOptions, callback?: RequestCallback): Promise<T>;
        public requestPost<T>(url: string, body: any, options?: CoreOptions, callback?: RequestCallback): Promise<T>;
        public requestPut<T>(url: string, body: any, options?: CoreOptions, callback?: RequestCallback): Promise<T>;
        public requestPatch<T>(url: string, body: any, options?: CoreOptions, callback?: RequestCallback): Promise<T>;
        public requestDelete<T>(url: string, options?: CoreOptions, callback?: RequestCallback): Promise<T>;
    }
}