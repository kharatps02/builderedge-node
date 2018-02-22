import * as jsforce from 'jsforce';
import { ConnectionOptions } from 'jsforce/connection';
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
        public getAuthorizationUrl(params: { scope?: string, response_type?: string, client_id?: string, redirect_uri?: string }): string;
    }
    export class Connection implements jsforce.Connection {
        constructor(params: ConnectionOptions);
        public refreshToken: string;
        public accessToken: string;
        public instanceUrl: string;

        public authorize(code: string, callback?: (error: Error, userInfo: any) => void): Promise<TokenResponse>;
    }
}