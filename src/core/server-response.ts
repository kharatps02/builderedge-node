import { Enums } from './../config/enums';
export interface IServerResponse {
    status: Enums.RESPONSE_STATUS;
    message?: string;
    data?: any;
    error?: any;
}
export class ServerResponse implements IServerResponse {
    public status: Enums.RESPONSE_STATUS;
    public message?: string;
    public data?: any;
    public error?: any;
}
export namespace ServerResponse {
    export function error(message, error?): ServerResponse {
        return { status: Enums.RESPONSE_STATUS.ERROR, message, error };
    }
    export function success(message, data?): ServerResponse {
        return { status: Enums.RESPONSE_STATUS.SUCCESS, message, data };
    }
}
